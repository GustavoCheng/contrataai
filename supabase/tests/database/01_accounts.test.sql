begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

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

-- R = restaurante, P = profissional
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'r@test.dev'),
  ('22222222-2222-4222-8222-222222222222', 'p@test.dev');

select is(
  (select account_type::text from public.profiles where id = '22222222-2222-4222-8222-222222222222'),
  'professional',
  'todo cadastro nasce como profissional'
);

-- O que a Edge Function register-restaurant faz com o service role
update public.profiles set account_type = 'restaurant' where id = '11111111-1111-4111-8111-111111111111';
insert into public.restaurants (id, cnpj, legal_name, name, street, city, state)
values ('11111111-1111-4111-8111-111111111111', '10000000000101', 'LOJA LTDA', 'Loja', 'Rua A', 'SAO PAULO', 'SP');

select is(
  (select city_key from public.restaurants where id = '11111111-1111-4111-8111-111111111111'),
  'sao paulo',
  'city_key normaliza caixa e acento'
);

select pg_temp.act_as('22222222-2222-4222-8222-222222222222');
select throws_ok(
  $$ insert into public.restaurants (id, cnpj, legal_name, name, street, city, state)
     values ('22222222-2222-4222-8222-222222222222', '20000000000202', 'X', 'X', 'X', 'X', 'SP') $$,
  '42501', null, 'profissional não cria loja pelo app'
);
select lives_ok(
  $$ insert into public.professionals (id, full_name, main_role, city, state)
     values ('22222222-2222-4222-8222-222222222222', 'Ana Souza', 'sushi_chef', 'São Paulo', 'SP') $$,
  'profissional cria o próprio perfil'
);
select is(
  (select city_key from public.professionals where id = '22222222-2222-4222-8222-222222222222'),
  'sao paulo',
  '"São Paulo" digitado casa com "SAO PAULO" da Receita'
);
select throws_ok(
  $$ update public.professionals set rating_avg = 5 where id = '22222222-2222-4222-8222-222222222222' $$,
  '42501', null, 'profissional não altera a própria nota'
);
select lives_ok(
  $$ insert into public.payout_accounts (professional_id, pix_key, pix_key_type)
     values ('22222222-2222-4222-8222-222222222222', 'ana@pix.dev', 'email') $$,
  'profissional cadastra chave Pix'
);
select is((select count(*) from public.payout_accounts), 1::bigint, 'dono vê a própria chave Pix');

reset role;
select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
select throws_ok(
  $$ insert into public.professionals (id, full_name, main_role, city, state)
     values ('11111111-1111-4111-8111-111111111111', 'Fake', 'cook', 'X', 'SP') $$,
  '42501', null, 'restaurante não cria perfil de profissional'
);
select is((select count(*) from public.payout_accounts), 0::bigint, 'restaurante não vê chave Pix de ninguém');

reset role;
set local role anon;
select is((select count(*) from public.restaurants), 0::bigint, 'anônimo não lê restaurantes');

reset role;
select lives_ok(
  $$ insert into auth.users (id, email) values ('33333333-3333-4333-8333-333333333333', 'n@test.dev');
     insert into public.restaurants (id, cnpj, legal_name, name, street, city, state)
     values ('33333333-3333-4333-8333-333333333333', '12ABC34501DE35', 'NOVA LTDA', 'Nova', 'Rua B', 'Campinas', 'SP') $$,
  'aceita CNPJ alfanumérico'
);
select throws_ok(
  $$ update public.restaurants set cnpj = '12.ABC.345/01' where id = '33333333-3333-4333-8333-333333333333' $$,
  '23514', null, 'rejeita CNPJ fora do formato'
);

select * from finish();
rollback;
