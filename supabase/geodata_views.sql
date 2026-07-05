-- ==================================================================
-- MINAI · Views PostGIS qui exposent les géométries en GeoJSON
-- ==================================================================
--
-- Ces vues traduisent le champ `geom` (type PostGIS binaire) en objet
-- GeoJSON standard. Le frontend interroge ces vues directement plutôt
-- que les tables brutes, et récupère des Features prêtes à passer à
-- Mapbox sans conversion supplémentaire.
--
-- PRÉ-REQUIS : supabase/geodata_schema.sql exécuté + données importées
-- (npm run import:geodata).
--
-- À exécuter dans Supabase → SQL Editor → New query → Run.
-- ==================================================================

-- ─── VUE villages_geojson ──────────────────────────────────────────
create or replace view public.villages_geojson
with (security_invoker = on)
as
select
  code_localite,
  name_fr,
  name_ar,
  wilaya,
  wilaya_id,
  moughataa,
  moughataa_ar,
  commune,
  commune_ar,
  population_total,
  population_femmes,
  population_hommes,
  reseau_aep,
  electricite,
  ST_AsGeoJSON(geom)::jsonb as geom,
  distance_to_water_km,
  nearest_water_lng,
  nearest_water_lat,
  nearest_water_type,
  status,
  priority_score,
  is_top_priority,
  is_success_story
from public.villages;

-- ─── VUE water_points_geojson ──────────────────────────────────────
create or replace view public.water_points_geojson
with (security_invoker = on)
as
select
  code_localite,
  name,
  type,
  kind,
  source,
  categorie,
  wilaya,
  moughataa,
  commune,
  drinkable,
  operational_status,
  ST_AsGeoJSON(geom)::jsonb as geom
from public.water_points;

-- ─── VUE wilayas_geojson ───────────────────────────────────────────
create or replace view public.wilayas_geojson
with (security_invoker = on)
as
select
  id,
  name,
  shape_name,
  population,
  capital,
  ST_AsGeoJSON(geom)::jsonb as geom
from public.wilayas;

-- ─── Droits d'accès sur les vues ───────────────────────────────────
-- Les vues avec security_invoker=on héritent des policies RLS des
-- tables sous-jacentes (lecture publique). On ajoute juste le grant
-- SELECT pour être explicite.
grant select on public.villages_geojson     to anon, authenticated;
grant select on public.water_points_geojson to anon, authenticated;
grant select on public.wilayas_geojson      to anon, authenticated;

-- ─── Vérification ──────────────────────────────────────────────────
-- Après exécution, tu peux tester avec :
--
--   select count(*), jsonb_typeof(geom) as geom_type
--   from public.villages_geojson
--   group by jsonb_typeof(geom);
--   -- attendu : 8447 lignes, geom_type='object'
--
--   select code_localite, name_fr, geom
--   from public.villages_geojson
--   where is_top_priority = true
--   limit 3;
--   -- attendu : 3 villages avec geom={"type":"Point","coordinates":[lng, lat]}
