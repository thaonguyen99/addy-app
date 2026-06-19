import type { PermissionResponse } from 'expo-modules-core';

/** Normalized camera gate used by UI — avoids scattering null checks. */
export type CameraPermissionGate =
  | { kind: 'pending'; response: null }
  | { kind: 'ready'; response: PermissionResponse; granted: boolean; canAskAgain: boolean };

/** Result of ensuring read access before opening the system photo picker. */
export type MediaLibraryAccessResult =
  | { access: 'granted' }
  | { access: 'denied'; canAskAgain: boolean };
