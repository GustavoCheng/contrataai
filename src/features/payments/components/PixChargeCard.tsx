import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text, colors, radius, spacing } from '@/shared/ui';
import type { PixCharge } from '../services/payments.service';
import { useCopyPix } from './CopyPixButton';

/** QR do Pix e o código Copia e Cola, para pagar de outro aparelho ou colando no app do banco. */
export function PixChargeCard({ charge }: { charge: PixCharge }) {
  const { copied, copy } = useCopyPix(charge.copyPaste);
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: `data:image/png;base64,${charge.qrCodeImage}` }}
        style={styles.qr}
        contentFit="contain"
        accessibilityLabel="QR Code do Pix"
      />
      <View style={styles.code}>
        <View style={styles.codeHeader}>
          <Text variant="caption" weight="semibold" tone="muted">
            Pix Copia e Cola
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Copiar código Pix"
            hitSlop={spacing.sm}
            onPress={copy}
            style={styles.copy}
          >
            <Ionicons
              name={copied ? 'checkmark' : 'copy-outline'}
              size={16}
              color={colors.primary}
            />
            <Text variant="caption" weight="semibold" tone="primary">
              {copied ? 'Copiado' : 'Copiar'}
            </Text>
          </Pressable>
        </View>
        <Text variant="caption" tone="body" selectable style={styles.codeText}>
          {charge.copyPaste}
        </Text>
      </View>
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
  qr: { width: '70%', maxWidth: 240, aspectRatio: 1 },
  code: {
    alignSelf: 'stretch',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  codeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  copy: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 32 },
  codeText: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  waitingText: { flex: 1 },
});
