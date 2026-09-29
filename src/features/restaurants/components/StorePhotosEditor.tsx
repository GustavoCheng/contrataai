import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { imageUrl } from '@/shared/lib/storage';
import { Button, Notice, Section, Text, colors, radius, spacing } from '@/shared/ui';
import { useAddStorePhoto, useRemoveStorePhoto, useReplaceCover } from '../hooks/useRestaurant';
import type { Restaurant } from '../services/restaurants.service';
import { StoreCover } from './StoreCover';

/** Capa e galeria: cada ação salva na hora, sem esperar o botão do formulário. */
export function StorePhotosEditor({ restaurant }: { restaurant: Restaurant }) {
  const cover = useReplaceCover(restaurant.id);
  const addPhoto = useAddStorePhoto(restaurant.id);
  const removePhoto = useRemoveStorePhoto(restaurant.id);
  const photos = restaurant.restaurant_photos;
  const error = cover.error ?? addPhoto.error ?? removePhoto.error;

  return (
    <Section title="Fotos" hint="A capa é a primeira coisa que os profissionais veem.">
      {error && <Notice message={error.message} />}
      <StoreCover path={restaurant.cover_path} name={restaurant.name} />
      <Button
        variant="secondary"
        title={restaurant.cover_path ? 'Trocar capa' : 'Adicionar capa'}
        loading={cover.isPending}
        onPress={() => cover.mutate(restaurant.cover_path)}
      />

      <Text weight="semibold" tone="default">
        Galeria (fachada, cozinha, salão)
      </Text>
      <View style={styles.grid}>
        {photos.map((photo) => (
          <View key={photo.id} style={styles.tile}>
            <Image
              source={{ uri: imageUrl('restaurant-photos', photo.path) }}
              style={styles.image}
              contentFit="cover"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remover foto"
              hitSlop={spacing.md}
              disabled={removePhoto.isPending}
              onPress={() => removePhoto.mutate(photo)}
              style={styles.remove}
            >
              <Ionicons name="close" size={16} color={colors.onPrimary} />
            </Pressable>
          </View>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adicionar foto à galeria"
          disabled={addPhoto.isPending}
          onPress={() => addPhoto.mutate(photos.length)}
          style={[styles.tile, styles.add]}
        >
          {addPhoto.isPending ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Ionicons name="add" size={28} color={colors.primary} />
          )}
        </Pressable>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { width: '31%', aspectRatio: 4 / 3, borderRadius: radius.md, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  remove: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 34, 34, 0.7)',
  },
  add: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
});
