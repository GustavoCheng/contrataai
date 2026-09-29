import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { spacing } from './theme';

export function ScreenTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.container}>
      <Text variant="title" accessibilityRole="header">
        {title}
      </Text>
      {subtitle && <Text>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
});
