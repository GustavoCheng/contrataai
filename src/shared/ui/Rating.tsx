import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, spacing } from './theme';

/** "★ 4,8 (12)" ou "★ Novo" enquanto não há avaliações. */
export function Rating({ average, count }: { average: number; count: number }) {
  const label = count > 0 ? `${average.toFixed(1).replace('.', ',')} (${count})` : 'Novo';
  return (
    <View style={styles.row} accessibilityLabel={count > 0 ? `Nota ${label}` : 'Sem avaliações'}>
      <Ionicons name="star" size={14} color={colors.text} />
      <Text variant="caption" weight="semibold" tone="default">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
