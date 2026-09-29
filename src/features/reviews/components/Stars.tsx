import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, colors, spacing } from '@/shared/ui';

const STARS = [1, 2, 3, 4, 5];
const STAR_TARGET = 44;

const starsLabel = (count: number) => (count === 1 ? '1 estrela' : `${count} estrelas`);

function Star({ filled, size }: { filled: boolean; size: number }) {
  return (
    <Ionicons
      name={filled ? 'star' : 'star-outline'}
      size={size}
      color={filled ? colors.text : colors.textMuted}
    />
  );
}

export function ReviewStars({ rating }: { rating: number }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={starsLabel(rating)}>
      {STARS.map((star) => (
        <Star key={star} filled={star <= rating} size={14} />
      ))}
    </View>
  );
}

type StarRatingInputProps = {
  value: number;
  onChange: (rating: number) => void;
  error?: string;
};

export function StarRatingInput({ value, onChange, error }: StarRatingInputProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Nota">
        {STARS.map((star) => (
          <Pressable
            key={star}
            accessibilityRole="radio"
            aria-checked={star === value}
            accessibilityLabel={starsLabel(star)}
            onPress={() => onChange(star)}
            style={({ pressed }) => [styles.star, pressed && styles.pressed]}
          >
            <Star filled={star <= value} size={32} />
          </Pressable>
        ))}
      </View>
      {error && (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.xs },
  star: {
    width: STAR_TARGET,
    height: STAR_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
});
