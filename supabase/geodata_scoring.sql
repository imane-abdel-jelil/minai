-- ==================================================================
-- MINAI · Fonction de scoring automatisée
-- ==================================================================
--
-- Réplique la logique de scripts/compute-village-scores.mjs en SQL
-- natif. À la place de re-générer un fichier villages-scored.geojson
-- à chaque changement, on appelle cette fonction et elle met à jour
-- la table villages en une seule passe.
--
-- LOGIQUE (identique au script Node)
--   Pour chaque village :
--     1. Distance au point d'eau le plus proche via KNN spatial
--        (opérateur <-> sur l'index GIST) + ST_Distance en géodésique
--     2. Status :
--          reseau_aep = true    → 'ok'
--          distance   > 5 km    → 'critical'
--          distance   > 2 km    → 'risk'
--          sinon                → 'ok'
--     3. priority_score = distance × population × multiplicateur
--          (critical=1.5, risk=1, ok=0.3)
--     4. is_top_priority     = TOP 30 des critiques par priority_score
--     5. is_success_story    = TOP 24 des OK avec réseau AEP,
--                              max 2 par wilaya (diversité géographique)
--
-- USAGE
--   select refresh_village_scoring();                    -- OSM + ANSADE
--   select refresh_village_scoring(array['ANSADE']);     -- ANSADE seul
--
-- CHANTIER 2 : cette fonction sera appelée automatiquement par un
-- trigger pg_cron mensuel ou par un webhook quand un partenaire ajoute
-- un nouveau point d'eau. Pour l'instant : appel manuel.
-- ==================================================================

create or replace function public.refresh_village_scoring(
  water_sources text[] default array['ANSADE', 'OSM']
) returns table (
  updated_villages     int,
  top_priorities       int,
  success_stories      int,
  critical_count       int,
  risk_count           int,
  ok_count             int
) as $$
declare
  v_updated       int;
  v_top           int;
  v_success       int;
  v_critical      int;
  v_risk          int;
  v_ok            int;
begin
  -- ─── Étape 1 : distance + status + priority_score ─────────────────
  -- Un seul UPDATE qui joint chaque village avec son point d'eau le
  -- plus proche via LATERAL KNN. Index GIST → ~1-3 secondes pour 8447
  -- villages sur 7000+ points d'eau.
  with nearest as (
    select
      v.id                as village_id,
      n.geom              as water_geom,
      n.type              as water_type,
      ST_Distance(v.geom::geography, n.geom::geography) / 1000.0 as dist_km
    from public.villages v
    cross join lateral (
      select geom, type
      from public.water_points w
      where w.source = any (water_sources)
      order by v.geom <-> w.geom
      limit 1
    ) n
  )
  update public.villages v
  set
    distance_to_water_km = round(n.dist_km::numeric, 2),
    nearest_water_lng    = ST_X(n.water_geom),
    nearest_water_lat    = ST_Y(n.water_geom),
    nearest_water_type   = n.water_type,
    status = case
      when v.reseau_aep = true then 'ok'
      when n.dist_km > 5       then 'critical'
      when n.dist_km > 2       then 'risk'
      else                          'ok'
    end,
    priority_score = round(
      n.dist_km * greatest(v.population_total, 0) *
      case
        when v.reseau_aep = true then 0.3
        when n.dist_km > 5       then 1.5
        when n.dist_km > 2       then 1.0
        else                          0.3
      end
    )::bigint,
    updated_at = now()
  from nearest n
  where n.village_id = v.id;

  get diagnostics v_updated = row_count;

  -- ─── Étape 2 : reset des flags top_priority / success_story ──────
  update public.villages
  set is_top_priority = false,
      is_success_story = false;

  -- ─── Étape 3 : is_top_priority (30 villages critiques les plus urgents) ──
  with ranked as (
    select id
    from public.villages
    where status = 'critical'
    order by priority_score desc nulls last, population_total desc
    limit 30
  )
  update public.villages v
  set is_top_priority = true
  from ranked r
  where v.id = r.id;

  get diagnostics v_top = row_count;

  -- ─── Étape 4 : is_success_story (24 villages OK+réseau, max 2/wilaya) ──
  -- Sélection greedy : par wilaya on prend les 2 plus peuplés, puis
  -- on cap globalement à 24 (dans l'ordre des wilayas alphabétique).
  with candidates as (
    select
      id,
      row_number() over (
        partition by wilaya
        order by population_total desc, id
      ) as rn_wilaya
    from public.villages
    where status = 'ok'
      and reseau_aep = true
      and population_total > 0
      and wilaya is not null
  ),
  eligible as (
    select id
    from candidates
    where rn_wilaya <= 2
    order by rn_wilaya, id
    limit 24
  )
  update public.villages v
  set is_success_story = true
  from eligible e
  where v.id = e.id;

  get diagnostics v_success = row_count;

  -- ─── Étape 5 : compteurs pour le retour ──────────────────────────
  select
    count(*) filter (where status = 'critical'),
    count(*) filter (where status = 'risk'),
    count(*) filter (where status = 'ok')
  into v_critical, v_risk, v_ok
  from public.villages;

  return query select v_updated, v_top, v_success, v_critical, v_risk, v_ok;
end;
$$ language plpgsql;

-- ─── Autorisations ─────────────────────────────────────────────────
-- Fonction accessible uniquement aux service_role et postgres (admin).
-- Le frontend ne peut pas la déclencher directement — c'est voulu :
-- le refresh doit être une action délibérée (trigger, admin, cron).
revoke execute on function public.refresh_village_scoring(text[]) from public, anon, authenticated;

-- ─── Utilisation ───────────────────────────────────────────────────
--
-- Manuel dans SQL Editor :
--   select * from refresh_village_scoring();
--
-- Résultat attendu (approximatif, dépend de la data actuelle) :
--
--   updated_villages | top_priorities | success_stories | critical_count | risk_count | ok_count
--   -----------------+----------------+-----------------+----------------+------------+---------
--             8 447  |             30 |              24 |          3 190 |      1 551 |   3 706
--
-- Vérification post-refresh (top 5 villages en priorité absolue) :
--
--   select name_fr, wilaya, population_total,
--          distance_to_water_km, priority_score
--   from public.villages
--   where is_top_priority = true
--   order by priority_score desc
--   limit 5;
