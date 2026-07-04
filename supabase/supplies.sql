-- ==================================================================
-- MINAI · Table `supplies` (ravitaillements d'eau enregistrés par ONG)
-- ==================================================================
--
-- À exécuter dans Supabase → SQL Editor → New query, puis Run.
--
-- Contient :
--   1. Création de la table
--   2. RLS (Row Level Security) : chaque utilisateur voit tous les
--      ravitaillements mais ne peut modifier que les siens
--   3. Seed initial : 5 ravitaillements fictifs Water4All utilisant
--      les vrais villages ANSADE, pour que le dashboard démo soit
--      immédiatement rempli au premier login
--
-- ==================================================================

-- Nettoyage éventuel (idempotent — safe si la table n'existe pas)
drop table if exists public.supplies cascade;

-- ─── Création de la table ─────────────────────────────────────────
create table public.supplies (
  id                       uuid primary key default gen_random_uuid(),
  organization             text not null,
  village_code_localite    int,
  village_name             text not null,
  village_wilaya           text not null,
  quantity_m3              numeric(10,2) not null default 0,
  supply_date              date not null,
  status                   text not null check (status in ('delivered','in_progress','delayed')),
  notes                    text,
  created_by               uuid references auth.users(id),
  created_at               timestamptz not null default now()
);

create index supplies_org_idx on public.supplies (organization);
create index supplies_date_idx on public.supplies (supply_date desc);
create index supplies_created_by_idx on public.supplies (created_by);

-- ─── Row Level Security ───────────────────────────────────────────
alter table public.supplies enable row level security;

-- Lecture : tout utilisateur authentifié peut voir tous les
-- ravitaillements de son organisation (identifiée par le champ
-- text 'organization'). Pour un MVP démo on autorise à lire tout.
create policy "supplies_select_all_authenticated"
  on public.supplies for select
  to authenticated
  using (true);

-- Insertion : uniquement pour utilisateurs connectés, et le champ
-- created_by doit correspondre à l'utilisateur courant.
create policy "supplies_insert_own"
  on public.supplies for insert
  to authenticated
  with check (created_by = auth.uid());

-- Modification / suppression : seul le créateur peut modifier/supprimer.
create policy "supplies_update_own"
  on public.supplies for update
  to authenticated
  using (created_by = auth.uid());

create policy "supplies_delete_own"
  on public.supplies for delete
  to authenticated
  using (created_by = auth.uid());

-- ─── Seed démo — 5 ravitaillements Water4All ──────────────────────
-- created_by = NULL pour que ces items soient visibles par tout le
-- monde en démo, mais non modifiables (à récupérer plus tard via
-- un update quand un compte Water4All existe).

insert into public.supplies
  (organization, village_code_localite, village_name, village_wilaya,
   quantity_m3, supply_date, status, notes, created_by)
values
  ('Water4All', 33609, 'Mbera 2',            'Hodh Chargui',   45.0, current_date - interval '3 days',  'delivered',   'Camion-citerne · convoi mensuel', null),
  ('Water4All', 51555, 'Camp Mberra',        'Hodh Chargui',   80.0, current_date - interval '7 days',  'delivered',   'Approvisionnement camp de réfugiés', null),
  ('Water4All', 67686, 'Oum Eacheiche',      'Hodh Chargui',   28.0, current_date - interval '12 days', 'delivered',   'Distribution jerricans 20L', null),
  ('Water4All', 14646, 'Legaida',            'Hodh Chargui',   35.0, current_date - interval '18 days', 'in_progress', 'Convoi en route depuis Néma', null),
  ('Water4All', 26628, 'Tenouagoutim',       'Hodh Chargui',   22.0, current_date - interval '24 days', 'delayed',     'Route ensablée, report prévu', null);

-- ─── Vérification ──────────────────────────────────────────────────
-- Après exécution, vérifier avec :
--   select * from public.supplies order by supply_date desc;
