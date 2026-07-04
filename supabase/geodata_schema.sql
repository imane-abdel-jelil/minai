-- ==================================================================
-- MINAI · Schéma PostGIS pour données géospatiales
-- ==================================================================
--
-- Ce script :
--   1. Active l'extension PostGIS (requêtes spatiales natives)
--   2. Crée 3 tables : villages, water_points, wilayas
--   3. Ajoute des index GIST pour les requêtes spatiales rapides
--   4. Active RLS avec lecture publique (les données sont non-sensibles)
--
-- À exécuter dans Supabase → SQL Editor → New query → Run.
--
-- IMPORTANT : ce script ne casse RIEN de l'application actuelle.
-- Le frontend continue à lire les fichiers geojson statiques.
-- On ne bascule le frontend vers ces tables QU'APRÈS ton pitch.
-- ==================================================================

-- ─── 1. Activer PostGIS ────────────────────────────────────────────
create extension if not exists postgis;

-- ─── 2. Table VILLAGES ─────────────────────────────────────────────
-- Contient les 8 447 localités ANSADE RGPH-5 avec leurs métadonnées
-- démographiques et le scoring pré-calculé.

drop table if exists public.villages cascade;
create table public.villages (
  id                    uuid primary key default gen_random_uuid(),

  -- Identifiants ANSADE
  code_localite         int unique not null,
  name_fr               text not null,
  name_ar               text,

  -- Rattachement administratif
  wilaya                text,
  wilaya_id             text,
  moughataa             text,
  moughataa_ar          text,
  commune               text,
  commune_ar            text,

  -- Démographie (ANSADE RGPH-5)
  population_total      int not null default 0,
  population_femmes     int,
  population_hommes     int,

  -- Infrastructure
  reseau_aep            boolean not null default false,
  electricite           text,

  -- Géométrie WGS84
  geom                  geometry(Point, 4326) not null,

  -- Scoring MINAI (pré-calculé par compute-village-scores)
  distance_to_water_km  numeric(10,2),
  nearest_water_lng     numeric(11,7),
  nearest_water_lat     numeric(11,7),
  nearest_water_type    text,
  status                text check (status in ('critical', 'risk', 'ok')),
  priority_score        bigint,
  is_top_priority       boolean not null default false,
  is_success_story      boolean not null default false,

  -- Audit
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Index spatial (obligatoire pour les requêtes ST_DWithin, ST_Intersects, etc.)
create index villages_geom_idx      on public.villages using gist (geom);
-- Index conventionnels
create index villages_code_idx      on public.villages (code_localite);
create index villages_wilaya_id_idx on public.villages (wilaya_id);
create index villages_status_idx    on public.villages (status);
create index villages_top_idx       on public.villages (is_top_priority) where is_top_priority = true;
create index villages_success_idx   on public.villages (is_success_story) where is_success_story = true;

-- ─── 3. Table WATER_POINTS ─────────────────────────────────────────
-- Contient les points d'eau (puits, forages, sources, fontaines).
-- Sources multiples : ANSADE, OSM, WPDx, contributions manuelles.

drop table if exists public.water_points cascade;
create table public.water_points (
  id                    uuid primary key default gen_random_uuid(),

  -- Identifiants (peut être null pour les sources non-ANSADE)
  code_localite         int,
  name                  text,

  -- Typologie
  type                  text,             -- ANSADE : 'Puits' / 'Forage'
  kind                  text,             -- OSM     : 'drinking_water', 'well', 'borehole', 'spring', 'tap', 'water_works', 'other'
  categorie             text,
  source                text not null default 'ANSADE'  -- 'ANSADE' | 'OSM' | 'WPDx' | 'manual'
                        check (source in ('ANSADE','OSM','WPDx','manual')),

  -- Rattachement administratif (pour ANSADE)
  wilaya                text,
  moughataa             text,
  commune               text,

  -- Attributs OSM
  drinkable             text,
  operational_status    text,

  -- Géométrie WGS84
  geom                  geometry(Point, 4326) not null,

  -- Audit
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index water_points_geom_idx    on public.water_points using gist (geom);
create index water_points_source_idx  on public.water_points (source);
create index water_points_type_idx    on public.water_points (type);
create index water_points_kind_idx    on public.water_points (kind);

-- ─── 4. Table WILAYAS ──────────────────────────────────────────────
-- Contient les 15 wilayas mauritaniennes avec leurs polygones
-- administratifs (geoBoundaries level ADM1).

drop table if exists public.wilayas cascade;
create table public.wilayas (
  id                    text primary key,           -- ex: 'ADR', 'HCH', 'NKC'
  name                  text not null,
  shape_name            text,
  geom                  geometry(MultiPolygon, 4326) not null,

  -- Métadonnées optionnelles
  population            int,
  capital               text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index wilayas_geom_idx on public.wilayas using gist (geom);

-- ─── 5. Row Level Security ─────────────────────────────────────────
-- Les données géographiques sont publiques (données ANSADE ouvertes +
-- OSM), donc lecture libre pour tous. Écriture réservée aux admins
-- (via service_role uniquement, pas de policy insert/update/delete
-- côté client). Le RBAC multi-org viendra au chantier 3.

alter table public.villages     enable row level security;
alter table public.water_points enable row level security;
alter table public.wilayas      enable row level security;

create policy "villages_public_read"     on public.villages     for select to anon, authenticated using (true);
create policy "water_points_public_read" on public.water_points for select to anon, authenticated using (true);
create policy "wilayas_public_read"      on public.wilayas      for select to anon, authenticated using (true);

-- ─── 6. Trigger updated_at auto ────────────────────────────────────
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger villages_touch     before update on public.villages
  for each row execute procedure public.touch_updated_at();
create trigger water_points_touch before update on public.water_points
  for each row execute procedure public.touch_updated_at();
create trigger wilayas_touch      before update on public.wilayas
  for each row execute procedure public.touch_updated_at();

-- ─── 7. Vérification ───────────────────────────────────────────────
-- Après exécution du script tu peux vérifier avec :
--
--   select count(*) from public.villages;      -- doit être 0 pour l'instant
--   select count(*) from public.water_points;  -- idem
--   select count(*) from public.wilayas;       -- idem
--   select postgis_version();                  -- confirme PostGIS actif
--
-- L'import des données se fait ensuite via :
--   npm run import:geodata
