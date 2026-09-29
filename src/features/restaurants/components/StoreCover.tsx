import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { imageUrl } from '@/shared/lib/storage';
import { colors, radius } from '@/shared/ui';

/** Foto de capa 4:3 (a "foto grande" dos cards estilo Airbnb) ou um espaço reservado. */
export function StoreCover({ path, name }: { path: string | null; name: string }) {
  if (!path) {
    return (
      <View style={[styles.cover, styles.placeholder]}>
        <Ionicons name="storefront-outline" size={40} color={colors.textMuted} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri: imageUrl('restaurant-photos', path) }}
      style={styles.cover}
      contentFit="cover"
      transition={150}
      accessibilityLabel={`Capa de ${name}`}
    />
  );
}

const styles = StyleSheet.create({
  cover: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg },
  placeholder: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
