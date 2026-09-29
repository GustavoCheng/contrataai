-- Dados de demonstração (ambiente local e de testes na nuvem). Senha de todas as contas: contrataai123
-- Antes de lançar com dinheiro de verdade, apague estas contas do projeto na nuvem.
-- O cadastro real de restaurante passa pela Edge Function register-restaurant;
-- aqui as lojas são criadas direto para agilizar os testes manuais.

create function pg_temp.seed_user(p_id uuid, p_email text) returns void
language sql as $$
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  )
  values (
    '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt('contrataai123', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(), p_id, p_id::text,
    jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
    'email', now(), now(), now()
  );
$$;

-- Horário local de São Paulo daqui a N dias (ex.: amanhã às 18h).
create function pg_temp.sp_time(p_days int, p_time time) returns timestamptz
language sql as $$
  select ((now() at time zone 'America/Sao_Paulo')::date + p_days + p_time) at time zone 'America/Sao_Paulo';
$$;

-- ---------------------------------------------------------------------
-- Restaurantes
-- ---------------------------------------------------------------------
select pg_temp.seed_user(id::uuid, email) from (values
  ('a1a1a1a1-0000-4000-8000-000000000001', 'restaurante@contrataai.dev'),
  ('a1a1a1a1-0000-4000-8000-000000000002', 'sushikaze@contrataai.dev'),
  ('a1a1a1a1-0000-4000-8000-000000000003', 'cantinabella@contrataai.dev'),
  ('a1a1a1a1-0000-4000-8000-000000000004', 'fornodepedra@contrataai.dev'),
  ('a1a1a1a1-0000-4000-8000-000000000005', 'burgernorte@contrataai.dev'),
  ('a1a1a1a1-0000-4000-8000-000000000006', 'cafedavila@contrataai.dev')
) as seed(id, email);

update public.profiles set account_type = 'restaurant' where id::text like 'a1a1a1a1-%';

insert into public.restaurants (
  id, cnpj, legal_name, name, description, founded_on,
  street, number, neighborhood, postal_code, city, state, latitude, longitude
)
values
  ('a1a1a1a1-0000-4000-8000-000000000001', '11222333000181', 'BISTRO FARIA LIMA LTDA', 'Bistrô Faria Lima',
   'Cozinha contemporânea com foco em peixes frescos.', '2016-03-10',
   'Avenida Brigadeiro Faria Lima', '3477', 'Itaim Bibi', '04538133', 'São Paulo', 'SP', -23.5773909, -46.686881),
  ('a1a1a1a1-0000-4000-8000-000000000002', '21333444000119', 'SUSHI KAZE RESTAURANTE LTDA', 'Sushi Kaze',
   'Restaurante japonês tradicional, balcão de sushi com 12 lugares.', '2012-06-01',
   'Rua Galvão Bueno', '410', 'Liberdade', '01506000', 'São Paulo', 'SP', -23.5586, -46.6353),
  ('a1a1a1a1-0000-4000-8000-000000000003', '31444555000156', 'CANTINA BELLA ITALIA LTDA', 'Cantina Bella',
   'Cantina italiana de família no Bixiga desde os anos 90.', '1994-02-15',
   'Rua Treze de Maio', '720', 'Bela Vista', '01327000', 'São Paulo', 'SP', -23.5597, -46.6457),
  ('a1a1a1a1-0000-4000-8000-000000000004', '41555666000193', 'FORNO DE PEDRA PIZZARIA LTDA', 'Forno de Pedra',
   'Pizzaria napolitana com forno a lenha.', '2019-09-20',
   'Avenida Ibirapuera', '2120', 'Moema', '04028002', 'São Paulo', 'SP', -23.6005, -46.6627),
  ('a1a1a1a1-0000-4000-8000-000000000005', '51666777000120', 'BURGER NORTE LANCHONETE LTDA', 'Burger Norte',
   'Hambúrguer artesanal na chapa, delivery próprio.', '2021-04-05',
   'Rua Voluntários da Pátria', '1850', 'Santana', '02011000', 'São Paulo', 'SP', -23.5029, -46.6247),
  ('a1a1a1a1-0000-4000-8000-000000000006', '61777888000168', 'CAFE DA VILA LTDA', 'Café da Vila',
   'Café e confeitaria artesanal, brunch aos fins de semana.', '2018-11-12',
   'Rua Aspicuelta', '345', 'Vila Madalena', '05433010', 'São Paulo', 'SP', -23.5566, -46.6906);

