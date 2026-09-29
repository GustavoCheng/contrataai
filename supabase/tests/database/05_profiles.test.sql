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

-- R e X = restaurantes; P e Q = profissionais
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'r@test.dev'),
  ('44444444-4444-4444-8444-444444444444', 'x@test.dev'),
  ('22222222-2222-4222-8222-222222222222', 'p@test.dev'),
  ('33333333-3333-4333-8333-333333333333', 'q@test.dev');
update public.profiles set account_type = 'restaurant'
 where id in ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444');
insert into public.restaurants (id, cnpj, legal_name, name, street, city, state, latitude, longitude) values
  ('11111111-1111-4111-8111-111111111111', '10000000000101', 'R LTDA', 'Bistrô R', 'Rua A', 'São Paulo', 'SP', -23.5, -46.6),
  ('44444444-4444-4444-8444-444444444444', '20000000000202', 'X LTDA', 'Cantina X', 'Rua B', 'Rio de Janeiro', 'RJ', -22.9, -43.1);
insert into public.professionals (id, full_name, main_role, city, state) values
  ('22222222-2222-4222-8222-222222222222', 'Ana Souza', 'sushi_chef', 'São Paulo', 'SP'),
  ('33333333-3333-4333-8333-333333333333', 'Bruno Lima', 'cook', 'São Paulo', 'SP');

select pg_temp.act_as('22222222-2222-4222-8222-222222222222');
select lives_ok(
  $$ insert into public.professional_locations (professional_id, postal_code, latitude, longitude)
     values ('22222222-2222-4222-8222-222222222222', '05422030', -23.5684776, -46.6933901) $$,
  'profissional grava a própria localização'
);
select results_eq(
  $$ select latitude, longitude from public.professional_locations $$,
  $$ values (-23.57::numeric, -46.69::numeric) $$,
  'coordenadas do profissional ficam com 2 casas (~1 km)'
);
select lives_ok(
  $$ update public.professionals set neighborhood = 'Pinheiros' where id = '22222222-2222-4222-8222-222222222222' $$,
  'profissional define o bairro público'
);
select throws_ok(
  $$ insert into public.professional_locations (professional_id, postal_code)
     values ('33333333-3333-4333-8333-333333333333', '01001000') $$,
  '42501', null, 'ninguém grava a localização de outro'
);
select lives_ok(
  $$ insert into public.payout_accounts (professional_id, pix_key, pix_key_type)
     values ('22222222-2222-4222-8222-222222222222', 'ana@pix.dev', 'email') $$,
  'profissional cadastra a chave Pix'
);

reset role;
select pg_temp.act_as('33333333-3333-4333-8333-333333333333');
select is((select count(*) from public.professional_locations), 0::bigint, 'outro profissional não vê a localização');
delete from public.payout_accounts where professional_id = '22222222-2222-4222-8222-222222222222';

reset role;
select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
select is((select count(*) from public.professional_locations), 0::bigint, 'restaurante não vê a localização');
select lives_ok(
  $$ update public.restaurants set latitude = -23.5863, longitude = -46.6817 where id = '11111111-1111-4111-8111-111111111111' $$,
  'restaurante atualiza as coordenadas da loja'
);
update public.restaurants set latitude = 0, longitude = 0 where id = '44444444-4444-4444-8444-444444444444';

reset role;
select is(
  (select latitude from public.restaurants where id = '44444444-4444-4444-8444-444444444444'),
  -22.9::float8,
  'restaurante não mexe nas coordenadas de outro'
);
select is((select count(*) from public.payout_accounts), 1::bigint, 'terceiro não apaga a chave Pix de ninguém');

select pg_temp.act_as('22222222-2222-4222-8222-222222222222');
select lives_ok(
  $$ delete from public.payout_accounts where professional_id = '22222222-2222-4222-8222-222222222222' $$,
  'profissional remove a própria chave Pix'
);
select lives_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('avatars', '22222222-2222-4222-8222-222222222222/foto.jpg') $$,
  'envia foto para a própria pasta'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('avatars', '33333333-3333-4333-8333-333333333333/foto.jpg') $$,
  '42501', null, 'não envia foto para a pasta de outro'
);

select * from finish();
rollback;
