import type { Tables } from '@/shared/lib/database.types';
import { unwrap } from '@/shared/lib/errors';
import { supabase } from '@/shared/lib/supabase';

const CONVERSATION_COLUMNS =
  'id, last_message_body, last_message_at, restaurants(id, name, cover_path), professionals(full_name, photo_path)';
const MESSAGE_COLUMNS = 'id, sender_id, body, created_at';

export function listConversations() {
  return unwrap(
    supabase
      .from('conversations')
      .select(CONVERSATION_COLUMNS)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
  );
}

export type Conversation = Awaited<ReturnType<typeof listConversations>>[number];

export function getConversation(id: string) {
  return unwrap(supabase.from('conversations').select(CONVERSATION_COLUMNS).eq('id', id).single());
}

/** A conversa do par restaurante–profissional (existe depois do match). */
export async function findConversationId({
  restaurantId,
  professionalId,
}: {
  restaurantId: string;
  professionalId: string;
}): Promise<string | null> {
  const row = await unwrap(
    supabase
      .from('conversations')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('professional_id', professionalId)
      .maybeSingle(),
  );
  return row?.id ?? null;
}

export type Message = Pick<Tables<'messages'>, 'id' | 'sender_id' | 'body' | 'created_at'>;

/** Mensagens mais novas primeiro (a lista do chat é invertida). */
export function listMessages(conversationId: string): Promise<Message[]> {
  return unwrap(
    supabase
      .from('messages')
      .select(MESSAGE_COLUMNS)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(200),
  );
}

export function sendMessage({
  conversationId,
  body,
}: {
  conversationId: string;
  body: string;
}): Promise<Message> {
  return unwrap(
    supabase
      .from('messages')
      .insert({ conversation_id: conversationId, body })
      .select(MESSAGE_COLUMNS)
      .single(),
  );
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
      ({ new: row }) => onMessage(row),
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
