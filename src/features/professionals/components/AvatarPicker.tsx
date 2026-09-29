import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text, colors, spacing } from '@/shared/ui';
import { Avatar } from './Avatar';

type AvatarPickerProps = {
  uri: string | null;
  name: string;
  loading: boolean;
  onPress: () => void;
};

export function AvatarPicker({ uri, name, loading, onPress }: AvatarPickerProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={uri ? 'Trocar foto' : 'Adicionar foto'}
      disabled={loading}
      onPress={onPress}
      style={styles.container}
    >
      <View>
        <Avatar uri={uri} name={name} />
        <View style={styles.badge}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Ionicons name="camera" size={16} color={colors.onPrimary} />
          )}
        </View>
      </View>
      <Text variant="caption" weight="semibold" tone="primary">
        {uri ? 'Trocar foto' : 'Adicionar foto'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'center', alignItems: 'center', gap: spacing.sm },
  badge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.background,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
