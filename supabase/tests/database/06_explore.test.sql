begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

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

-- R = restaurante na Faria Lima; P = profissional em Pinheiros; Q = profissional sem CEP
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'r@test.dev'),
  ('22222222-2222-4222-8222-222222222222', 'p@test.dev'),
  ('33333333-3333-4333-8333-333333333333', 'q@test.dev');
update public.profiles set account_type = 'restaurant' where id = '11111111-1111-4111-8111-111111111111';
insert into public.restaurants (id, cnpj, legal_name, name, street, neighborhood, city, state, latitude, longitude)
values ('11111111-1111-4111-8111-111111111111', '10000000000101', 'R LTDA', 'Bistrô R', 'Av. Faria Lima',
        'Itaim Bibi', 'São Paulo', 'SP', -23.5774, -46.6869);
insert into public.professionals (id, full_name, main_role, city, state) values
  ('22222222-2222-4222-8222-222222222222', 'Ana Souza', 'sushi_chef', 'São Paulo', 'SP'),
  ('33333333-3333-4333-8333-333333333333', 'Bruno Lima', 'cook', 'São Paulo', 'SP');
insert into public.professional_locations (professional_id, postal_code, latitude, longitude)
values ('22222222-2222-4222-8222-222222222222', '05422030', -23.5685, -46.6934);
insert into public.jobs (restaurant_id, role, description, salary_min_cents, shift)
values ('11111111-1111-4111-8111-111111111111', 'sushi_chef', 'Balcão', 300000, 'night');
insert into public.gigs (restaurant_id, role, starts_at, ends_at, amount_cents) values
  ('11111111-1111-4111-8111-111111111111', 'sushi_chef', now() + interval '1 day', now() + interval '30 hours', 25000),
  ('11111111-1111-4111-8111-111111111111', 'cook', now() - interval '2 days', now() - interval '1 day', 20000);

select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
select ok(
  (select distance_km between 0.5 and 2 from public.professional_cards
    where id = '22222222-2222-4222-8222-222222222222'),
  'restaurante vê a distância até o profissional (~1 km)'
);
select is(
  (select distance_km from public.professional_cards where id = '33333333-3333-4333-8333-333333333333'),
  null, 'sem CEP, a distância fica vazia'
);
select is(
  (select search_name from public.professional_cards where id = '22222222-2222-4222-8222-222222222222'),
  'ana souza', 'nome de busca sem acento e em minúsculas'
);
select is((select count(*) from public.professional_locations), 0::bigint, 'mas não lê a localização');
select is(
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'professional_cards'
      and column_name in ('latitude', 'longitude', 'postal_code')),
  0::bigint, 'a view não expõe coordenadas nem CEP'
);

reset role;
select pg_temp.act_as('22222222-2222-4222-8222-222222222222');
select results_eq(
  $$ select kind::text, role::text from public.openings order by kind $$,
  $$ values ('gig', 'sushi_chef'), ('job', 'sushi_chef') $$,
  'vitrine traz a vaga e só o freela futuro'
);
select ok(
  (select bool_and(distance_km between 0.5 and 2) from public.openings),
  'profissional vê a distância até a loja'
);

reset role;
select pg_temp.act_as('33333333-3333-4333-8333-333333333333');
select ok(
  (select bool_and(distance_km is null) from public.openings),
  'profissional sem localização vê a vitrine sem distância'
);

reset role;
set local role anon;
select is((select count(*) from public.openings), 0::bigint, 'anônimo não vê a vitrine');

select * from finish();
rollback;