-- ---------------------------------------------------------------------
-- Profissionais (profissional@contrataai.dev fica sem perfil: testa o onboarding)
-- ---------------------------------------------------------------------
select pg_temp.seed_user(id::uuid, email) from (values
  ('b2b2b2b2-0000-4000-8000-000000000001', 'profissional@contrataai.dev'),
  ('b2b2b2b2-0000-4000-8000-000000000002', 'marina@contrataai.dev'),
  ('b2b2b2b2-0000-4000-8000-000000000003', 'rafael@contrataai.dev'),
  ('b2b2b2b2-0000-4000-8000-000000000004', 'juliana@contrataai.dev'),
  ('b2b2b2b2-0000-4000-8000-000000000005', 'diego@contrataai.dev'),
  ('b2b2b2b2-0000-4000-8000-000000000006', 'carla@contrataai.dev'),
  ('b2b2b2b2-0000-4000-8000-000000000007', 'thiago@contrataai.dev'),
  ('b2b2b2b2-0000-4000-8000-000000000008', 'beatriz@contrataai.dev'),
  ('b2b2b2b2-0000-4000-8000-000000000009', 'lucas@contrataai.dev')
) as seed(id, email);

insert into public.professionals (
  id, full_name, main_role, secondary_roles, experience, neighborhood, city, state, available_for_gigs
)
values
  ('b2b2b2b2-0000-4000-8000-000000000002', 'Marina Costa', 'sushi_chef', '{cook}',
   '7 anos em restaurantes japoneses. Sashimi, nigiri e hot roll.', 'Pinheiros', 'São Paulo', 'SP', true),
  ('b2b2b2b2-0000-4000-8000-000000000003', 'Rafael Lima', 'cook', '{griddle_cook}',
   'Cozinha brasileira e pratos executivos, 5 anos de linha quente.', 'Mooca', 'São Paulo', 'SP', true),
  ('b2b2b2b2-0000-4000-8000-000000000004', 'Juliana Alves', 'confectioner', '{}',
   'Confeiteira há 6 anos: bolos, tortas e sobremesas empratadas.', 'Vila Mariana', 'São Paulo', 'SP', false),
  ('b2b2b2b2-0000-4000-8000-000000000005', 'Diego Santos', 'pizza_maker', '{cook}',
   'Pizzaiolo de forno a lenha, massa de fermentação natural.', 'Moema', 'São Paulo', 'SP', true),
  ('b2b2b2b2-0000-4000-8000-000000000006', 'Carla Menezes', 'kitchen_assistant', '{dishwasher}',
   'Pré-preparo, organização de câmara fria e higiene.', 'Santana', 'São Paulo', 'SP', true),
  ('b2b2b2b2-0000-4000-8000-000000000007', 'Thiago Rocha', 'delivery_rider', '{}',
   'Motoboy com moto própria e baú, conhece bem o centro.', 'Liberdade', 'São Paulo', 'SP', true),
  ('b2b2b2b2-0000-4000-8000-000000000008', 'Beatriz Nunes', 'waiter', '{bartender,cashier}',
   'Atendimento em salão e bar, drinks clássicos.', 'Bela Vista', 'São Paulo', 'SP', false),
  ('b2b2b2b2-0000-4000-8000-000000000009', 'Lucas Pereira', 'griddle_cook', '{cook}',
   'Chapeiro em hamburgueria de alto volume, 4 anos.', 'Barra Funda', 'São Paulo', 'SP', true);

insert into public.professional_locations (professional_id, postal_code, latitude, longitude)
values
  ('b2b2b2b2-0000-4000-8000-000000000002', '05422030', -23.57, -46.69),
  ('b2b2b2b2-0000-4000-8000-000000000003', '03104000', -23.56, -46.60),
  ('b2b2b2b2-0000-4000-8000-000000000004', '04116000', -23.59, -46.64),
  ('b2b2b2b2-0000-4000-8000-000000000005', '04077000', -23.60, -46.66),
  ('b2b2b2b2-0000-4000-8000-000000000006', '02012000', -23.50, -46.63),
  ('b2b2b2b2-0000-4000-8000-000000000007', '01508000', -23.56, -46.64),
  ('b2b2b2b2-0000-4000-8000-000000000008', '01326000', -23.56, -46.65),
  ('b2b2b2b2-0000-4000-8000-000000000009', '01139000', -23.53, -46.67);

