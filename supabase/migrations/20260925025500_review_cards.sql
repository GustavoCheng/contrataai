-- Sprint 6 — avaliações nos perfis, com o nome e a foto de quem avaliou.
-- reviews.reviewer_id aponta para profiles, que só o dono lê; o nome vem da loja ou do perfil
-- profissional, que todo usuário logado já lê. security_invoker: vale a RLS de quem consulta.
create view public.review_cards with (security_invoker = true) as
  select rv.id, rv.gig_id, rv.reviewee_id, rv.rating, rv.comment, rv.created_at,
         r.id is not null as by_restaurant,
         coalesce(r.name, p.full_name) as reviewer_name,
         coalesce(r.cover_path, p.photo_path) as reviewer_photo_path
    from public.reviews rv
    left join public.restaurants r on r.id = rv.reviewer_id
    left join public.professionals p on p.id = rv.reviewer_id;
