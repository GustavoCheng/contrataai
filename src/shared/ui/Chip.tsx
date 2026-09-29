import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, radius, spacing } from './theme';

type ChipProps = { label: string; selected?: boolean; onPress?: () => void };

/** Pílula de seleção (com onPress) ou de exibição (sem). Selecionado = tom escuro, não a cor de destaque. */
function Chip({ label, selected = false, onPress }: ChipProps) {
  const text = (
    <Text variant="caption" weight="semibold" tone={selected ? 'onPrimary' : 'default'}>
      {label}
    </Text>
  );
  if (!onPress) return <View style={styles.chip}>{text}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-selected={selected}
      hitSlop={spacing.xs}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      {text}
    </Pressable>
  );
}

type Option<T extends string> = { value: T; label: string };

type ChipSelectProps<T extends string> = {
  options: readonly Option<T>[];
  selected: readonly T[];
  onToggle: (value: T) => void;
  /** Uma linha com rolagem lateral (filtros), em vez de quebrar em várias linhas. */
  horizontal?: boolean;
};

export function ChipSelect<T extends string>({
  options,
  selected,
  onToggle,
  horizontal = false,
}: ChipSelectProps<T>) {
  const chips = options.map((option) => (
    <Chip
      key={option.value}
      label={option.label}
      selected={selected.includes(option.value)}
      onPress={() => onToggle(option.value)}
    />
  ));
  if (!horizontal) return <View style={styles.group}>{chips}</View>;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {chips}
    </ScrollView>
  );
}

export function ChipList({ labels }: { labels: string[] }) {
  return (
    <View style={styles.group}>
      {labels.map((label) => (
        <Chip key={label} label={label} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.text, borderColor: colors.text },
  pressed: { opacity: 0.7 },
});
