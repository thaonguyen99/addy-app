#!/usr/bin/env python3
"""Builds assets/models/nsfw-model.tflite from Yahoo's open_nsfw weights.

features/moderation/nsfw-model.ts loads the result at runtime via
react-native-fast-tflite.

Source: Yahoo's open_nsfw (https://github.com/yahoo/open_nsfw, weights under
BSD-2-Clause), through the Keras port `opennsfw2`
(https://github.com/bhky/opennsfw2, MIT), which downloads the weights on first
use (~24 MB, cached in ~/.opennsfw2). The model is converted with dynamic-range
quantization, which brings it to ~6 MB while staying within a few hundredths of
the float model's scores.

Contract (keep features/moderation/image-tensor.ts and check-image-safety.ts
in sync with it):
  - Input: float32 [1, 224, 224, 3], BGR, per-channel mean [104, 117, 123]
    subtracted from 0-255 values (no scaling), after a 256x256 resize, a JPEG
    round trip and a 224x224 center crop.
  - Output: float32 [1, 2] softmax, [sfw, nsfw].

Run once, locally (not part of the app build). TensorFlow needs a native
arm64 Python on Apple silicon, so pin the interpreter:

    uv run -p cpython-3.11-macos-aarch64-none --with opennsfw2 \\
        --with tensorflow python scripts/convert-nsfw-model.py
"""

import os

import opennsfw2
import tensorflow as tf

OUTPUT_PATH = "assets/models/nsfw-model.tflite"


def main() -> None:
    model = opennsfw2.make_open_nsfw_model()

    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()

    with open(OUTPUT_PATH, "wb") as f:
        f.write(tflite_model)

    print(f"Wrote {OUTPUT_PATH} ({os.path.getsize(OUTPUT_PATH) / 1e6:.1f} MB)")
    print("Output classes (fixed order): sfw, nsfw")


if __name__ == "__main__":
    main()
