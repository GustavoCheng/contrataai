import { Pressable, StyleSheet, View } from 'react-native';
import { StatusPill, type StatusTone } from './StatusPill';
import { Text } from './Text';
import { colors, radius, spacing } from './theme';

type ListRowProps = {
  title: string;
  status: { label: string; tone?: StatusTone };
  subtitle: string;
  /** Linha de apoio, em destaque quando há novidade (ex.: candidaturas recebidas). */
  detail?: { text: string; highlight: boolean };
  accessibilityLabel: string;
  onPress: () => void;
};

export function ListRow({
  title,
  status,
  subtitle,
  detail,
  accessibilityLabel,
  onPress,
}: ListRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <Text weight="semibold" tone="default" style={styles.title}>
          {title}
        </Text>
        <StatusPill label={status.label} tone={status.tone} />
      </View>
      <Text tone="muted">{subtitle}</Text>
      {detail && (
        <Text variant="caption" weight="semibold" tone={detail.highlight ? 'primary' : 'muted'}>
          {detail.text}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1 },
});
