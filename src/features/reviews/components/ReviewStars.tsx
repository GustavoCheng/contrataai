import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/shared/ui';

const STARS = [1, 2, 3, 4, 5];

/** Nota de uma avaliação em estrelas (só leitura). */
export function ReviewStars({ rating }: { rating: number }) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={rating === 1 ? '1 estrela' : `${rating} estrelas`}
    >
      {STARS.map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={14}
          color={star <= rating ? colors.text : colors.textMuted}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs },
});
