begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

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

-- R e X = restaurantes, P = profissional
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

select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
select lives_ok(
  $$ insert into public.jobs (restaurant_id, role, description, salary_min_cents, salary_max_cents, shift)
     values ('11111111-1111-4111-8111-111111111111', 'sushi_chef', 'Sushiman para balcão', 350000, 450000, 'night') $$,
  'restaurante cria vaga'
);

reset role;
select pg_temp.act_as('44444444-4444-4444-8444-444444444444');
select throws_ok(
  $$ insert into public.jobs (restaurant_id, role, description, salary_min_cents, shift)
     values ('11111111-1111-4111-8111-111111111111', 'cook', 'x', 100, 'morning') $$,
  '42501', null, 'restaurante não cria vaga em nome de outro'
);

reset role;
select pg_temp.act_as('22222222-2222-4222-8222-222222222222');
select is((select count(*) from public.openings where kind = 'job'), 1::bigint, 'vaga aberta aparece na vitrine');
select throws_ok(
  $$ insert into public.job_applications (job_id, professional_id, status)
     select id, '22222222-2222-4222-8222-222222222222', 'accepted' from public.jobs $$,
  '42501', null, 'profissional não se autoaprova'
);
select lives_ok(
  $$ insert into public.job_applications (job_id, professional_id)
     select id, '22222222-2222-4222-8222-222222222222' from public.jobs $$,
  'profissional se candidata'
);

reset role;
select pg_temp.act_as('44444444-4444-4444-8444-444444444444');
select is((select count(*) from public.job_applications), 0::bigint, 'outro restaurante não vê a candidatura');

reset role;
select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
select lives_ok(
  $$ update public.job_applications set status = 'accepted' $$,
  'restaurante aceita a candidatura'
);
select is((select count(*) from public.conversations), 1::bigint, 'aceite cria a conversa');
update public.job_applications set status = 'rejected';
select is(
  (select status::text from public.job_applications), 'accepted',
  'candidatura decidida não muda mais'
);
update public.jobs set status = 'closed';
select isnt((select closed_at from public.jobs), null, 'encerrar vaga registra a data');
update public.jobs set description = 'editada';
select is((select description from public.jobs), 'Sushiman para balcão', 'vaga encerrada não é editada');

reset role;
select pg_temp.act_as('22222222-2222-4222-8222-222222222222');
select is((select count(*) from public.openings where kind = 'job'), 0::bigint, 'vaga encerrada sai da vitrine');

select * from finish();
rollback;
