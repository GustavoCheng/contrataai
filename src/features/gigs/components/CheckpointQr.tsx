import { ActivityIndicator, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Button, Notice, Text, colors, radius, spacing } from '@/shared/ui';
import { useCheckpoint } from '../hooks/useGigs';
import type { CheckpointKind } from '../services/gigs.service';

const QR_SIZE = 220;

const labels: Record<CheckpointKind, string> = {
  check_in: 'QR de check-in',
  check_out: 'QR de check-out',
};

/** QR que o freelancer lê com o app. Renova sozinho enquanto está na tela e vale uma leitura. */
export function CheckpointQr({ gigId, kind }: { gigId: string; kind: CheckpointKind }) {
  const checkpoint = useCheckpoint(gigId, kind);

  if (checkpoint.isError) {
    return (
      <View style={styles.error}>
        <Notice message={checkpoint.error.message} />
        <Button variant="secondary" title="Gerar QR de novo" onPress={() => checkpoint.refetch()} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.qr} accessible accessibilityLabel={labels[kind]}>
        {checkpoint.isPending ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <QRCode
            value={checkpoint.data.token}
            size={QR_SIZE}
            color={colors.text}
            backgroundColor={colors.background}
          />
        )}
      </View>
      <Text variant="caption" tone="muted" style={styles.hint}>
        O QR se renova sozinho e vale para uma leitura.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  qr: { width: QR_SIZE, height: QR_SIZE, alignItems: 'center', justifyContent: 'center' },
  hint: { textAlign: 'center' },
  error: { gap: spacing.md },
});
