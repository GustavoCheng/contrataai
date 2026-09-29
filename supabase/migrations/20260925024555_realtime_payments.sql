-- Sprint 5 — a tela do freela acompanha o repasse (TRANSFER_DONE/FAILED só muda payments).
-- A RLS de payments vale no Realtime: só as partes do freela recebem os eventos.
alter publication supabase_realtime add table public.payments;
