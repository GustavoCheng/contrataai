import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { spacing } from './theme';

type SectionProps = { title: string; hint?: string; children: ReactNode };

export function Section({ title, hint, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant="heading" accessibilityRole="header">
          {title}
        </Text>
        {hint && (
          <Text variant="caption" tone="muted">
            {hint}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.lg },
  header: { gap: spacing.xs },
});
