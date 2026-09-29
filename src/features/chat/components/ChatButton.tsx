import { router } from 'expo-router';
import { Button } from '@/shared/ui';
import { useConversationId } from '../hooks/useChat';

type ChatButtonProps = {
  area: 'restaurant' | 'professional';
  restaurantId: string;
  professionalId: string;
};

/** Abre o chat com a outra parte; só aparece quando a conversa já existe (depois do match). */
export function ChatButton({ area, restaurantId, professionalId }: ChatButtonProps) {
  const conversation = useConversationId(restaurantId, professionalId);
  const conversationId = conversation.data;
  if (!conversationId) return null;
  return (
    <Button
      variant="secondary"
      title="Conversar"
      onPress={() => router.push(`/${area}/chat/${conversationId}`)}
    />
  );
}
