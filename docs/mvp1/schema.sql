-- =====================================================================
-- ContrataAí — schema inicial do MVP1
-- Regras: RLS em todas as tabelas; transições de estado só no back-end
-- (RPC security definer ou Edge Function); colunas sensíveis protegidas
-- por privilégio de coluna.
-- =====================================================================

-- Funções internas ficam fora dos schemas expostos pela API.
create schema private;
grant usage on schema private to authenticated;

create extension if not exists unaccent with schema extensions;

-- Chave de cidade para filtro: "SAO PAULO" (Receita) = "São Paulo" (digitado).
create function private.city_key(p_city text) returns text
language sql immutable parallel safe set search_path = '' as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, trim(p_city)));
$$;

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type public.account_type as enum ('restaurant', 'professional');

create type public.job_role as enum (
  'cook',               -- Cozinheiro(a)
  'kitchen_assistant',  -- Auxiliar de cozinha
  'sushi_chef',         -- Sushiman
  'griddle_cook',       -- Chapeiro(a)
  'pizza_maker',        -- Pizzaiolo(a)
  'confectioner',       -- Confeiteiro(a)
  'dishwasher',         -- Auxiliar de limpeza / copa
  'waiter',             -- Garçom / Garçonete
  'bartender',          -- Bartender
  'cashier',            -- Caixa
  'delivery_rider'      -- Motoboy
);

create type public.work_shift as enum ('morning', 'afternoon', 'night', 'overnight', 'full_day');
create type public.job_status as enum ('open', 'closed');
create type public.application_status as enum ('sent', 'accepted', 'rejected');
create type public.gig_status as enum (
  'open', 'confirmed', 'paid_held', 'checked_in', 'checked_out', 'released', 'cancelled', 'disputed'
);
create type public.pix_key_type as enum ('cpf', 'cnpj', 'email', 'phone', 'random');
create type public.payment_status as enum ('pending', 'received', 'refunded');
create type public.payout_status as enum ('pending', 'done', 'failed');

-- ---------------------------------------------------------------------
-- Utilitário: updated_at
-- ---------------------------------------------------------------------
create function private.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Contas
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  account_type public.account_type not null,
  created_at timestamptz not null default now()
);

