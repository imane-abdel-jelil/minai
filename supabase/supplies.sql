-- ==================================================================
-- MINAI · Table `supplies` (ravitaillements d'eau enregistrés par
-- ONG et institutions partenaires)
-- ==================================================================
--
-- À exécuter dans Supabase → SQL Editor → New query, puis Run.
--
-- Contient :
--   1. Création de la table (avec status 'planned' pour les prochains)
--   2. RLS : lecture inter-organisations, écriture propriétaire
--   3. Seed : 12 ravitaillements récents + 5 planifiés à venir
--
-- ==================================================================

drop table if exists public.supplies cascade;

-- ─── Table ─────────────────────────────────────────────────────────
create table public.supplies (
  id                       uuid primary key default gen_random_uuid(),
  organization             text not null,
  organization_type        text not null default 'ngo' check (organization_type in ('ngo','institution','un_agency','red_crescent')),
  village_code_localite    int,
  village_name             text not null,
  village_wilaya           text not null,
  quantity_m3              numeric(10,2) not null default 0,
  supply_date              date not null,
  status                   text not null check (status in ('delivered','in_progress','delayed','planned')),
  notes                    text,
  created_by               uuid references auth.users(id),
  created_at               timestamptz not null default now()
);

create index supplies_org_idx on public.supplies (organization);
create index supplies_date_idx on public.supplies (supply_date desc);
create index supplies_status_idx on public.supplies (status);
create index supplies_created_by_idx on public.supplies (created_by);

-- ─── RLS ───────────────────────────────────────────────────────────
alter table public.supplies enable row level security;

create policy "supplies_select_all_authenticated"
  on public.supplies for select to authenticated using (true);

create policy "supplies_insert_own"
  on public.supplies for insert to authenticated with check (created_by = auth.uid());

create policy "supplies_update_own"
  on public.supplies for update to authenticated using (created_by = auth.uid());

create policy "supplies_delete_own"
  on public.supplies for delete to authenticated using (created_by = auth.uid());

-- ─── Seed : ravitaillements RÉALISÉS / EN COURS / RETARDÉS ────────
insert into public.supplies
  (organization, organization_type, village_code_localite, village_name,
   village_wilaya, quantity_m3, supply_date, status, notes, created_by)
values
  ('Water4All',                    'ngo',          33609, 'Mbera 2',        'Hodh Chargui',   45.0, current_date - interval '2 days',  'delivered',   'Camion-citerne · convoi mensuel',                 null),
  ('Water4All',                    'ngo',          67686, 'Oum Eacheiche',  'Hodh Chargui',   28.0, current_date - interval '9 days',  'delivered',   'Distribution jerricans 20L',                      null),
  ('Water4All',                    'ngo',          14646, 'Legaida',        'Hodh Chargui',   35.0, current_date - interval '15 days', 'in_progress', 'Convoi en route depuis Néma',                      null),

  ('UNICEF Mauritanie',            'un_agency',    51555, 'Camp Mberra',    'Hodh Chargui',  120.0, current_date - interval '1 days',  'delivered',   'Programme WASH camp de réfugiés maliens',         null),
  ('UNICEF Mauritanie',            'un_agency',    19488, 'Néma',           'Hodh Chargui',   60.0, current_date - interval '5 days',  'delivered',   'Réhabilitation puits + citerne relais',           null),

  ('Croissant-Rouge Mauritanien',  'red_crescent', 46374, 'Aioune',         'Hodh El Gharbi', 40.0, current_date - interval '3 days',  'delivered',   'Distribution mensuelle · saison chaude',          null),
  ('Croissant-Rouge Mauritanien',  'red_crescent', 26628, 'Tenouagoutim',   'Hodh Chargui',   22.0, current_date - interval '18 days', 'delayed',     'Route ensablée · report technique',                null),

  ('Action Contre la Faim',        'ngo',          58911, 'Legrane',        'Hodh Chargui',   30.0, current_date - interval '4 days',  'delivered',   'Volet urgence · nutrition + eau',                 null),
  ('Action Contre la Faim',        'ngo',          10035, 'Elhassi Twil',   'Hodh Chargui',   25.0, current_date - interval '11 days', 'in_progress', 'Camion citerne + formation communautaire',        null),

  ('Ministère de l''Hydraulique',  'institution',  33393, 'Guerou',         'Assaba',         85.0, current_date - interval '6 days',  'delivered',   'Extension du réseau AEP · phase 2',                null),
  ('Ministère de l''Hydraulique',  'institution',  90063, 'Tintane',        'Hodh El Gharbi', 70.0, current_date - interval '13 days', 'delivered',   'Nouveau forage productif · mise en service',      null),

  ('PAM Mauritanie',               'un_agency',    99990, 'Bir Elbarka',    'Hodh Chargui',   18.0, current_date - interval '8 days',  'delivered',   'Complément saisonnier · corridor logistique',     null);

-- ─── Seed : PROCHAINS ravitaillements planifiés (à venir) ─────────
insert into public.supplies
  (organization, organization_type, village_code_localite, village_name,
   village_wilaya, quantity_m3, supply_date, status, notes, created_by)
values
  ('Water4All',                    'ngo',          87549, 'Sondage Eteidouma','Hodh Chargui',  30.0, current_date + interval '3 days',  'planned', 'Convoi hebdomadaire · départ Néma',                   null),
  ('UNICEF Mauritanie',            'un_agency',    99990, 'Bir Elbarka',     'Hodh Chargui',  40.0, current_date + interval '5 days',  'planned', 'Complément saison chaude · citernes flexibles',        null),
  ('Croissant-Rouge Mauritanien',  'red_crescent', 26628, 'Tenouagoutim',    'Hodh Chargui',  25.0, current_date + interval '7 days',  'planned', 'Rattrapage du convoi retardé la semaine dernière',     null),
  ('Action Contre la Faim',        'ngo',          58911, 'Legrane',         'Hodh Chargui',  35.0, current_date + interval '10 days', 'planned', 'Programme mensuel · urgence nutritionnelle',           null),
  ('Ministère de l''Hydraulique',  'institution',  10035, 'Elhassi Twil',    'Hodh Chargui', 100.0, current_date + interval '14 days', 'planned', 'Étude préalable · forage exploratoire',                null);

-- ─── Vérification ──────────────────────────────────────────────────
-- select organization, village_name, supply_date, status
-- from public.supplies order by supply_date desc;
