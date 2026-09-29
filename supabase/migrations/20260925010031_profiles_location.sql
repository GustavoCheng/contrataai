-- =====================================================================
-- Sprint 2 — perfis e localização (base da distância nos cards)
-- =====================================================================

-- Coordenadas da loja: vêm do endereço (Edge Functions register-restaurant e geocode).
alter table public.restaurants
  add column latitude double precision check (latitude between -90 and 90),
  add column longitude double precision check (longitude between -180 and 180);

grant update (latitude, longitude) on public.restaurants to authenticated;

-- Bairro público do profissional ("Pinheiros, São Paulo").
alter table public.professionals add column neighborhood text;

grant insert (neighborhood), update (neighborhood) on public.professionals to authenticated;

-- Localização do profissional: privada (só o dono lê) e aproximada.
-- numeric(_, 2) arredonda para 2 casas decimais (~1 km) na própria gravação.
create table public.professional_locations (
  professional_id uuid primary key references public.professionals (id) on delete cascade,
  postal_code char(8) not null check (postal_code ~ '^[0-9]{8}$'),
  latitude numeric(4, 2) check (latitude between -90 and 90),
  longitude numeric(5, 2) check (longitude between -180 and 180),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.professional_locations
  for each row execute function private.set_updated_at();

alter table public.professional_locations enable row level security;

create policy "Profissional vê a própria localização" on public.professional_locations
  for select to authenticated using (professional_id = (select auth.uid()));
create policy "Profissional define a própria localização" on public.professional_locations
  for insert to authenticated with check (professional_id = (select auth.uid()));
create policy "Profissional altera a própria localização" on public.professional_locations
  for update to authenticated
  using (professional_id = (select auth.uid())) with check (professional_id = (select auth.uid()));

revoke insert, update, delete on public.professional_locations from anon, authenticated;
grant insert (professional_id, postal_code, latitude, longitude),
      update (postal_code, latitude, longitude)
  on public.professional_locations to authenticated;

-- Apagar a chave no perfil remove a conta de repasse (sem ela, não aceita freelas).
create policy "Profissional remove a chave Pix" on public.payout_accounts
  for delete to authenticated using (professional_id = (select auth.uid()));
grant delete on public.payout_accounts to authenticated;

-- O upsert do PostgREST repete a chave no "on conflict do update set"; o privilégio
-- é inofensivo porque as policies exigem chave = auth.uid() antes e depois.
grant update (id) on public.professionals to authenticated;
grant update (professional_id) on public.payout_accounts, public.professional_locations to authenticated;
