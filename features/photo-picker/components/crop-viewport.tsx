import { Image } from "expo-image";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import {
  type CropTransform,
  type ImageSize,
  MAX_CROP_ZOOM,
  maxCropOffset,
  orientedSize,
} from "@/features/photo-picker/square-crop";

const SETTLE = { duration: 180 };

type CropViewportProps = {
  uri: string;
  /** Side of the square frame, in points. */
  side: number;
  imageSize: ImageSize;
  initial: CropTransform;
  /** The decoded size, which can differ from the library's (rotation). */
  onImageSize: (size: ImageSize) => void;
  /** Called with the resting transform after each gesture. Rotation and
   *  flip come from `initial`; re-key the viewport to change them. */
  onChange: (transform: CropTransform) => void;
};

/**
 * A square frame the photo can be dragged and pinched inside. It never lets
 * the photo uncover the frame: at rest the square is always filled. Key it by
 * photo so each one starts from its own saved transform.
 */
export function CropViewport({
  uri,
  side,
  imageSize,
  initial,
  onImageSize,
  onChange,
}: CropViewportProps) {
  const scale = useSharedValue(initial.scale);
  // Offsets in points here; the transform stores fractions of `side`.
  const x = useSharedValue(initial.x * side);
  const y = useSharedValue(initial.y * side);
  const { rotation, flipped } = initial;
  const oriented = orientedSize(imageSize, rotation);
  const size = useSharedValue(oriented);

  // The box takes the turned size; the photo inside keeps its own and is
  // rotated / flipped about the shared center.
  const short = Math.min(imageSize.width, imageSize.height);
  const baseWidth = (side * oriented.width) / short;
  const baseHeight = (side * oriented.height) / short;
  const photoWidth = (side * imageSize.width) / short;
  const photoHeight = (side * imageSize.height) / short;

  /** Springs back inside the limits; returns the resting transform. */
  const clampInPlace = (): CropTransform => {
    "worklet";
    const s = Math.min(Math.max(scale.value, 1), MAX_CROP_ZOOM);
    const max = maxCropOffset(size.value, s);
    const nx = Math.min(Math.max(x.value, -max.x * side), max.x * side);
    const ny = Math.min(Math.max(y.value, -max.y * side), max.y * side);
    scale.value = withTiming(s, SETTLE);
    x.value = withTiming(nx, SETTLE);
    y.value = withTiming(ny, SETTLE);
    return { scale: s, x: nx / side, y: ny / side, rotation, flipped };
  };

  const settle = () => {
    "worklet";
    runOnJS(onChange)(clampInPlace());
  };

  // The real decoded size can arrive after the first frame; re-fit to it.
  useEffect(() => {
    size.value = oriented;
    onChange(clampInPlace());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSize.width, imageSize.height]);

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onChange((e) => {
      x.value += e.changeX;
      y.value += e.changeY;
    })
    .onFinalize(settle);

  const pinch = Gesture.Pinch()
    .onChange((e) => {
      // Zoom around the fingers: keep the point under them still.
      const next = Math.min(
        Math.max(scale.value * e.scaleChange, 0.8),
        MAX_CROP_ZOOM * 1.2,
      );
      const k = next / scale.value;
      const fx = e.focalX - side / 2;
      const fy = e.focalY - side / 2;
      x.value = fx - (fx - x.value) * k;
      y.value = fy - (fy - y.value) * k;
      scale.value = next;
    })
    .onFinalize(settle);

  const photoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pan, pinch)}>
      <View style={[styles.frame, { width: side, height: side }]}>
        <Animated.View
          style={[
            {
              position: "absolute",
              width: baseWidth,
              height: baseHeight,
              left: (side - baseWidth) / 2,
              top: (side - baseHeight) / 2,
            },
            photoStyle,
          ]}
        >
          <Image
            source={{ uri }}
            style={{
              position: "absolute",
              width: photoWidth,
              height: photoHeight,
              left: (baseWidth - photoWidth) / 2,
              top: (baseHeight - photoHeight) / 2,
              // Applied right to left: rotate, then mirror as seen.
              transform: [
                { scaleX: flipped ? -1 : 1 },
                { rotate: `${rotation}deg` },
              ],
            }}
            contentFit="cover"
            onLoad={(e) => {
              const { width, height } = e.source;
              if (
                width > 0 &&
                height > 0 &&
                Math.abs(width / height - imageSize.width / imageSize.height) > 0.01
              ) {
                onImageSize({ width, height });
              }
            }}
          />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: "hidden", backgroundColor: "#000" },
});
