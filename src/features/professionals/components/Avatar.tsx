import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Text, colors } from '@/shared/ui';

const SIZE = 96;

export function Avatar({ uri, name }: { uri: string | null; name: string }) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={styles.shape}
        contentFit="cover"
        transition={150}
        accessibilityLabel={`Foto de ${name}`}
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
  return (
    <View style={[styles.shape, styles.fallback]}>
      <Text variant="heading" weight="semibold" tone="primary">
        {initials || '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shape: { width: SIZE, height: SIZE, borderRadius: SIZE / 2 },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
});
