-- =====================================================================
-- Sprint 3 — vitrines com distância
-- A localização do profissional nunca sai do banco: só a distância.
-- =====================================================================

create type public.opening_kind as enum ('job', 'gig');

-- Distância em km (haversine) entre point(longitude, latitude); null se faltar um ponto.
create function private.distance_km(a point, b point) returns numeric
language sql immutable strict parallel safe set search_path = '' as $$
  select round((6371 * 2 * asin(sqrt(
    power(sin(radians(b[1] - a[1]) / 2), 2)
    + cos(radians(a[1])) * cos(radians(b[1])) * power(sin(radians(b[0] - a[0]) / 2), 2)
  )))::numeric, 1);
$$;

-- Ponto de quem está vendo: a loja (restaurante) ou a localização aproximada (profissional).
-- Roda com as permissões de quem chama: cada um só lê o próprio ponto.
create function private.viewer_point() returns point
language sql stable set search_path = '' as $$
  select coalesce(
    (select point(r.longitude, r.latitude) from public.restaurants r where r.id = (select auth.uid())),
    (select point(l.longitude, l.latitude) from public.professional_locations l
      where l.professional_id = (select auth.uid()))
  );
$$;

-- Localização privada de um profissional, usada só para calcular distância nas views.
create function private.professional_point(p_professional_id uuid) returns point
language sql stable security definer set search_path = '' as $$
  select point(l.longitude, l.latitude) from public.professional_locations l
   where l.professional_id = p_professional_id;
$$;

-- Vitrine do profissional: vagas fixas e freelas abertos.
drop view public.openings;
create view public.openings with (security_invoker = true) as
  select 'job'::public.opening_kind as kind, j.id, j.restaurant_id, j.role, j.shift,
         j.salary_min_cents as pay_cents, j.salary_max_cents as pay_max_cents,
         null::timestamptz as starts_at, null::timestamptz as ends_at, j.created_at,
         r.name as restaurant_name, r.cover_path, r.neighborhood, r.city, r.city_key, r.state,
         r.rating_avg, r.rating_count,
         private.distance_km((select private.viewer_point()), point(r.longitude, r.latitude)) as distance_km
    from public.jobs j
    join public.restaurants r on r.id = j.restaurant_id
   where j.status = 'open'
  union all
  select 'gig'::public.opening_kind, g.id, g.restaurant_id, g.role, null,
         g.amount_cents, null,
         g.starts_at, g.ends_at, g.created_at,
         r.name, r.cover_path, r.neighborhood, r.city, r.city_key, r.state,
         r.rating_avg, r.rating_count,
         private.distance_km((select private.viewer_point()), point(r.longitude, r.latitude))
    from public.gigs g
    join public.restaurants r on r.id = g.restaurant_id
   where g.status = 'open' and g.starts_at > now();

-- Vitrine do restaurante: profissionais, com a distância até a loja.
create view public.professional_cards with (security_invoker = true) as
  select p.id, p.full_name, p.photo_path, p.main_role, p.secondary_roles,
         p.neighborhood, p.city, p.state, p.available_for_gigs, p.rating_avg, p.rating_count,
         lower(extensions.unaccent('extensions.unaccent'::regdictionary, p.full_name)) as search_name,
         private.distance_km((select private.viewer_point()), private.professional_point(p.id)) as distance_km
    from public.professionals p;
