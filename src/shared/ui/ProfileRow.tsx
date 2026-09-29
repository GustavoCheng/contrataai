import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Rating } from './Rating';
import { StatusPill, type StatusTone } from './StatusPill';
import { Text } from './Text';
import { colors, radius, spacing } from './theme';

type ProfileRowProps = {
  imageUri: string | null;
  placeholderIcon: ComponentProps<typeof Ionicons>['name'];
  /** Pessoa (foto redonda) ou loja (foto quadrada arredondada). */
  shape?: 'round' | 'square';
  title: string;
  subtitle?: string;
  rating?: { average: number; count: number };
  /** Selo de status abaixo do texto, para não disputar a linha com o título. */
  status?: { label: string; tone?: StatusTone };
  /** Algo curto à direita (hora, seta); sem isso, mostra a seta quando há onPress. */
  trailing?: ReactNode;
  onPress?: () => void;
};

export function ProfileRow({
  imageUri,
  placeholderIcon,
  shape = 'round',
  title,
  subtitle,
  rating,
  status,
  trailing,
  onPress,
}: ProfileRowProps) {
  const imageStyle = [styles.image, shape === 'round' ? styles.round : styles.square];
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={[title, subtitle].filter(Boolean).join(', ')}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={imageStyle} contentFit="cover" />
      ) : (
        <View style={[imageStyle, styles.placeholder]}>
          <Ionicons name={placeholderIcon} size={24} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.texts}>
        <Text weight="semibold" tone="default" numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {subtitle}
          </Text>
        )}
        {rating && <Rating average={rating.average} count={rating.count} />}
        {status && <StatusPill label={status.label} tone={status.tone} />}
      </View>
      {trailing ??
        (onPress && <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pressed: { opacity: 0.7 },
  image: { width: 56, height: 56 },
  round: { borderRadius: 28 },
  square: { borderRadius: radius.md },
  placeholder: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, gap: spacing.xs },
});
