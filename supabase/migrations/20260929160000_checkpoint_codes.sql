-- =====================================================================
-- Check-in e check-out por código de 4 dígitos (no lugar do QR Code)
-- O restaurante mostra o código; o freelancer confirmado digita no app.
-- Como 4 dígitos são poucos, o código vale 10 minutos, serve uma vez e
-- trava depois de 5 erros (só o restaurante gera outro).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

create type public.checkpoint_kind as enum ('check_in', 'check_out');
create type public.checkpoint_outcome as enum (
  'checked_in', 'checked_out',              -- deu certo: novo estado do freela
  'invalid_code', 'locked', 'expired'       -- não deu: o app mostra o motivo
);

-- Um código por etapa do freela. Só o back-end lê e escreve: o app usa as RPCs abaixo.
create table public.gig_checkpoints (
  gig_id uuid not null references public.gigs (id) on delete cascade,
  kind public.checkpoint_kind not null,
  code char(4) not null check (code ~ '^[0-9]{4}$'),
  expires_at timestamptz not null,
  failed_attempts smallint not null default 0,
  created_at timestamptz not null default now(),
  primary key (gig_id, kind)
);

alter table public.gig_checkpoints enable row level security;
revoke all on public.gig_checkpoints from anon, authenticated;

create function private.random_checkpoint_code() returns text
language sql volatile set search_path = '' as $$
  select lpad(
    (('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint % 10000)::text,
    4, '0'
  );
$$;

-- Etapa que o freela está esperando: check-in com o pagamento retido, check-out depois.
create function private.pending_checkpoint(p_status public.gig_status)
returns public.checkpoint_kind
language sql immutable parallel safe set search_path = '' as $$
  select case p_status
    when 'paid_held' then 'check_in'::public.checkpoint_kind
    when 'checked_in' then 'check_out'::public.checkpoint_kind
  end;
$$;

-- Restaurante pede o código da etapa. Enquanto o código valer, devolve o mesmo (quem está
-- digitando não pode ser surpreendido); gera outro se venceu, travou ou se p_renew for true.
create function public.issue_gig_checkpoint(p_gig_id uuid, p_renew boolean default false)
returns table (kind public.checkpoint_kind, code text, expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  v_status public.gig_status;
  v_kind public.checkpoint_kind;
begin
  select g.status into v_status
    from public.gigs g
   where g.id = p_gig_id and g.restaurant_id = (select auth.uid());
  if not found then
    raise exception 'forbidden';
  end if;

  v_kind := private.pending_checkpoint(v_status);
  if v_kind is null then
    raise exception 'checkpoint_unavailable';
  end if;

  insert into public.gig_checkpoints as c (gig_id, kind, code, expires_at)
  values (p_gig_id, v_kind, private.random_checkpoint_code(), now() + interval '10 minutes')
  on conflict on constraint gig_checkpoints_pkey do update
    set code = excluded.code,
        expires_at = excluded.expires_at,
        failed_attempts = 0,
        created_at = now()
    where p_renew or c.expires_at <= now() or c.failed_attempts >= 5;

  return query
    select c.kind, c.code::text, c.expires_at
      from public.gig_checkpoints c
     where c.gig_id = p_gig_id and c.kind = v_kind;
end $$;

-- Freelancer confirmado digita o código. Os erros contam mesmo quando a resposta é de falha,
-- por isso o resultado volta como valor (uma exceção desfaria a contagem).
create function public.redeem_gig_checkpoint(p_gig_id uuid, p_code text)
returns public.checkpoint_outcome
language plpgsql security definer set search_path = '' as $$
declare
  v_status public.gig_status;
  v_kind public.checkpoint_kind;
  v_checkpoint public.gig_checkpoints;
  v_next public.gig_status;
begin
  select g.status into v_status
    from public.gigs g
   where g.id = p_gig_id and g.professional_id = (select auth.uid());
  if not found then
    raise exception 'checkpoint_not_yours';
  end if;

  v_kind := private.pending_checkpoint(v_status);
  if v_kind is null then
    raise exception 'checkpoint_unavailable';
  end if;

  -- A trava de linha põe em fila as tentativas simultâneas do mesmo código.
  select * into v_checkpoint
    from public.gig_checkpoints c
   where c.gig_id = p_gig_id and c.kind = v_kind
     for update;
  if not found or v_checkpoint.expires_at <= now() then
    return 'expired';
  end if;
  if v_checkpoint.failed_attempts >= 5 then
    return 'locked';
  end if;
  if v_checkpoint.code is distinct from p_code then
    update public.gig_checkpoints c
       set failed_attempts = c.failed_attempts + 1
     where c.gig_id = p_gig_id and c.kind = v_kind;
    return case when v_checkpoint.failed_attempts + 1 >= 5 then 'locked' else 'invalid_code' end;
  end if;

  v_next := case v_kind when 'check_in' then 'checked_in' else 'checked_out' end;
  update public.gigs g set status = v_next where g.id = p_gig_id and g.status = v_status;
  delete from public.gig_checkpoints c where c.gig_id = p_gig_id and c.kind = v_kind;
  return v_next::text::public.checkpoint_outcome;
end $$;

revoke execute on function public.issue_gig_checkpoint(uuid, boolean) from public, anon;
revoke execute on function public.redeem_gig_checkpoint(uuid, text) from public, anon;
grant execute on function public.issue_gig_checkpoint(uuid, boolean) to authenticated;
grant execute on function public.redeem_gig_checkpoint(uuid, text) to authenticated;
