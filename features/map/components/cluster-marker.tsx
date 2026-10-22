import { memo } from "react";

import { MapPhotoPin } from "@/features/map/components/map-photo-pin";
import { getPinColor } from "@/features/map/utils/pin-color";

type ClusterablePin = {
  id: string;
  imageUrl: string;
  capturedAt: string;
  memoryCount: number;
};

/** Newest pin in a group — its cover represents the whole cluster. */
export function latestPin<T extends ClusterablePin>(pins: readonly T[]): T {
  return pins.reduce((latest, pin) =>
    pin.capturedAt > latest.capturedAt ? pin : latest,
  );
}

/** Total memories in a group (a pin can already stand for several at one place). */
export function clusterMemoryCount(pins: readonly ClusterablePin[]): number {
  return pins.reduce((sum, pin) => sum + Math.max(1, pin.memoryCount), 0);
}

type ClusterPhotoPinProps = {
  pins: readonly ClusterablePin[];
};

/**
 * A grouped map pin looks exactly like a single pin: the latest memory's
 * cover, with the navy count badge showing how many memories it holds.
 */
export const ClusterPhotoPin = memo(function ClusterPhotoPin({
  pins,
}: ClusterPhotoPinProps) {
  const cover = latestPin(pins);
  return (
    <MapPhotoPin
      imageUrl={cover.imageUrl}
      pinColor={getPinColor(cover)}
      placeMemoryCount={clusterMemoryCount(pins)}
    />
  );
});
