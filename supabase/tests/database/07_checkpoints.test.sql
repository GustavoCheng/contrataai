begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

-- Cada teste parte de um banco vazio; o seed volta no rollback.
delete from public.payments;
delete from public.gigs;
delete from auth.users;

create function pg_temp.act_as(p_user uuid) returns void
language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
end $$;

-- Código que o restaurante está vendo (o teste lê direto da tabela, como o back-end).
create function pg_temp.current_code() returns text
language sql as $$ select code::text from public.gig_checkpoints $$;

-- Um código diferente do atual, para simular quem digitou errado.
create function pg_temp.wrong_code() returns text
language sql as $$
  select lpad(((code::int + 1) % 10000)::text, 4, '0') from public.gig_checkpoints
$$;

-- R = restaurante, X = outro restaurante, P = freelancer confirmado, Q = outro profissional
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'r@test.dev'),
  ('44444444-4444-4444-8444-444444444444', 'x@test.dev'),
  ('22222222-2222-4222-8222-222222222222', 'p@test.dev'),
  ('33333333-3333-4333-8333-333333333333', 'q@test.dev');
update public.profiles set account_type = 'restaurant'
 where id in ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444');
insert into public.restaurants (id, cnpj, legal_name, name, street, city, state) values
  ('11111111-1111-4111-8111-111111111111', '10000000000101', 'R LTDA', 'Bistrô R', 'Rua A', 'São Paulo', 'SP'),
  ('44444444-4444-4444-8444-444444444444', '20000000000202', 'X LTDA', 'Cantina X', 'Rua B', 'São Paulo', 'SP');
insert into public.professionals (id, full_name, main_role, city, state) values
  ('22222222-2222-4222-8222-222222222222', 'Ana Souza', 'sushi_chef', 'São Paulo', 'SP'),
  ('33333333-3333-4333-8333-333333333333', 'Bruno Dias', 'cook', 'São Paulo', 'SP');
insert into public.payout_accounts (professional_id, pix_key, pix_key_type)
values ('22222222-2222-4222-8222-222222222222', 'ana@pix.dev', 'email');
insert into public.gigs (restaurant_id, role, starts_at, ends_at, amount_cents)
values ('11111111-1111-4111-8111-111111111111', 'sushi_chef', now() + interval '1 day', now() + interval '30 hours', 25000);
insert into public.gig_applications (gig_id, professional_id)
select id, '22222222-2222-4222-8222-222222222222' from public.gigs;
select set_config('test.gig_id', (select id::text from public.gigs), true);

select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
select public.confirm_gig_professional(
  current_setting('test.gig_id')::uuid, '22222222-2222-4222-8222-222222222222'
);
select throws_ok(
  $$ select * from public.issue_gig_checkpoint(current_setting('test.gig_id')::uuid) $$,
  'P0001', 'checkpoint_unavailable', 'sem pagamento retido não há código de check-in'
);

-- Pix recebido (Edge Function asaas-webhook, service role)
reset role;
update public.gigs set status = 'paid_held';

-- ---------------------------------------------------------------------
-- Quem gera o código
-- ---------------------------------------------------------------------
select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
select is(
  (select kind::text from public.issue_gig_checkpoint(current_setting('test.gig_id')::uuid)),
  'check_in', 'restaurante gera o código de check-in'
);
select matches(
  (select code from public.issue_gig_checkpoint(current_setting('test.gig_id')::uuid)),
  '^[0-9]{4}$', 'o código tem 4 dígitos'
);
select throws_ok(
  $$ select count(*) from public.gig_checkpoints $$,
  '42501', null, 'o app não lê a tabela de códigos'
);

reset role;
select set_config('test.first_code', pg_temp.current_code(), true);
select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
select is(
  (select code from public.issue_gig_checkpoint(current_setting('test.gig_id')::uuid)),
  current_setting('test.first_code'), 'pedir de novo devolve o mesmo código enquanto ele vale'
);

reset role;
select pg_temp.act_as('44444444-4444-4444-8444-444444444444');
select throws_ok(
  $$ select * from public.issue_gig_checkpoint(current_setting('test.gig_id')::uuid) $$,
  'P0001', 'forbidden', 'outro restaurante não gera o código'
);

reset role;
select pg_temp.act_as('22222222-2222-4222-8222-222222222222');
select throws_ok(
  $$ select * from public.issue_gig_checkpoint(current_setting('test.gig_id')::uuid) $$,
  'P0001', 'forbidden', 'o freelancer não gera o próprio código'
);

-- ---------------------------------------------------------------------
-- Quem digita o código
-- ---------------------------------------------------------------------
reset role;
select set_config('test.code', pg_temp.current_code(), true);
select set_config('test.wrong', pg_temp.wrong_code(), true);

