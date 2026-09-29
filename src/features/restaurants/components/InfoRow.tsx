import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, colors, spacing } from '@/shared/ui';

type InfoRowProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
};

export function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={22} color={colors.textMuted} />
      <View style={styles.texts}>
        <Text variant="caption" tone="muted">
          {label}
        </Text>
        <Text tone="default">{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' },
  texts: { flex: 1, gap: spacing.xs },
});
