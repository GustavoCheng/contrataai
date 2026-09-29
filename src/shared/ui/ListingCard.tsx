import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Rating } from './Rating';
import { Text } from './Text';
import { colors, radius, spacing } from './theme';

type ListingCardProps = {
  imageUri: string | null;
  placeholderIcon: ComponentProps<typeof Ionicons>['name'];
  badge?: string;
  title: string;
  rating?: { average: number; count: number };
  lines: string[];
  highlight?: string;
  accessibilityLabel: string;
  onPress: () => void;
};

export function ListingCard({
  imageUri,
  placeholderIcon,
  badge,
  title,
  rating,
  lines,
  highlight,
  accessibilityLabel,
  onPress,
}: ListingCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name={placeholderIcon} size={40} color={colors.textMuted} />
          </View>
        )}
        {badge && (
          <View style={styles.badge}>
            <Text variant="caption" weight="semibold" tone="default">
              {badge}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.titleRow}>
        <Text weight="semibold" tone="default" style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {rating && <Rating average={rating.average} count={rating.count} />}
      </View>
      {lines.map((line) => (
        <Text key={line} tone="muted" numberOfLines={1}>
          {line}
        </Text>
      ))}
      {highlight && (
        <Text weight="semibold" tone="default">
          {highlight}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  pressed: { opacity: 0.8 },
  image: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg, marginBottom: spacing.sm },
  placeholder: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    boxShadow: '0px 2px 8px rgba(34, 34, 34, 0.12)',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1 },
});
