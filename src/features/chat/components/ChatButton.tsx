import { router } from 'expo-router';
import { Button } from '@/shared/ui';
import { useConversationId } from '../hooks/useChat';
import type { AccountType } from '@/shared/lib/labels';

type ChatButtonProps = {
  area: AccountType;
  restaurantId: string;
  professionalId: string;
};

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