select pg_temp.act_as('33333333-3333-4333-8333-333333333333');
select throws_ok(
  $$ select public.redeem_gig_checkpoint(current_setting('test.gig_id')::uuid, current_setting('test.code')) $$,
  'P0001', 'checkpoint_not_yours', 'outro profissional não faz o check-in, nem com o código certo'
);

reset role;
select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
select throws_ok(
  $$ select public.redeem_gig_checkpoint(current_setting('test.gig_id')::uuid, current_setting('test.code')) $$,
  'P0001', 'checkpoint_not_yours', 'o restaurante não faz o check-in pelo freelancer'
);

-- ---------------------------------------------------------------------
-- Código errado: conta, trava no 5º erro e só o restaurante destrava
-- ---------------------------------------------------------------------
reset role;
select pg_temp.act_as('22222222-2222-4222-8222-222222222222');
select is(
  public.redeem_gig_checkpoint(current_setting('test.gig_id')::uuid, current_setting('test.wrong'))::text,
  'invalid_code', 'código errado é recusado'
);
select is(
  public.redeem_gig_checkpoint(current_setting('test.gig_id')::uuid, 'abcd')::text,
  'invalid_code', 'texto que não é código é recusado'
);
select public.redeem_gig_checkpoint(current_setting('test.gig_id')::uuid, current_setting('test.wrong'));
select public.redeem_gig_checkpoint(current_setting('test.gig_id')::uuid, current_setting('test.wrong'));
select is(
  public.redeem_gig_checkpoint(current_setting('test.gig_id')::uuid, current_setting('test.wrong'))::text,
  'locked', 'o 5º erro trava o código'
);
select is(
  public.redeem_gig_checkpoint(current_setting('test.gig_id')::uuid, current_setting('test.code'))::text,
  'locked', 'travado, nem o código certo passa'
);

reset role;
select is((select status::text from public.gigs), 'paid_held', 'o freela continua aguardando o check-in');
select is((select failed_attempts::int from public.gig_checkpoints), 5, 'os erros ficaram registrados');

select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
select lives_ok(
  $$ select * from public.issue_gig_checkpoint(current_setting('test.gig_id')::uuid) $$,
  'restaurante pede o código de novo depois da trava'
);
reset role;
select is((select failed_attempts::int from public.gig_checkpoints), 0, 'código novo zera os erros');

-- ---------------------------------------------------------------------
-- Check-in
-- ---------------------------------------------------------------------
select set_config('test.code', pg_temp.current_code(), true);
select pg_temp.act_as('22222222-2222-4222-8222-222222222222');
select is(
  public.redeem_gig_checkpoint(current_setting('test.gig_id')::uuid, current_setting('test.code'))::text,
  'checked_in', 'código certo faz o check-in'
);
select is(
  public.redeem_gig_checkpoint(current_setting('test.gig_id')::uuid, current_setting('test.code'))::text,
  'expired', 'o código de check-in não serve para o check-out'
);

reset role;
select ok(
  (select status = 'checked_in' and checked_in_at is not null from public.gigs),
  'o freela registra a hora do check-in'
);
select is((select count(*) from public.gig_checkpoints), 0::bigint, 'código usado é apagado');

-- ---------------------------------------------------------------------
-- Check-out: validade e renovação
-- ---------------------------------------------------------------------
select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
select is(
  (select kind::text from public.issue_gig_checkpoint(current_setting('test.gig_id')::uuid)),
  'check_out', 'depois do check-in, o código é de check-out'
);

reset role;
select set_config('test.code', pg_temp.current_code(), true);
update public.gig_checkpoints set expires_at = now() - interval '1 second';

select pg_temp.act_as('22222222-2222-4222-8222-222222222222');
select is(
  public.redeem_gig_checkpoint(current_setting('test.gig_id')::uuid, current_setting('test.code'))::text,
  'expired', 'código vencido é recusado'
);

reset role;
select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
select ok(
  (select expires_at > now() from public.issue_gig_checkpoint(current_setting('test.gig_id')::uuid, true)),
  'restaurante gera outro código, com validade nova'
);

reset role;
select set_config('test.code', pg_temp.current_code(), true);
select pg_temp.act_as('22222222-2222-4222-8222-222222222222');
select is(
  public.redeem_gig_checkpoint(current_setting('test.gig_id')::uuid, current_setting('test.code'))::text,
  'checked_out', 'código certo faz o check-out'
);

reset role;
select ok(
  (select status = 'checked_out' and checked_out_at is not null from public.gigs),
  'o freela registra a hora do check-out'
);

select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
select throws_ok(
  $$ select * from public.issue_gig_checkpoint(current_setting('test.gig_id')::uuid) $$,
  'P0001', 'checkpoint_unavailable', 'depois do check-out não há mais código'
);

select * from finish();
rollback;
