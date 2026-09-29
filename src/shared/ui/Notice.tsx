import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, radius, spacing } from './theme';

/** Aviso em linha para erros de envio de formulário. */
export function Notice({ message }: { message: string }) {
  return (
    <View style={styles.box} accessibilityRole="alert">
      <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
      <Text variant="caption" tone="danger" style={styles.text}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
  },
  text: { flex: 1 },
});
