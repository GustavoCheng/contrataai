import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors } from './theme';

type AvatarProps = { uri: string | null; name: string; size?: number };

/** Foto da pessoa; sem foto, as iniciais (skill: foto > iniciais > ícone genérico). */
export function Avatar({ uri, name, size = 64 }: AvatarProps) {
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={shape}
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
    <View style={[styles.fallback, shape]}>
      <Text variant={size >= 64 ? 'heading' : 'body'} weight="semibold" tone="primary">
        {initials || '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
});
