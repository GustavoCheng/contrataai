-- Sprint 4 — a caixa de mensagens atualiza sozinha quando chega mensagem nova
-- (o trigger de messages atualiza last_message_* da conversa).
alter publication supabase_realtime add table public.conversations;
