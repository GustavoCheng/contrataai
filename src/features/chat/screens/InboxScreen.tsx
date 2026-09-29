import { router } from 'expo-router';
import { useUserId } from '@/shared/hooks/useSession';
import { formatMessageTime } from '@/shared/lib/format';
import { EmptyState, ProfileRow, QueryFallback, Screen, ScreenTitle, Text } from '@/shared/ui';
import { useConversations } from '../hooks/useChat';
import { otherParty } from '../otherParty';
import type { AccountType } from '@/shared/lib/labels';

function InboxScreen({ area }: { area: AccountType }) {
  const userId = useUserId();
  const conversations = useConversations();

  if (!conversations.isSuccess) return <QueryFallback queries={[conversations]} />;

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
        conversations.data.map((conversation) => (
          <ProfileRow
            key={conversation.id}
            {...otherParty(conversation, userId)}
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
        ))
      )}
    </Screen>
  );
}

export const RestaurantInboxScreen = () => <InboxScreen area="restaurant" />;

export const ProfessionalInboxScreen = () => <InboxScreen area="professional" />;
