import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, colors, spacing } from '@/shared/ui';

const STARS = [1, 2, 3, 4, 5];
const STAR_TARGET = 44;

type StarRatingInputProps = {
  value: number;
  onChange: (rating: number) => void;
  error?: string;
};

/** Nota de 1 a 5 com alvos de toque de 44pt. */
export function StarRatingInput({ value, onChange, error }: StarRatingInputProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Nota">
        {STARS.map((star) => (
          <Pressable
            key={star}
            accessibilityRole="radio"
            aria-checked={star === value}
            accessibilityLabel={star === 1 ? '1 estrela' : `${star} estrelas`}
            onPress={() => onChange(star)}
            style={({ pressed }) => [styles.star, pressed && styles.pressed]}
          >
            <Ionicons
              name={star <= value ? 'star' : 'star-outline'}
              size={32}
              color={star <= value ? colors.text : colors.textMuted}
            />
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
