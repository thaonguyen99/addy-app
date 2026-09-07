import { useCameraPermissions } from 'expo-camera';
import type { PermissionResponse } from 'expo-modules-core';
import { useMemo } from 'react';

import type { CameraPermissionGate } from '@/features/camera/permissions/types';

/**
 * Normalizes expo-camera permission into a small discriminated union for UI branches.
 */
export function useCameraPermissionGate(): {
  gate: CameraPermissionGate;
  requestPermission: () => Promise<PermissionResponse>;
  refreshPermission: () => Promise<PermissionResponse>;
} {
  const [response, requestPermission, getPermission] = useCameraPermissions();

  const gate = useMemo((): CameraPermissionGate => {
    if (response === null) {
      return { kind: 'pending', response: null };
    }
    return {
      kind: 'ready',
      response,
      granted: response.granted,
      canAskAgain: response.canAskAgain ?? true,
    };
  }, [response]);

  return { gate, requestPermission, refreshPermission: getPermission };
}