-- Chaves Pix de teste do sandbox do Asaas (a transferência é simulada com sucesso).
insert into public.payout_accounts (professional_id, pix_key, pix_key_type)
values
  ('b2b2b2b2-0000-4000-8000-000000000002', 'cliente-a00001@pix.bcb.gov.br', 'email'),
  ('b2b2b2b2-0000-4000-8000-000000000003', 'cliente-a00002@pix.bcb.gov.br', 'email'),
  ('b2b2b2b2-0000-4000-8000-000000000005', 'cliente-a00003@pix.bcb.gov.br', 'email'),
  ('b2b2b2b2-0000-4000-8000-000000000009', 'cliente-a00004@pix.bcb.gov.br', 'email');

-- ---------------------------------------------------------------------
-- Vagas fixas abertas
-- ---------------------------------------------------------------------
insert into public.jobs (restaurant_id, role, description, salary_min_cents, salary_max_cents, shift)
values
  ('a1a1a1a1-0000-4000-8000-000000000002', 'sushi_chef',
   'Sushiman para o balcão. Experiência com peixes nobres e atendimento ao cliente.', 350000, 450000, 'night'),
  ('a1a1a1a1-0000-4000-8000-000000000002', 'kitchen_assistant',
   'Auxiliar para pré-preparo e montagem de pratos quentes.', 190000, 220000, 'afternoon'),
  ('a1a1a1a1-0000-4000-8000-000000000003', 'cook',
   'Cozinheiro(a) de massas frescas e molhos da casa.', 280000, 330000, 'night'),
  ('a1a1a1a1-0000-4000-8000-000000000003', 'waiter',
   'Garçom/garçonete para o salão, sextas e sábados com gorjeta.', 180000, null, 'night'),
  ('a1a1a1a1-0000-4000-8000-000000000004', 'pizza_maker',
   'Pizzaiolo(a) para forno a lenha, abertura de massa e controle de forno.', 300000, 360000, 'night'),
  ('a1a1a1a1-0000-4000-8000-000000000005', 'griddle_cook',
   'Chapeiro(a) para hambúrguer artesanal, alto volume no delivery.', 240000, 280000, 'afternoon'),
  ('a1a1a1a1-0000-4000-8000-000000000006', 'confectioner',
   'Confeiteiro(a) para a produção diária de bolos e tortas.', 260000, 300000, 'morning'),
  ('a1a1a1a1-0000-4000-8000-000000000001', 'cook',
   'Cozinheiro(a) de linha para peixes e frutos do mar.', 320000, 380000, 'full_day');

-- ---------------------------------------------------------------------
-- Freelas abertos (datas relativas a hoje, horário de São Paulo; espalhadas em duas semanas
-- para o ambiente de testes na nuvem, que não é recriado todo dia, não ficar vazio)
-- ---------------------------------------------------------------------
insert into public.gigs (restaurant_id, role, starts_at, ends_at, amount_cents)
values
  ('a1a1a1a1-0000-4000-8000-000000000001', 'sushi_chef', pg_temp.sp_time(2, '18:00'), pg_temp.sp_time(3, '00:00'), 25000),
  ('a1a1a1a1-0000-4000-8000-000000000002', 'sushi_chef', pg_temp.sp_time(5, '18:00'), pg_temp.sp_time(6, '00:00'), 28000),
  ('a1a1a1a1-0000-4000-8000-000000000005', 'griddle_cook', pg_temp.sp_time(3, '11:00'), pg_temp.sp_time(3, '17:00'), 18000),
  ('a1a1a1a1-0000-4000-8000-000000000004', 'pizza_maker', pg_temp.sp_time(9, '18:00'), pg_temp.sp_time(9, '23:30'), 22000),
  ('a1a1a1a1-0000-4000-8000-000000000006', 'kitchen_assistant', pg_temp.sp_time(14, '07:00'), pg_temp.sp_time(14, '13:00'), 15000);
