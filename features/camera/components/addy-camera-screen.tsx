import { TabSwipe } from '@/components/navigation/tab-swipe';
import { IconCircleButton } from '@/components/ui/icon-circle-button';
import { AddyCameraView } from '@/features/camera/components/addy-camera-view';
import { CameraPermissionGatePanel } from '@/features/camera/components/camera-permission-gate-ui';
import { useAddyCameraScreen } from '@/hooks/use-addy-camera-screen';
import { safeBack } from '@/lib/safe-router';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const closeCamera = () => safeBack('/(app)/(tabs)/explore');

/** Full-screen quick-snap route: one shutter press goes straight to create. */
export function AddyCameraScreen() {
  const camera = useAddyCameraScreen();
  const { gate } = camera;

  let gatePanel: ReactNode = null;
  if (Platform.OS === 'web') {
    gatePanel = <CameraPermissionGatePanel variant="web" />;
  } else if (gate.kind === 'pending') {
    gatePanel = <CameraPermissionGatePanel variant="pending" />;
  } else if (gate.kind === 'ready' && !gate.granted) {
    gatePanel = (
      <CameraPermissionGatePanel
        variant="denied"
        canAskAgain={gate.canAskAgain}
        onRequestAccess={camera.requestCameraAccess}
        onOpenSettings={camera.openAppSettings}
      />
    );
  }

  // The camera sits between Map and Friends in the tab bar; swipe to either.
  // Paused mid-capture so a stray swipe can't drop the photo.
  return (
    <TabSwipe routeName="capture" disabled={camera.isBusy}>
      {gatePanel ? (
        // The live view draws its own close button; the gate panels need one too.
        <View style={styles.root}>
          {gatePanel}
          <SafeAreaView edges={['top']} style={styles.closeRow} pointerEvents="box-none">
            <IconCircleButton
              icon="close"
              size={36}
              accessibilityLabel="Close camera"
              onPress={closeCamera}
            />
          </SafeAreaView>
        </View>
      ) : (
        <AddyCameraView
          cameraRef={camera.cameraRef}
          isBusy={camera.isBusy}
          onCameraReady={camera.onCameraReady}
          onCapture={() => void camera.captureAndCreate()}
          onOpenGallery={() => void camera.pickFromGalleryAndCreate()}
          onClose={closeCamera}
          flash={camera.flash}
          onCycleFlash={camera.cycleFlash}
          facing={camera.facing}
          onFlipCamera={camera.flipCamera}
          zoom={camera.zoom}
          onZoomSet={camera.setZoomNormalized}
          availableLenses={camera.availableLenses}
          selectedLens={camera.selectedLens}
          onSelectLens={camera.setSelectedLens}
          onAvailableLensesChanged={camera.onAvailableLensesChanged}
        />
      )}
    </TabSwipe>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingLeft: 16,
    paddingTop: 8,
  },
});
