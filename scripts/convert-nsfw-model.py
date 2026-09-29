#!/usr/bin/env python3
"""Fetches GantMan/nsfw_model's MobileNetV2 224x224 TFLite model.

Produces assets/models/nsfw-model.tflite, which features/moderation/
nsfw-model.ts loads at runtime via react-native-fast-tflite.

The 1.2.0 GitHub release already ships a converted `saved_model.tflite`
(float32 [1, 224, 224, 3] in, [1, 5] softmax out), so no TensorFlow install
or conversion is needed — just stdlib Python. Run once, locally (not part of
the app build):

    python3 scripts/convert-nsfw-model.py

Before you run this: GantMan/nsfw_model's GitHub repo does not carry a
clear OSS license (GitHub reports "Other / NOASSERTION"), even though it's
widely used in hobby/personal projects for exactly this purpose. Read
https://github.com/GantMan/nsfw_model yourself and decide whether that's
acceptable for this app before bundling its weights and shipping to users.
If not, source a differently-licensed 224x224x3 RGB, [0,1]-normalized,
5-or-fewer-class NSFW classifier and adjust CATEGORIES in
features/moderation/check-image-safety.ts to match its output order.
"""

import io
import urllib.request
import zipfile

# The old s3.amazonaws.com/ir_public/nsfwjscdn/*.h5 URL now returns 403.
SOURCE_ZIP_URL = (
    "https://github.com/GantMan/nsfw_model/releases/download/1.2.0/"
    "mobilenet_v2_140_224.1.zip"
)
MODEL_MEMBER = "mobilenet_v2_140_224/saved_model.tflite"
LABELS_MEMBER = "mobilenet_v2_140_224/class_labels.txt"
OUTPUT_PATH = "assets/models/nsfw-model.tflite"

# Must match CATEGORIES in features/moderation/check-image-safety.ts.
EXPECTED_LABELS = ["drawings", "hentai", "neutral", "porn", "sexy"]


def main() -> None:
    print(f"Downloading {SOURCE_ZIP_URL} (~100 MB)...")
    with urllib.request.urlopen(SOURCE_ZIP_URL) as response:
        archive = zipfile.ZipFile(io.BytesIO(response.read()))

    labels = archive.read(LABELS_MEMBER).decode().split()
    if labels != EXPECTED_LABELS:
        raise SystemExit(
            f"Unexpected class order {labels}; update CATEGORIES in "
            "features/moderation/check-image-safety.ts before using this model."
        )

    tflite_model = archive.read(MODEL_MEMBER)
    with open(OUTPUT_PATH, "wb") as f:
        f.write(tflite_model)

    print(f"Wrote {OUTPUT_PATH} ({len(tflite_model) / 1e6:.1f} MB)")
    print(f"Output classes (fixed order): {', '.join(labels)}")


if __name__ == "__main__":
    main()