create table public.restaurants (
  id uuid primary key references public.profiles (id) on delete cascade,
  cnpj char(14) not null unique check (cnpj ~ '^[0-9A-Z]{12}[0-9]{2}$'),  -- aceita o CNPJ alfanumérico (jul/2026)
  legal_name text not null,                  -- razão social (Receita)
  name text not null,                        -- nome de exibição (fantasia)
  description text,
  founded_on date,                           -- início de atividade (Receita) => tempo de existência
  cover_path text,                           -- Storage: restaurant-photos/{id}/...
  address text not null,
  city text not null,
  city_key text not null generated always as (private.city_key(city)) stored,
  state char(2) not null,
  rating_avg numeric(3, 2) not null default 0,
  rating_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.restaurant_photos (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  path text not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create table public.professionals (
  id uuid primary key references public.profiles (id) on delete cascade,
  full_name text not null,
  photo_path text,                           -- Storage: avatars/{id}/...
  main_role public.job_role not null,
  secondary_roles public.job_role[] not null default '{}',
  experience text,
  city text not null,
  city_key text not null generated always as (private.city_key(city)) stored,
  state char(2) not null,
  available_for_gigs boolean not null default true,
  rating_avg numeric(3, 2) not null default 0,
  rating_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Chave Pix para repasse dos freelas. Tabela separada: professionals é
-- legível por todos, a chave só pelo dono (e pelo back-end).
create table public.payout_accounts (
  professional_id uuid primary key references public.professionals (id) on delete cascade,
  pix_key text not null,
  pix_key_type public.pix_key_type not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Vagas fixas
-- ---------------------------------------------------------------------
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  role public.job_role not null,
  description text not null,
  salary_min_cents integer not null check (salary_min_cents > 0),
  salary_max_cents integer check (salary_max_cents >= salary_min_cents),  -- null = salário fixo
  shift public.work_shift not null,
  status public.job_status not null default 'open',
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  professional_id uuid not null references public.professionals (id) on delete cascade,
  status public.application_status not null default 'sent',
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (job_id, professional_id)
);

-- ---------------------------------------------------------------------
-- Freelas (chamados) e pagamento com garantia
-- ---------------------------------------------------------------------
create table public.gigs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  role public.job_role not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  amount_cents integer not null check (amount_cents > 0),
  status public.gig_status not null default 'open',
  professional_id uuid references public.professionals (id),
  confirmed_at timestamptz,
  paid_at timestamptz,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  released_at timestamptz,
  cancelled_at timestamptz,
  disputed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (status in ('open', 'cancelled') or professional_id is not null)
);

create table public.gig_applications (
  gig_id uuid not null references public.gigs (id) on delete cascade,
  professional_id uuid not null references public.professionals (id) on delete cascade,
  status public.application_status not null default 'sent',
  created_at timestamptz not null default now(),
  primary key (gig_id, professional_id)
);

-- Uma cobrança por chamado. Escrita só pelo back-end (Edge Functions).
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null unique references public.gigs (id) on delete restrict,
  provider text not null default 'asaas',
  amount_cents integer not null check (amount_cents > 0),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),  -- split fora do MVP
  charge_id text not null unique,            -- cobrança Pix no provedor
  pix_copy_paste text not null,
  status public.payment_status not null default 'pending',
  payout_id text unique,                     -- transferência Pix para o freelancer
  payout_status public.payout_status,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Chat
-- ---------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  professional_id uuid not null references public.professionals (id) on delete cascade,
  last_message_body text,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  unique (restaurant_id, professional_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Avaliações (ao fim do freela, nos dois sentidos)
-- ---------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs (id) on delete cascade,
  reviewer_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  reviewee_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  unique (gig_id, reviewer_id)
);

-- ---------------------------------------------------------------------
-- Índices (FKs e filtros de listagem)
-- ---------------------------------------------------------------------
create index on public.restaurant_photos (restaurant_id);
create index on public.professionals (main_role);
create index on public.professionals (city_key);
create index on public.jobs (restaurant_id);
create index on public.jobs (status, role);
create index on public.job_applications (professional_id);
create index on public.gigs (restaurant_id);
create index on public.gigs (professional_id);
create index on public.gigs (status, starts_at);
create index on public.gig_applications (professional_id);
create index on public.conversations (professional_id);
create index on public.messages (conversation_id, created_at);
create index on public.messages (sender_id);
create index on public.reviews (reviewer_id);
create index on public.reviews (reviewee_id);

-- ---------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------
create trigger set_updated_at before update on public.restaurants
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.professionals
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.payout_accounts
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.jobs
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.gigs
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.payments
  for each row execute function private.set_updated_at();

-- Todo usuário ganha um profile. Cadastro feito pelo app é sempre de
-- profissional; a conta de restaurante é convertida pela Edge Function
-- register-restaurant (service role), só depois de validar o CNPJ.
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, account_type) values (new.id, 'professional');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- Conversa nasce no match (candidatura aceita ou freelancer confirmado).
create function private.ensure_conversation(p_restaurant_id uuid, p_professional_id uuid)
returns void
language sql security definer set search_path = '' as $$
  insert into public.conversations (restaurant_id, professional_id)
  values (p_restaurant_id, p_professional_id)
  on conflict (restaurant_id, professional_id) do nothing;
$$;

create function private.on_job_application_decided() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = old.status then
    return new;
  end if;
  if old.status <> 'sent' then
    raise exception 'application_already_decided';
  end if;
  new.decided_at := now();
  if new.status = 'accepted' then
    perform private.ensure_conversation(
      (select j.restaurant_id from public.jobs j where j.id = new.job_id),
      new.professional_id
    );
  end if;
  return new;
end $$;

create trigger on_decided before update of status on public.job_applications
  for each row execute function private.on_job_application_decided();

create function private.on_job_closed() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'closed' and old.status = 'open' then
    new.closed_at := now();
  end if;
  return new;
end $$;

create trigger on_closed before update of status on public.jobs
  for each row execute function private.on_job_closed();

