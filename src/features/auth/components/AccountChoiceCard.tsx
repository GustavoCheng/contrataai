import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, colors, radius, shadow, spacing } from '@/shared/ui';

type AccountChoiceCardProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  onPress: () => void;
};

export function AccountChoiceCard({ icon, title, description, onPress }: AccountChoiceCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <View style={styles.texts}>
        <Text weight="semibold" tone="default">
          {title}
        </Text>
        <Text variant="caption" tone="muted">
          {description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    ...shadow.card,
  },
  pressed: { opacity: 0.7 },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  texts: { flex: 1, gap: spacing.xs },
});
