import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, radius, spacing } from './theme';

type BadgeProps = { icon: ComponentProps<typeof Ionicons>['name']; label: string };

export function Badge({ icon, label }: BadgeProps) {
  return (
    <View style={styles.badge}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text variant="caption" weight="semibold" tone="primary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
});