-- Máquina de estados do freela: única fonte de verdade das transições,
-- vale inclusive para o service role das Edge Functions.
create function private.guard_gig_transition() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = old.status then
    return new;
  end if;
  if (old.status::text, new.status::text) not in (
    ('open', 'confirmed'), ('open', 'cancelled'),
    ('confirmed', 'paid_held'), ('confirmed', 'cancelled'),
    ('paid_held', 'checked_in'), ('paid_held', 'cancelled'), ('paid_held', 'disputed'),
    ('checked_in', 'checked_out'), ('checked_in', 'disputed'),
    ('checked_out', 'released'), ('checked_out', 'disputed'),
    ('disputed', 'released'), ('disputed', 'cancelled')
  ) then
    raise exception 'invalid_gig_transition'
      using detail = format('%s -> %s', old.status, new.status);
  end if;
  case new.status
    when 'confirmed' then new.confirmed_at := now();
    when 'paid_held' then new.paid_at := now();
    when 'checked_in' then new.checked_in_at := now();
    when 'checked_out' then new.checked_out_at := now();
    when 'released' then new.released_at := now();
    when 'cancelled' then new.cancelled_at := now();
    when 'disputed' then new.disputed_at := now();
    else null;
  end case;
  return new;
end $$;

create trigger guard_transition before update of status on public.gigs
  for each row execute function private.guard_gig_transition();

create function private.touch_conversation() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.conversations
     set last_message_body = left(new.body, 140), last_message_at = new.created_at
   where id = new.conversation_id;
  return null;
end $$;

create trigger on_message_created after insert on public.messages
  for each row execute function private.touch_conversation();

create function private.refresh_rating() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_avg numeric(3, 2);
  v_count integer;
begin
  select round(avg(rating), 2), count(*) into v_avg, v_count
    from public.reviews where reviewee_id = new.reviewee_id;
  update public.restaurants set rating_avg = v_avg, rating_count = v_count where id = new.reviewee_id;
  update public.professionals set rating_avg = v_avg, rating_count = v_count where id = new.reviewee_id;
  return null;
end $$;

create trigger on_review_created after insert on public.reviews
  for each row execute function private.refresh_rating();

-- ---------------------------------------------------------------------
-- RPCs (ações do app sem integração externa)
-- ---------------------------------------------------------------------
create function public.confirm_gig_professional(p_gig_id uuid, p_professional_id uuid)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_restaurant_id uuid;
begin
  update public.gigs g
     set status = 'confirmed', professional_id = p_professional_id
   where g.id = p_gig_id
     and g.restaurant_id = (select auth.uid())
     and g.status = 'open'
     and exists (
       select 1 from public.gig_applications a
        where a.gig_id = p_gig_id and a.professional_id = p_professional_id and a.status = 'sent'
     )
  returning g.restaurant_id into v_restaurant_id;

  if v_restaurant_id is null then
    raise exception 'gig_not_confirmable';
  end if;

  update public.gig_applications
     set status = (case when professional_id = p_professional_id then 'accepted' else 'rejected' end)::public.application_status
   where gig_id = p_gig_id and status = 'sent';

  perform private.ensure_conversation(v_restaurant_id, p_professional_id);
end $$;

create function public.open_gig_dispute(p_gig_id uuid)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.gigs
     set status = 'disputed'
   where id = p_gig_id
     and (select auth.uid()) in (restaurant_id, professional_id)
     and status in ('paid_held', 'checked_in', 'checked_out');
  if not found then
    raise exception 'gig_not_disputable';
  end if;
end $$;

