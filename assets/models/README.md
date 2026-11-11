# On-device NSFW model

`nsfw-model.tflite` in this folder is Yahoo's open_nsfw classifier, converted
to TFLite with dynamic-range quantization (~6 MB).
`features/moderation/nsfw-model.ts` loads it lazily and fails open (allows
uploads through, logs a `console.warn`) if it can't be loaded, so a broken
asset never blocks uploads.

A flagged photo is a warning, not a block: the user sees "Choose another" /
"Post anyway" (`features/moderation/confirm-flagged-photos.ts`). Every on-device
model has false positives, and user reports are the backstop.

## Why this model

It replaced GantMan/nsfw_model's MobileNetV2, which scored an ordinary ear
close-up as porn at 0.86–0.99. open_nsfw scored the same photo 0.24–0.37,
under the 0.8 threshold. NudeNet also passed it, but its weights are stamped
AGPL-3.0 (trained with Ultralytics YOLOv8), so it can't be bundled here.

**License:** weights BSD-2-Clause ([yahoo/open_nsfw](https://github.com/yahoo/open_nsfw)),
Keras port MIT ([bhky/opennsfw2](https://github.com/bhky/opennsfw2)).

## Rebuilding it

```bash
uv run -p cpython-3.11-macos-aarch64-none --with opennsfw2 --with tensorflow python scripts/convert-nsfw-model.py
```

## Expected shape

`features/moderation/image-tensor.ts` and `check-image-safety.ts` assume:

- Input: float32 `[1, 224, 224, 3]`. The image is resized to 256x256,
  round-tripped through JPEG (quality 75), center-cropped to 224x224, then
  converted to BGR with means `[104, 117, 123]` subtracted from 0-255 values.
- Output: 2-way softmax `[sfw, nsfw]`. Flagged when `nsfw > 0.8`.

If you use a different model, update the preprocessing in `image-tensor.ts`
and the output index/threshold in `check-image-safety.ts` to match it.

## After replacing the file

This changes the native asset bundle, so run `npx expo prebuild --clean`
(or trigger a fresh EAS build) rather than relying on an OTA update — a
model swap doesn't count as a JS-only change.
