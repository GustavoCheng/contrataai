import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text, colors, radius, spacing } from '@/shared/ui';
import type { PixCharge } from '../services/payments.service';

/** QR do Pix para pagar de outro aparelho e o aviso de que a tela atualiza sozinha. */
export function PixChargeCard({ charge }: { charge: PixCharge }) {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: `data:image/png;base64,${charge.qrCodeImage}` }}
        style={styles.qr}
        contentFit="contain"
        accessibilityLabel="QR Code do Pix"
      />
      <View style={styles.waiting} accessibilityLiveRegion="polite">
        <ActivityIndicator color={colors.primary} />
        <Text variant="caption" tone="body" style={styles.waitingText}>
          Aguardando o Pix. Esta tela atualiza sozinha quando o pagamento cair.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  qr: { width: 200, height: 200 },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  waitingText: { flex: 1 },
});