revoke execute on function public.confirm_gig_professional(uuid, uuid) from public, anon;
revoke execute on function public.open_gig_dispute(uuid) from public, anon;
grant execute on function public.confirm_gig_professional(uuid, uuid) to authenticated;
grant execute on function public.open_gig_dispute(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- View de exploração do profissional: vagas fixas + freelas abertos
-- ---------------------------------------------------------------------
create view public.openings with (security_invoker = true) as
  select 'job' as kind, j.id, j.restaurant_id, j.role, j.shift,
         j.salary_min_cents as pay_cents, j.salary_max_cents as pay_max_cents,
         null::timestamptz as starts_at, null::timestamptz as ends_at, j.created_at,
         r.name as restaurant_name, r.cover_path, r.city, r.city_key, r.state, r.rating_avg, r.rating_count
    from public.jobs j
    join public.restaurants r on r.id = j.restaurant_id
   where j.status = 'open'
  union all
  select 'gig', g.id, g.restaurant_id, g.role, null,
         g.amount_cents, null,
         g.starts_at, g.ends_at, g.created_at,
         r.name, r.cover_path, r.city, r.city_key, r.state, r.rating_avg, r.rating_count
    from public.gigs g
    join public.restaurants r on r.id = g.restaurant_id
   where g.status = 'open' and g.starts_at > now();

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.restaurant_photos enable row level security;
alter table public.professionals enable row level security;
alter table public.payout_accounts enable row level security;
alter table public.jobs enable row level security;
alter table public.job_applications enable row level security;
alter table public.gigs enable row level security;
alter table public.gig_applications enable row level security;
alter table public.payments enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

-- Usado pela policy de gigs para evitar recursão gigs <-> gig_applications.
create function private.has_applied_to_gig(p_gig_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.gig_applications a
     where a.gig_id = p_gig_id and a.professional_id = (select auth.uid())
  );
$$;

-- profiles: só o próprio usuário; criado pelo trigger de auth.
create policy "Usuário lê o próprio profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

-- restaurants: vitrine pública p/ logados; insert só pela Edge Function.
create policy "Logados veem restaurantes" on public.restaurants
  for select to authenticated using (true);
create policy "Restaurante edita a própria loja" on public.restaurants
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "Logados veem fotos das lojas" on public.restaurant_photos
  for select to authenticated using (true);
create policy "Restaurante adiciona fotos" on public.restaurant_photos
  for insert to authenticated with check (restaurant_id = (select auth.uid()));
create policy "Restaurante reordena fotos" on public.restaurant_photos
  for update to authenticated
  using (restaurant_id = (select auth.uid())) with check (restaurant_id = (select auth.uid()));
create policy "Restaurante remove fotos" on public.restaurant_photos
  for delete to authenticated using (restaurant_id = (select auth.uid()));

-- professionals: vitrine pública p/ logados; cada um cria/edita o seu.
create policy "Logados veem profissionais" on public.professionals
  for select to authenticated using (true);
create policy "Profissional cria o próprio perfil" on public.professionals
  for insert to authenticated
  with check (
    id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
       where p.id = (select auth.uid()) and p.account_type = 'professional'
    )
  );
create policy "Profissional edita o próprio perfil" on public.professionals
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "Profissional vê a própria chave Pix" on public.payout_accounts
  for select to authenticated using (professional_id = (select auth.uid()));
create policy "Profissional cadastra a chave Pix" on public.payout_accounts
  for insert to authenticated with check (professional_id = (select auth.uid()));
create policy "Profissional altera a chave Pix" on public.payout_accounts
  for update to authenticated
  using (professional_id = (select auth.uid())) with check (professional_id = (select auth.uid()));

-- jobs: anúncios públicos p/ logados; só vaga aberta pode ser editada/encerrada.
create policy "Logados veem vagas" on public.jobs
  for select to authenticated using (true);
create policy "Restaurante cria vagas" on public.jobs
  for insert to authenticated
  with check (restaurant_id = (select auth.uid()) and status = 'open');
create policy "Restaurante edita ou encerra vaga aberta" on public.jobs
  for update to authenticated
  using (restaurant_id = (select auth.uid()) and status = 'open')
  with check (restaurant_id = (select auth.uid()));

create policy "Partes veem a candidatura" on public.job_applications
  for select to authenticated
  using (
    professional_id = (select auth.uid())
    or exists (
      select 1 from public.jobs j
       where j.id = job_id and j.restaurant_id = (select auth.uid())
    )
  );
create policy "Profissional se candidata a vaga aberta" on public.job_applications
  for insert to authenticated
  with check (
    professional_id = (select auth.uid())
    and status = 'sent'
    and exists (select 1 from public.jobs j where j.id = job_id and j.status = 'open')
  );
create policy "Restaurante aceita ou recusa" on public.job_applications
  for update to authenticated
  using (
    status = 'sent'
    and exists (
      select 1 from public.jobs j
       where j.id = job_id and j.restaurant_id = (select auth.uid())
    )
  )
  with check (status in ('accepted', 'rejected'));

-- gigs: abertos são públicos p/ logados; demais só p/ as partes.
create policy "Logados veem chamados abertos e os seus" on public.gigs
  for select to authenticated
  using (
    status = 'open'
    or restaurant_id = (select auth.uid())
    or professional_id = (select auth.uid())
    or private.has_applied_to_gig(id)
  );
