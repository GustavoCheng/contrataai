import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { colors } from './theme';

export function LoadingView() {
  return (
    <View style={styles.fill}>
      <ActivityIndicator style={styles.fill} color={colors.primary} />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.fill}>
      <EmptyState
        icon="cloud-offline-outline"
        title="Não conseguimos carregar"
        description={message}
        action={<Button title="Tentar de novo" onPress={onRetry} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
});
