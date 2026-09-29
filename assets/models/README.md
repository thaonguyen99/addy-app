# On-device NSFW model

`nsfw-model.tflite` in this folder is GantMan/nsfw_model's MobileNetV2
224x224 classifier (~17 MB). `features/moderation/nsfw-model.ts` loads it
lazily and fails open (allows uploads through, logs a `console.warn`) if it
can't be loaded, so a broken asset never blocks uploads.

## Getting a real model

Run `python3 scripts/convert-nsfw-model.py` (repo root) to re-fetch it from
[GantMan/nsfw_model](https://github.com/GantMan/nsfw_model)'s 1.2.0 release,
which already ships a converted `.tflite` — stdlib Python only, no
TensorFlow needed.

**License note:** GitHub reports that repo's license as "Other /
NOASSERTION" — there's no clear OSS license on the model weights, even
though it's widely reused in hobby projects for this exact purpose. Read
the repo yourself and decide if that's acceptable before shipping it in
this app. If not, swap in a differently-licensed classifier and update
`CATEGORIES` in `features/moderation/check-image-safety.ts` to match its
output order/classes.

## Expected shape

`features/moderation/image-tensor.ts` and `check-image-safety.ts` assume:

- Input: 224x224 RGB, float32, normalized to `[0, 1]` (no mean subtraction)
- Output: 5-way softmax in the order `[drawings, hentai, neutral, porn, sexy]`

If you use a different model, update `MODEL_INPUT_SIZE`, the preprocessing
in `image-tensor.ts`, and `CATEGORIES`/thresholds in
`check-image-safety.ts` to match it.

## After replacing the file

This changes the native asset bundle, so run `npx expo prebuild --clean`
(or trigger a fresh EAS build) rather than relying on an OTA update — a
model swap doesn't count as a JS-only change.
