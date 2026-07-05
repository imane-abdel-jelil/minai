-- ==================================================================
-- MINAI · Chantier 2 · Table village_updates
-- ==================================================================
--
-- Signalements de correction envoyés par les partenaires ONG et
-- institutionnels via l'UI "Signaler une erreur" sur un village.
--
-- FLUX
--   1. Partenaire sur le terrain constate une info fausse ou obsolète
--   2. Ouvre le popup du village → clique "Signaler une erreur"
--   3. Choisit le champ concerné, propose une nouvelle valeur, ajoute
--      un motif + éventuellement une photo (v2)
--   4. Ligne créée avec status='pending', created_by = auth.uid()
--   5. Admin institutionnel (Ministère, MINAI ops) valide via la vue
--      Rapports → statut passe à 'approved' ou 'rejected'
--   6. Si 'approved', la valeur est appliquée à la table villages
--      (v2 : trigger automatique · pour l'instant : manuel)
--
-- À exécuter dans Supabase → SQL Editor → New query → Run.
-- ==================================================================

drop table if exists public.village_updates cascade;

create table public.village_updates (
  id                        uuid primary key default gen_random_uuid(),

  -- Village concerné (dénormalisé pour lecture facile)
  village_code_localite     int not null,
  village_name              text not null,
  village_wilaya            text,

  -- Champ signalé
  field_name                text not null check (field_name in (
    'name_fr', 'name_ar', 'population_total', 'distance_to_water_km',
    'reseau_aep', 'coordinates', 'moughataa', 'commune', 'other'
  )),
  current_value             text,
  proposed_value            text not null,
  reason                    text,

  -- Métadonnées d'audit
  submitted_by              uuid references auth.users(id) not null,
  submitted_by_organization text,
  submitted_at              timestamptz not null default now(),

  -- Workflow de validation
  status                    text not null default 'pending' check (status in (
    'pending', 'approved', 'rejected', 'implemented'
  )),
  reviewed_by               uuid references auth.users(id),
  review_notes              text,
  reviewed_at               timestamptz,

  -- Trace de modification
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index village_updates_status_idx  on public.village_updates (status);
create index village_updates_village_idx on public.village_updates (village_code_localite);
create index village_updates_created_idx on public.village_updates (created_at desc);
create index village_updates_org_idx     on public.village_updates (submitted_by_organization);

-- ─── RLS ───────────────────────────────────────────────────────────
alter table public.village_updates enable row level security;

-- Lecture : tout utilisateur authentifié voit tous les signalements
-- (pour la transparence inter-organisations).
create policy "village_updates_read_authenticated"
  on public.village_updates for select
  to authenticated
  using (true);

-- Insertion : uniquement pour utilisateurs connectés, avec created_by
-- = auth.uid() pour empêcher usurpation.
create policy "village_updates_insert_own"
  on public.village_updates for insert
  to authenticated
  with check (submitted_by = auth.uid());

-- Modification propre : le soumettant peut éditer son signalement
-- tant qu'il n'est pas encore validé.
create policy "village_updates_update_own_pending"
  on public.village_updates for update
  to authenticated
  using (submitted_by = auth.uid() and status = 'pending');

-- Suppression : idem, seulement les propres pending.
create policy "village_updates_delete_own_pending"
  on public.village_updates for delete
  to authenticated
  using (submitted_by = auth.uid() and status = 'pending');

-- NOTE : à ce stade, TOUT utilisateur authentifié peut approuver /
-- rejeter (bypass RLS via service_role côté admin). Le vrai RBAC
-- viendra au chantier 3 : distinction 'admin_institutionnel' vs
-- 'coordinator_ong' vs 'field_agent'.

-- ─── Trigger updated_at auto ───────────────────────────────────────
create trigger village_updates_touch
  before update on public.village_updates
  for each row execute procedure public.touch_updated_at();

-- ─── Seed démo · 4 signalements exemples ──────────────────────────
-- Pour illustrer immédiatement le workflow dans le dashboard démo.

insert into public.village_updates
  (village_code_localite, village_name, village_wilaya, field_name,
   current_value, proposed_value, reason, submitted_by, submitted_by_organization,
   submitted_at, status)
values
  (14646, 'Legaida',        'Hodh Chargui',    'population_total',
   '2021',                        '2450',
   'Recensement communautaire local · migration saisonnière + naissances 2025',
   null, 'UNICEF Mauritanie',
   current_date - interval '2 days', 'pending'),

  (67686, 'Oum Eacheiche',  'Hodh Chargui',    'reseau_aep',
   'Non',                          'Oui',
   'Extension du réseau AEP finalisée en avril 2026 par le Ministère',
   null, 'Ministère de l''Hydraulique',
   current_date - interval '5 days', 'approved'),

  (99990, 'Bir Elbarka',    'Hodh Chargui',    'coordinates',
   '-6.412, 16.283',              '-6.418, 16.279',
   'Coordonnées GPS re-relevées lors du convoi du 12 mai · imprécision de ~700 m',
   null, 'Water4All',
   current_date - interval '1 days', 'pending'),

  (26628, 'Tenouagoutim',   'Hodh Chargui',    'distance_to_water_km',
   '49.03',                        '18.5',
   'Nouveau puits foré à 18 km du village en mars 2026 · distance recalculée',
   null, 'Croissant-Rouge Mauritanien',
   current_date - interval '7 days', 'implemented');

-- ─── Vérification ──────────────────────────────────────────────────
-- select village_name, field_name, current_value, proposed_value,
--        submitted_by_organization, status
-- from public.village_updates
-- order by submitted_at desc;
