import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View } from 'react-native';
import { formatCnpj } from '@/shared/lib/cnpj';
import { formatTimeSince } from '@/shared/lib/format';
import { formatPlace } from '@/shared/lib/location';
import { imageUrl } from '@/shared/lib/storage';
import { Badge, Rating, Section, Text, radius, spacing } from '@/shared/ui';
import type { Restaurant } from '../services/restaurants.service';
import { InfoRow } from './InfoRow';
import { StoreCover } from './StoreCover';

/** Loja como os profissionais veem (também é a prévia na aba "Loja"). */
export function StoreProfileView({ restaurant }: { restaurant: Restaurant }) {
  return (
    <>
      <StoreCover path={restaurant.cover_path} name={restaurant.name} />

      {restaurant.restaurant_photos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
        >
          {restaurant.restaurant_photos.map((photo) => (
            <Image
              key={photo.id}
              source={{ uri: imageUrl('restaurant-photos', photo.path) }}
              style={styles.thumb}
              contentFit="cover"
              transition={150}
              accessibilityLabel={`Foto de ${restaurant.name}`}
            />
          ))}
        </ScrollView>
      )}

      <View style={styles.header}>
        <Text variant="title">{restaurant.name}</Text>
        <View style={styles.meta}>
          <Rating average={restaurant.rating_avg} count={restaurant.rating_count} />
          {restaurant.founded_on && (
            <Text variant="caption" tone="muted">
              · Em atividade {formatTimeSince(restaurant.founded_on)}
            </Text>
          )}
        </View>
        <Text variant="caption" tone="muted">
          {formatPlace(restaurant)}
        </Text>
      </View>

      <Badge icon="shield-checkmark-outline" label="CNPJ ativo na Receita Federal" />

      {restaurant.description && (
        <Section title="Sobre">
          <Text>{restaurant.description}</Text>
        </Section>
      )}

      <View style={styles.rows}>
        <InfoRow icon="location-outline" label="Endereço" value={formatStreet(restaurant)} />
        <InfoRow icon="business-outline" label="CNPJ" value={formatCnpj(restaurant.cnpj)} />
        <InfoRow icon="document-text-outline" label="Razão social" value={restaurant.legal_name} />
      </View>
    </>
  );
}

function formatStreet(restaurant: Restaurant): string {
  const street = [restaurant.street, restaurant.number, restaurant.complement]
    .filter(Boolean)
    .join(', ');
  return `${street} · ${formatPlace(restaurant)}`;
}

const styles = StyleSheet.create({
  strip: { gap: spacing.sm },
  thumb: { width: 160, height: 120, borderRadius: radius.md },
  header: { gap: spacing.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  rows: { gap: spacing.xl },
});
