import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, spacing } from './theme';

type CepStatusProps = { loading: boolean; error: string | null; place: string | null };

/** Linha abaixo do campo de CEP: buscando, erro ou o lugar encontrado. */
export function CepStatus({ loading, error, place }: CepStatusProps) {
  if (loading) {
    return (
      <View style={styles.row}>
        <ActivityIndicator size="small" color={colors.textMuted} />
        <Text variant="caption" tone="muted">
          Buscando endereço…
        </Text>
      </View>
    );
  }
  if (error) {
    return (
      <Text variant="caption" tone="danger">
        {error}
      </Text>
    );
  }
  if (!place) return null;
  return (
    <View style={styles.row}>
      <Ionicons name="location-outline" size={16} color={colors.text} />
      <Text variant="caption" weight="semibold" tone="default">
        {place}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
