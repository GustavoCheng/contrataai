import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { Text, colors, radius, spacing } from '@/shared/ui';
import { maskPixKey, pixKeyTypeLabels } from '../pix';
import type { ProfessionalSettings } from '../services/professionals.service';

type Payout = ProfessionalSettings['payout_accounts'];

/** Só o dono vê: confirma a chave de repasse ou avisa que falta cadastrar. */
export function PixKeyStatus({ payout }: { payout: Payout }) {
  return (
    <View style={[styles.box, !payout && styles.missing]}>
      <Ionicons
        name={payout ? 'shield-checkmark-outline' : 'alert-circle-outline'}
        size={22}
        color={payout ? colors.text : colors.danger}
      />
      <View style={styles.texts}>
        <Text weight="semibold" tone={payout ? 'default' : 'danger'}>
          {payout ? 'Chave Pix cadastrada' : 'Cadastre sua chave Pix'}
        </Text>
        <Text variant="caption" tone="muted">
          {payout
            ? `${pixKeyTypeLabels[payout.pix_key_type]} ${maskPixKey(payout.pix_key_type, payout.pix_key)} · só você vê`
            : 'Sem ela você não consegue aceitar freelas.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  missing: { backgroundColor: colors.dangerSoft },
  texts: { flex: 1, gap: spacing.xs },
});
