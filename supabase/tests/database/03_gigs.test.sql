begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

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

-- R e X = restaurantes; P e Q = profissionais (só P tem chave Pix no início)
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'r@test.dev'),
  ('44444444-4444-4444-8444-444444444444', 'x@test.dev'),
  ('22222222-2222-4222-8222-222222222222', 'p@test.dev'),
  ('33333333-3333-4333-8333-333333333333', 'q@test.dev');
update public.profiles set account_type = 'restaurant'
 where id in ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444');
insert into public.restaurants (id, cnpj, legal_name, name, street, city, state) values
  ('11111111-1111-4111-8111-111111111111', '10000000000101', 'R LTDA', 'Bistrô R', 'Rua A', 'São Paulo', 'SP'),
  ('44444444-4444-4444-8444-444444444444', '20000000000202', 'X LTDA', 'Cantina X', 'Rua B', 'Rio de Janeiro', 'RJ');
insert into public.professionals (id, full_name, main_role, city, state) values
  ('22222222-2222-4222-8222-222222222222', 'Ana Souza', 'sushi_chef', 'São Paulo', 'SP'),
  ('33333333-3333-4333-8333-333333333333', 'Bruno Lima', 'sushi_chef', 'São Paulo', 'SP');
insert into public.payout_accounts (professional_id, pix_key, pix_key_type)
values ('22222222-2222-4222-8222-222222222222', 'ana@pix.dev', 'email');

select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
select lives_ok(
  $$ insert into public.gigs (restaurant_id, role, starts_at, ends_at, amount_cents)
     values ('11111111-1111-4111-8111-111111111111', 'sushi_chef', now() + interval '1 day', now() + interval '30 hours', 25000) $$,
  'restaurante publica chamado'
);

reset role;
select pg_temp.act_as('44444444-4444-4444-8444-444444444444');
select throws_ok(
  $$ insert into public.gigs (restaurant_id, role, starts_at, ends_at, amount_cents)
     values ('11111111-1111-4111-8111-111111111111', 'cook', now() + interval '1 day', now() + interval '2 days', 100) $$,
  '42501', null, 'restaurante não publica em nome de outro'
);

reset role;
select pg_temp.act_as('33333333-3333-4333-8333-333333333333');
select throws_ok(
  $$ insert into public.gig_applications (gig_id, professional_id)
     select id, '33333333-3333-4333-8333-333333333333' from public.gigs $$,
  '42501', null, 'sem chave Pix não aceita freela'
);
insert into public.payout_accounts (professional_id, pix_key, pix_key_type)
values ('33333333-3333-4333-8333-333333333333', '52998224725', 'cpf');
select lives_ok(
  $$ insert into public.gig_applications (gig_id, professional_id)
     select id, '33333333-3333-4333-8333-333333333333' from public.gigs $$,
  'com chave Pix aceita o freela'
);

reset role;
select pg_temp.act_as('22222222-2222-4222-8222-222222222222');
select lives_ok(
  $$ insert into public.gig_applications (gig_id, professional_id)
     select id, '22222222-2222-4222-8222-222222222222' from public.gigs $$,
  'segundo profissional aceita'
);

reset role;
select pg_temp.act_as('44444444-4444-4444-8444-444444444444');
select is((select count(*) from public.gig_applications), 0::bigint, 'outro restaurante não vê os aceites');

reset role;
select pg_temp.act_as('33333333-3333-4333-8333-333333333333');
select throws_ok(
  $$ select public.confirm_gig_professional((select id from public.gigs), '33333333-3333-4333-8333-333333333333') $$,
  'P0001', 'gig_not_confirmable', 'profissional não confirma a si mesmo'
);

reset role;
select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
select is((select count(*) from public.gig_applications), 2::bigint, 'restaurante vê os dois aceites');
select lives_ok(
  $$ select public.confirm_gig_professional((select id from public.gigs), '22222222-2222-4222-8222-222222222222') $$,
  'restaurante confirma P'
);
select is((select status::text from public.gigs), 'confirmed', 'chamado confirmado');
select results_eq(
  $$ select professional_id, status::text from public.gig_applications order by status $$,
  $$ values ('22222222-2222-4222-8222-222222222222'::uuid, 'accepted'), ('33333333-3333-4333-8333-333333333333'::uuid, 'rejected') $$,
  'confirmado vira aceito e o outro, recusado'
);
select is((select count(*) from public.conversations), 1::bigint, 'confirmação cria a conversa');
select throws_ok(
  $$ update public.gigs set status = 'released' $$,
  '42501', null, 'app não altera o estado do chamado'
);

reset role;
select throws_ok(
  $$ update public.gigs set status = 'checked_in' $$,
  'P0001', 'invalid_gig_transition', 'nem o service role pula estado'
);

select pg_temp.act_as('33333333-3333-4333-8333-333333333333');
select is((select count(*) from public.gigs), 1::bigint, 'recusado ainda vê o freela no histórico');

reset role;
select pg_temp.act_as('44444444-4444-4444-8444-444444444444');
select is((select count(*) from public.gigs), 0::bigint, 'terceiro não vê chamado confirmado');

-- Fluxo das Edge Functions (service role)
reset role;
insert into public.payments (gig_id, amount_cents, charge_id, pix_copy_paste, status)
select id, 25000, 'pay_test', '000201...', 'received' from public.gigs;
update public.gigs set status = 'paid_held';
update public.gigs set status = 'checked_in';
update public.gigs set status = 'checked_out';
select ok(
  (select paid_at is not null and checked_in_at is not null and checked_out_at is not null from public.gigs),
  'banco registra a hora de cada etapa'
);

select pg_temp.act_as('22222222-2222-4222-8222-222222222222');
select is((select count(*) from public.payments), 1::bigint, 'freelancer vê o pagamento');

reset role;
select pg_temp.act_as('33333333-3333-4333-8333-333333333333');
select is((select count(*) from public.payments), 0::bigint, 'recusado não vê o pagamento');
select throws_ok(
  $$ select public.open_gig_dispute((select id from public.gigs)) $$,
  'P0001', 'gig_not_disputable', 'quem não é parte não abre disputa'
);

reset role;
select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
select lives_ok($$ select public.open_gig_dispute((select id from public.gigs)) $$, 'restaurante abre disputa');
select is((select status::text from public.gigs), 'disputed', 'chamado em disputa');

select * from finish();
rollback;
