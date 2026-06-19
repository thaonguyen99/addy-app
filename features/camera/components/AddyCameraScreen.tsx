import { AddyCameraView } from '@/features/camera/components/addy-camera-view';
import { CameraPermissionGatePanel } from '@/features/camera/components/camera-permission-gate-ui';
import { useAddyCameraScreen } from '@/features/camera/hooks/useAddyCameraScreen';
import { Platform } from 'react-native';

export function AddyCameraScreen() {
  const {
    cameraRef,
    gate,
    requestCameraAccess,
    onCameraReady,
    frameSize,
    capturedPhotos,
    isCapturing,
    openPhotoSelection,
    captureAndStore,
    flash,
    zoom,
    cycleFlash,
    zoomOut,
    zoomIn,
    setZoomNormalized,
    facing,
    flipCamera,
  } = useAddyCameraScreen();

  if (Platform.OS === 'web') {
    return <CameraPermissionGatePanel variant="web" />;
  }

  if (gate.kind === 'pending') {
    return <CameraPermissionGatePanel variant="pending" />;
  }

  if (gate.kind === 'ready' && !gate.granted) {
    return (
      <CameraPermissionGatePanel
        variant="denied"
        canAskAgain={gate.canAskAgain}
        onRequestAccess={requestCameraAccess}
      />
    );
  }

  return (
    <AddyCameraView
      cameraRef={cameraRef}
      frameSize={frameSize}
      capturedPhotos={capturedPhotos}
      isCapturing={isCapturing}
      onCameraReady={onCameraReady}
      onCapture={captureAndStore}
      onOpenSelection={openPhotoSelection}
      flash={flash}
      facing={facing}
      onFlipCamera={flipCamera}
      zoom={zoom}
      onCycleFlash={cycleFlash}
      onZoomOut={zoomOut}
      onZoomIn={zoomIn}
      onZoomSet={setZoomNormalized}
    />
  );
}
