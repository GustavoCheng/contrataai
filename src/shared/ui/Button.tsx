import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Text } from './Text';
import { colors, radius, spacing, touchHeight } from './theme';

type Variant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        (pressed || inactive) && styles.dimmed,
      ]}
    >
      {loading && (
        <ActivityIndicator color={variant === 'primary' ? colors.onPrimary : colors.primary} />
      )}
      <Text weight="semibold" tone={variant === 'primary' ? 'onPrimary' : 'primary'}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchHeight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primary: {
    backgroundColor: colors.primary,
    // Brilho sutil no topo do botão principal (skill: inner shadow branca)
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.25)',
  },
  secondary: { backgroundColor: colors.primarySoft },
  ghost: { backgroundColor: 'transparent' },
  dimmed: { opacity: 0.6 },
});
