import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  findConversationId,
  getConversation,
  listConversations,
  listMessages,
  sendMessage,
  subscribeToInbox,
  subscribeToMessages,
  type Message,
} from '../services/chat.service';

const chatKeys = {
  conversations: ['conversations'] as const,
  conversation: (id: string) => ['conversations', id] as const,
  pair: (restaurantId: string, professionalId: string) =>
    ['conversations', 'pair', restaurantId, professionalId] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
};

export function useConversations() {
  const queryClient = useQueryClient();
  useEffect(
    () =>
      subscribeToInbox(
        () => void queryClient.invalidateQueries({ queryKey: chatKeys.conversations }),
      ),
    [queryClient],
  );
  return useQuery({ queryKey: chatKeys.conversations, queryFn: listConversations });
}

export function useConversation(id: string) {
  return useQuery({ queryKey: chatKeys.conversation(id), queryFn: () => getConversation(id) });
}

export function useConversationId(restaurantId: string, professionalId: string) {
  return useQuery({
    queryKey: chatKeys.pair(restaurantId, professionalId),
    queryFn: () => findConversationId({ restaurantId, professionalId }),
  });
}

/** Mensagem nova no topo, sem repetir a que já veio pela resposta do envio. */
function prepend(messages: Message[] | undefined, message: Message): Message[] {
  if (!messages) return [message];
  return messages.some((existing) => existing.id === message.id)
    ? messages
    : [message, ...messages];
}

export function useMessages(conversationId: string) {
  const queryClient = useQueryClient();
  useEffect(
    () =>
      subscribeToMessages(conversationId, (message) =>
        queryClient.setQueryData<Message[]>(chatKeys.messages(conversationId), (messages) =>
          prepend(messages, message),
        ),
      ),
    [conversationId, queryClient],
  );
  return useQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: () => listMessages(conversationId),
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => sendMessage({ conversationId, body }),
    onSuccess: (message) =>
      queryClient.setQueryData<Message[]>(chatKeys.messages(conversationId), (messages) =>
        prepend(messages, message),
      ),
  });
}
