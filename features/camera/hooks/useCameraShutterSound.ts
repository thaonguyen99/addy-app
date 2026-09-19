import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import { getRingerMode, RINGER_MODE } from "react-native-ringer-mode";

const SHUTTER_SOUND = require("../../../assets/sounds/addy-camera-snap-sound.mp3");

/**
 * Plays Addy's custom shutter sound on capture — but only when the device
 * is actually set to play sounds. iOS: `playsInSilentMode: false` hands
 * enforcement to the OS audio session, which mutes playback automatically
 * whenever the hardware mute switch is on. Android has no such switch, so
 * the ringer mode (silent/vibrate/normal) is checked explicitly before
 * every play — there's no single API that covers both platforms.
 */
export function useCameraShutterSound() {
  const playerRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: false }).catch(() => {});
    const player = createAudioPlayer(SHUTTER_SOUND);
    playerRef.current = player;
    return () => {
      player.remove();
      playerRef.current = null;
    };
  }, []);

  return useCallback(async () => {
    if (Platform.OS === "android") {
      try {
        const mode = await getRingerMode();
        if (mode !== undefined && mode !== RINGER_MODE.normal) {
          return;
        }
      } catch {
        // Ringer mode couldn't be read — fall through and play rather than
        // stay silent on a device that's actually expecting sound.
      }
    }

    const player = playerRef.current;
    if (!player) return;
    try {
      await player.seekTo(0);
      player.play();
    } catch {
      // Playback failures shouldn't block taking the photo.
    }
  }, []);
}
