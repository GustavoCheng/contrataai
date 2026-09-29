import { Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserId } from '@/shared/hooks/useSession';
import { Notice, QueryFallback, Text, colors, spacing } from '@/shared/ui';
import { MessageBubble } from '../components/MessageBubble';
import { MessageComposer } from '../components/MessageComposer';
import { useConversation, useMessages, useSendMessage } from '../hooks/useChat';
import { otherParty } from '../otherParty';

const HEADER_HEIGHT = 44;

export function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useUserId();
  const insets = useSafeAreaInsets();
  const conversation = useConversation(id);
  const messages = useMessages(id);
  const send = useSendMessage(id);

  if (!conversation.isSuccess || !messages.isSuccess) {
    return <QueryFallback queries={[conversation, messages]} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: otherParty(conversation.data, userId).title }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + HEADER_HEIGHT}
      >
        <FlatList
          inverted
          data={messages.data}
          keyExtractor={(message) => message.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} mine={item.sender_id === userId} />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text tone="muted" style={styles.empty}>
              Diga oi e combinem os detalhes do trabalho por aqui.
            </Text>
          }
        />
        {send.error && <Notice message={send.error.message} />}
        <MessageComposer sending={send.isPending} onSend={(body) => send.mutate(body)} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  list: { flexGrow: 1, padding: spacing.lg, gap: spacing.sm },
  empty: { textAlign: 'center' },
});
