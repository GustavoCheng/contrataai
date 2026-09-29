import { StyleSheet, View } from 'react-native';
import { formatMessageTime } from '@/shared/lib/format';
import { Text, colors, radius, spacing } from '@/shared/ui';
import type { Message } from '../services/chat.service';

/** Minha mensagem à direita (tom escuro), a do outro lado à esquerda (cinza claro). */
export function MessageBubble({ message, mine }: { message: Message; mine: boolean }) {
  return (
    <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
      <Text tone={mine ? 'onPrimary' : 'default'}>{message.body}</Text>
      <Text variant="caption" style={mine ? styles.timeMine : styles.timeTheirs}>
        {formatMessageTime(message.created_at)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.text,
    borderBottomRightRadius: spacing.xs,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderBottomLeftRadius: spacing.xs,
  },
  timeMine: { color: 'rgba(255, 255, 255, 0.7)', alignSelf: 'flex-end' },
  timeTheirs: { color: colors.textMuted, alignSelf: 'flex-end' },
});