create policy "Restaurante publica chamado" on public.gigs
  for insert to authenticated
  with check (restaurant_id = (select auth.uid()) and status = 'open' and professional_id is null);

create policy "Partes veem os aceites" on public.gig_applications
  for select to authenticated
  using (
    professional_id = (select auth.uid())
    or exists (
      select 1 from public.gigs g
       where g.id = gig_id and g.restaurant_id = (select auth.uid())
    )
  );
create policy "Profissional aceita chamado aberto" on public.gig_applications
  for insert to authenticated
  with check (
    professional_id = (select auth.uid())
    and status = 'sent'
    and exists (select 1 from public.gigs g where g.id = gig_id and g.status = 'open')
  );

create policy "Partes veem o pagamento" on public.payments
  for select to authenticated
  using (
    exists (
      select 1 from public.gigs g
       where g.id = gig_id and (select auth.uid()) in (g.restaurant_id, g.professional_id)
    )
  );

create policy "Participantes veem a conversa" on public.conversations
  for select to authenticated
  using ((select auth.uid()) in (restaurant_id, professional_id));

create policy "Participantes leem mensagens" on public.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
       where c.id = conversation_id and (select auth.uid()) in (c.restaurant_id, c.professional_id)
    )
  );
create policy "Participantes enviam mensagens" on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.conversations c
       where c.id = conversation_id and (select auth.uid()) in (c.restaurant_id, c.professional_id)
    )
  );

create policy "Logados veem avaliações" on public.reviews
  for select to authenticated using (true);
create policy "Parte avalia a outra após o check-out" on public.reviews
  for insert to authenticated
  with check (
    reviewer_id = (select auth.uid())
    and exists (
      select 1 from public.gigs g
       where g.id = gig_id
         and g.status in ('checked_out', 'released')
         and (
           (g.restaurant_id = reviewer_id and g.professional_id = reviewee_id)
           or (g.professional_id = reviewer_id and g.restaurant_id = reviewee_id)
         )
    )
  );

-- ---------------------------------------------------------------------
-- Privilégios de coluna: o que o app pode escrever diretamente
-- (o resto só via trigger, RPC ou Edge Function)
-- ---------------------------------------------------------------------
revoke insert, update, delete on
  public.profiles, public.restaurants, public.professionals, public.payout_accounts,
  public.jobs, public.job_applications, public.gigs, public.gig_applications,
  public.payments, public.conversations, public.messages, public.reviews,
  public.restaurant_photos
from anon, authenticated;

grant update (name, description, cover_path, address, city, state) on public.restaurants to authenticated;
grant insert (restaurant_id, path, sort_order), update (sort_order), delete on public.restaurant_photos to authenticated;
grant insert (id, full_name, photo_path, main_role, secondary_roles, experience, city, state, available_for_gigs),
      update (full_name, photo_path, main_role, secondary_roles, experience, city, state, available_for_gigs)
  on public.professionals to authenticated;
grant insert (professional_id, pix_key, pix_key_type), update (pix_key, pix_key_type)
  on public.payout_accounts to authenticated;
grant insert (restaurant_id, role, description, salary_min_cents, salary_max_cents, shift),
      update (role, description, salary_min_cents, salary_max_cents, shift, status)
  on public.jobs to authenticated;
grant insert (job_id, professional_id), update (status) on public.job_applications to authenticated;
grant insert (restaurant_id, role, starts_at, ends_at, amount_cents) on public.gigs to authenticated;
grant insert (gig_id, professional_id) on public.gig_applications to authenticated;
grant insert (conversation_id, body) on public.messages to authenticated;
grant insert (gig_id, reviewee_id, rating, comment) on public.reviews to authenticated;

-- ---------------------------------------------------------------------
-- Storage: fotos públicas; cada usuário escreve só na pasta {uid}/
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('restaurant-photos', 'restaurant-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Usuário lista os próprios arquivos" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('avatars', 'restaurant-photos')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Usuário envia para a própria pasta" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('avatars', 'restaurant-photos')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Usuário remove os próprios arquivos" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('avatars', 'restaurant-photos')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------
-- Realtime: chat e chamados
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.messages, public.gigs, public.gig_applications;
