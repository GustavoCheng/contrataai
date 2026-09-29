begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

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

-- R = restaurante, P = freelancer confirmado, X = restaurante de fora
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'r@test.dev'),
  ('44444444-4444-4444-8444-444444444444', 'x@test.dev'),
  ('22222222-2222-4222-8222-222222222222', 'p@test.dev');
update public.profiles set account_type = 'restaurant'
 where id in ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444');
insert into public.restaurants (id, cnpj, legal_name, name, street, city, state) values
  ('11111111-1111-4111-8111-111111111111', '10000000000101', 'R LTDA', 'Bistrô R', 'Rua A', 'São Paulo', 'SP'),
  ('44444444-4444-4444-8444-444444444444', '20000000000202', 'X LTDA', 'Cantina X', 'Rua B', 'Rio de Janeiro', 'RJ');
insert into public.professionals (id, full_name, main_role, city, state)
values ('22222222-2222-4222-8222-222222222222', 'Ana Souza', 'sushi_chef', 'São Paulo', 'SP');
insert into public.payout_accounts (professional_id, pix_key, pix_key_type)
values ('22222222-2222-4222-8222-222222222222', 'ana@pix.dev', 'email');
insert into public.gigs (restaurant_id, role, starts_at, ends_at, amount_cents)
values ('11111111-1111-4111-8111-111111111111', 'sushi_chef', now() + interval '1 day', now() + interval '30 hours', 25000);
insert into public.gig_applications (gig_id, professional_id)
select id, '22222222-2222-4222-8222-222222222222' from public.gigs;

select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
select public.confirm_gig_professional((select id from public.gigs), '22222222-2222-4222-8222-222222222222');

reset role;
select pg_temp.act_as('22222222-2222-4222-8222-222222222222');
select lives_ok(
  $$ insert into public.messages (conversation_id, body) select id, 'Chego 15 min antes.' from public.conversations $$,
  'freelancer envia mensagem após o match'
);

reset role;
select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
select is((select body from public.messages), 'Chego 15 min antes.', 'restaurante lê a mensagem');
select is((select last_message_body from public.conversations), 'Chego 15 min antes.', 'conversa guarda a última mensagem');
select throws_ok(
  $$ insert into public.reviews (gig_id, reviewee_id, rating)
     select id, '22222222-2222-4222-8222-222222222222', 5 from public.gigs $$,
  '42501', null, 'sem check-out não avalia'
);

reset role;
select set_config('test.conversation_id', (select id::text from public.conversations), true);
select pg_temp.act_as('44444444-4444-4444-8444-444444444444');
select is((select count(*) from public.messages), 0::bigint, 'quem não participa não lê');
select throws_ok(
  $$ insert into public.messages (conversation_id, body)
     values (current_setting('test.conversation_id')::uuid, 'intruso') $$,
  '42501', null, 'quem não participa não envia'
);

-- Check-out (Edge Functions, service role)
reset role;
update public.gigs set status = 'paid_held';
update public.gigs set status = 'checked_in';
update public.gigs set status = 'checked_out';

select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
select lives_ok(
  $$ insert into public.reviews (gig_id, reviewee_id, rating, comment)
     select id, '22222222-2222-4222-8222-222222222222', 5, 'Pontual e caprichosa' from public.gigs $$,
  'restaurante avalia o freelancer'
);
select throws_ok(
  $$ insert into public.reviews (gig_id, reviewee_id, rating)
     select id, '22222222-2222-4222-8222-222222222222', 1 from public.gigs $$,
  '23505', null, 'uma avaliação por freela'
);
select throws_ok(
  $$ insert into public.reviews (gig_id, reviewee_id, rating)
     select id, '11111111-1111-4111-8111-111111111111', 5 from public.gigs $$,
  '42501', null, 'ninguém se autoavalia'
);

reset role;
select pg_temp.act_as('22222222-2222-4222-8222-222222222222');
select lives_ok(
  $$ insert into public.reviews (gig_id, reviewee_id, rating)
     select id, '11111111-1111-4111-8111-111111111111', 4 from public.gigs $$,
  'freelancer avalia o restaurante'
);

reset role;
select is(
  (select rating_avg from public.restaurants where id = '11111111-1111-4111-8111-111111111111'),
  4.00::numeric, 'média do restaurante atualizada'
);
select is(
  (select rating_avg from public.professionals where id = '22222222-2222-4222-8222-222222222222'),
  5.00::numeric, 'média do freelancer atualizada'
);

-- Perfis mostram quem avaliou, para qualquer usuário logado
select pg_temp.act_as('44444444-4444-4444-8444-444444444444');
select is(
  (select reviewer_name from public.review_cards where reviewee_id = '22222222-2222-4222-8222-222222222222'),
  'Bistrô R', 'avaliação do freelancer mostra a loja que avaliou'
);
select is(
  (select reviewer_name from public.review_cards where reviewee_id = '11111111-1111-4111-8111-111111111111'),
  'Ana Souza', 'avaliação da loja mostra o freelancer que avaliou'
);

select * from finish();
rollback;
