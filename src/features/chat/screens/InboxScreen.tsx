import { router } from 'expo-router';
import { useUserId } from '@/shared/hooks/useSession';
import { formatMessageTime } from '@/shared/lib/format';
import {
  EmptyState,
  ErrorView,
  LoadingView,
  ProfileRow,
  Screen,
  ScreenTitle,
  Text,
} from '@/shared/ui';
import { useConversations } from '../hooks/useChat';
import { otherParty } from '../otherParty';

/** Aba "Mensagens": conversas abertas depois de cada match, a mais recente no topo. */
export function InboxScreen({ area }: { area: 'restaurant' | 'professional' }) {
  const userId = useUserId();
  const conversations = useConversations();

  if (conversations.isPending) return <LoadingView />;
  if (conversations.isError) {
    return (
      <ErrorView message={conversations.error.message} onRetry={() => conversations.refetch()} />
    );
  }

  return (
    <Screen edges={['top']}>
      <ScreenTitle title="Mensagens" />
      {conversations.data.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="Nenhuma conversa ainda"
          description={
            area === 'restaurant'
              ? 'Quando você aceitar uma candidatura ou confirmar um freela, o chat abre aqui.'
              : 'Quando um restaurante aceitar sua candidatura ou confirmar seu freela, o chat abre aqui.'
          }
        />
      ) : (
        conversations.data.map((conversation) => {
          const party = otherParty(conversation, userId);
          return (
            <ProfileRow
              key={conversation.id}
              imageUri={party.imageUri}
              placeholderIcon={party.placeholderIcon}
              shape={party.shape}
              title={party.name}
              subtitle={conversation.last_message_body ?? 'Diga oi e combinem os detalhes.'}
              trailing={
                conversation.last_message_at && (
                  <Text variant="caption" tone="muted">
                    {formatMessageTime(conversation.last_message_at)}
                  </Text>
                )
              }
              onPress={() => router.push(`/${area}/chat/${conversation.id}`)}
            />
          );
        })
      )}
    </Screen>
  );
}
