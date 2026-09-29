import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, fontSize, radius, spacing, touchHeight } from '@/shared/ui';

type Props = { sending: boolean; onSend: (body: string) => void };

export function MessageComposer({ sending, onSend }: Props) {
  const [draft, setDraft] = useState('');
  const body = draft.trim();
  const disabled = !body || sending;

  const send = () => {
    if (disabled) return;
    onSend(body);
    setDraft('');
  };

  return (
    <View style={styles.bar}>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder="Escreva uma mensagem"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Mensagem"
        multiline
        maxLength={2000}
        style={styles.input}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Enviar mensagem"
        disabled={disabled}
        onPress={send}
        style={[styles.send, disabled && styles.disabled]}
      >
        {sending ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Ionicons name="arrow-up" size={22} color={colors.onPrimary} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    minHeight: touchHeight - 8,
    maxHeight: 120,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    fontSize: fontSize.body,
    color: colors.text,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  disabled: { opacity: 0.4 },
});
