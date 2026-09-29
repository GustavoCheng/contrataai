import { type BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  EmptyState,
  LoadingView,
  Notice,
  Text,
  colors,
  radius,
  spacing,
} from '@/shared/ui';
import { useRedeemCheckpoint } from '../hooks/useGigs';

const FRAME_SIZE = 240;

/** Freelancer lê o QR de check-in ou check-out no celular do restaurante. */
export function ScanCheckpointScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraFailed, setCameraFailed] = useState(false);
  const redeem = useRedeemCheckpoint();
  // A câmera repete a leitura várias vezes por segundo; só a primeira vale até "Ler de novo".
  const reading = useRef(false);

  if (!permission) return <LoadingView />;

  if (!permission.granted) {
    return (
      <EmptyState
        icon="camera-outline"
        title="Permita o uso da câmera"
        description="A câmera lê o QR de check-in e check-out que aparece no celular do restaurante."
        action={
          permission.canAskAgain ? (
            <Button title="Permitir câmera" onPress={() => void requestPermission()} />
          ) : (
            <Button title="Abrir ajustes" onPress={() => void Linking.openSettings()} />
          )
        }
      />
    );
  }

  if (cameraFailed) {
    return (
      <EmptyState
        icon="camera-outline"
        title="Não conseguimos abrir a câmera"
        description="Feche outros apps que estejam usando a câmera e tente de novo."
        action={<Button title="Tentar de novo" onPress={() => setCameraFailed(false)} />}
      />
    );
  }

  const onScanned = ({ data }: BarcodeScanningResult) => {
    if (reading.current) return;
    reading.current = true;
    redeem.mutate(data, { onSuccess: () => router.back() });
  };

  const scanAgain = () => {
    reading.current = false;
    redeem.reset();
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={redeem.isIdle ? onScanned : undefined}
        onMountError={() => setCameraFailed(true)}
      />
      <View style={styles.viewfinder}>
        <View style={styles.frame} />
      </View>
      <SafeAreaView edges={['bottom']} style={styles.panel}>
        {redeem.isError ? (
          <>
            <Notice message={redeem.error.message} />
            <Button title="Ler de novo" onPress={scanAgain} />
          </>
        ) : (
          <Text tone="default" style={styles.hint} accessibilityLiveRegion="polite">
            {redeem.isPending
              ? 'Conferindo o QR…'
              : 'Aponte a câmera para o QR no celular do restaurante.'}
          </Text>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.text },
  viewfinder: { flex: 1, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: colors.background,
  },
  panel: {
    gap: spacing.md,
    padding: spacing.xl,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: colors.background,
  },
  hint: { textAlign: 'center' },
});
