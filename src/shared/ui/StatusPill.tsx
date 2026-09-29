import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, radius, spacing } from './theme';

export type StatusTone = 'neutral' | 'attention' | 'positive' | 'negative';

export const toneStyles: Record<StatusTone, { background: string; text: string }> = {
  neutral: { background: colors.surface, text: colors.text },
  attention: { background: colors.primarySoft, text: colors.primary },
  positive: { background: colors.successSoft, text: colors.success },
  negative: { background: colors.dangerSoft, text: colors.danger },
};

export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: StatusTone }) {
  const { background, text } = toneStyles[tone];
  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      <Text variant="caption" weight="semibold" style={[styles.label, { color: text }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Encolhe (e quebra a linha) quando divide a linha com um texto longo em tela estreita.
  pill: {
    alignSelf: 'flex-start',
    flexShrink: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  label: { textAlign: 'center' },
});
