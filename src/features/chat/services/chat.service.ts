import type { Tables } from '@/shared/lib/database.types';
import { toAppError } from '@/shared/lib/errors';
import { supabase } from '@/shared/lib/supabase';

const CONVERSATION_COLUMNS =
  'id, last_message_body, last_message_at, created_at, restaurants(id, name, cover_path), professionals(id, full_name, photo_path)';

export async function listConversations() {
  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_COLUMNS)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw await toAppError(error);
  return data;
}

export type Conversation = Awaited<ReturnType<typeof listConversations>>[number];

export async function getConversation(id: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_COLUMNS)
    .eq('id', id)
    .single();
  if (error) throw await toAppError(error);
  return data;
}

/** A conversa do par restaurante–profissional (existe depois do match). */
export async function findConversationId({
  restaurantId,
  professionalId,
}: {
  restaurantId: string;
  professionalId: string;
}): Promise<string | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .eq('professional_id', professionalId)
    .maybeSingle();
  if (error) throw await toAppError(error);
  return data?.id ?? null;
}

export type Message = Pick<Tables<'messages'>, 'id' | 'sender_id' | 'body' | 'created_at'>;

/** Mensagens mais novas primeiro (a lista do chat é invertida). */
export async function listMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw await toAppError(error);
  return data;
}

export async function sendMessage({
  conversationId,
  body,
}: {
  conversationId: string;
  body: string;
}): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, body })
    .select('id, sender_id, body, created_at')
    .single();
  if (error) throw await toAppError(error);
  return data;
}

export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: Message) => void,
): () => void {
  const channel = supabase
    .channel(`messages-${conversationId}`)
    .on<Tables<'messages'>>(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      ({ new: row }) =>
        onMessage({
          id: row.id,
          sender_id: row.sender_id,
          body: row.body,
          created_at: row.created_at,
        }),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/** Conversa nova (match) ou última mensagem atualizada; a RLS entrega só as minhas. */
export function subscribeToInbox(onChange: () => void): () => void {
  const channel = supabase
    .channel('inbox')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, onChange)
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
