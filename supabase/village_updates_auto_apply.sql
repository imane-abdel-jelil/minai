-- ==================================================================
-- MINAI · Chantier 2 · Brique 2 · Auto-application des corrections
-- ==================================================================
--
-- Trigger PL/pgSQL qui, quand un admin fait passer un village_updates
-- de status='pending' à 'approved', applique automatiquement la
-- proposed_value au bon champ de la table villages (avec cast typé
-- selon field_name) puis fait passer le status à 'implemented'.
--
-- FLUX APRÈS DÉPLOIEMENT
--   1. Partenaire signale une erreur → INSERT village_updates
--      (status='pending')
--   2. Admin clique 'Approuver' dans l'inbox → UPDATE status='approved'
--   3. Trigger fire → applique la modif à villages.<field_name>
--   4. Trigger passe status='implemented' + timestamp implemented_at
--   5. Dans l'UI : la correction apparaît en badge bleu 'Appliqué'
--      et la donnée du village est effectivement à jour
--
-- SI CAST FAIL (ex : proposed_value='abc' pour population_total) :
--   Le trigger capture l'exception, LAISSE le status à 'approved'
--   et écrit l'erreur dans review_notes. L'admin voit qu'il faut
--   une intervention manuelle.
--
-- À exécuter dans Supabase → SQL Editor → New query → Run.
-- ==================================================================

-- ─── 1. Colonnes supplémentaires ───────────────────────────────────
-- implemented_at : quand la correction a été appliquée à villages
alter table public.village_updates
  add column if not exists implemented_at timestamptz;

-- ─── 2. Fonction trigger ───────────────────────────────────────────
create or replace function public.apply_village_update()
returns trigger as $$
declare
  parsed_lng     float;
  parsed_lat     float;
  parsed_coords  text[];
  err_msg        text;
  rows_affected  int;
begin
  -- Ne rien faire si le statut n'est pas passé À 'approved'
  -- (on veut éviter de ré-appliquer si on repasse d'implemented vers
  -- approved, ou si status ne change pas).
  if new.status <> 'approved' or old.status = new.status then
    return new;
  end if;

  begin
    -- Applique la modif selon le champ signalé
    case new.field_name

      when 'name_fr' then
        update public.villages
        set name_fr = new.proposed_value
        where code_localite = new.village_code_localite;

      when 'name_ar' then
        update public.villages
        set name_ar = new.proposed_value
        where code_localite = new.village_code_localite;

      when 'population_total' then
        update public.villages
        set population_total = new.proposed_value::int
        where code_localite = new.village_code_localite;

      when 'distance_to_water_km' then
        update public.villages
        set distance_to_water_km = new.proposed_value::numeric
        where code_localite = new.village_code_localite;

      when 'reseau_aep' then
        update public.villages
        set reseau_aep = (
          lower(trim(new.proposed_value)) in ('oui', 'yes', 'true', '1', 'o', 'y')
        )
        where code_localite = new.village_code_localite;

      when 'coordinates' then
        -- Format attendu : "lng, lat" (ex : "-6.418, 16.279")
        parsed_coords := string_to_array(new.proposed_value, ',');
        if array_length(parsed_coords, 1) < 2 then
          raise exception 'Coordonnées mal formatées : attendu "lng, lat"';
        end if;
        parsed_lng := trim(parsed_coords[1])::float;
        parsed_lat := trim(parsed_coords[2])::float;
        -- Bornes basiques Mauritanie (long -17.5 à -4.5 · lat 14 à 27)
        if parsed_lng < -20 or parsed_lng > 0 then
          raise exception 'Longitude hors bornes Mauritanie : %', parsed_lng;
        end if;
        if parsed_lat < 10 or parsed_lat > 30 then
          raise exception 'Latitude hors bornes Mauritanie : %', parsed_lat;
        end if;
        update public.villages
        set geom = ST_SetSRID(ST_MakePoint(parsed_lng, parsed_lat), 4326)
        where code_localite = new.village_code_localite;

      when 'moughataa' then
        update public.villages
        set moughataa = new.proposed_value
        where code_localite = new.village_code_localite;

      when 'commune' then
        update public.villages
        set commune = new.proposed_value
        where code_localite = new.village_code_localite;

      when 'other' then
        -- Champ libre non typé : ne pas auto-appliquer, requiert
        -- intervention manuelle de l'admin
        return new;

      else
        raise exception 'field_name non géré par l''auto-apply : %', new.field_name;
    end case;

    -- Vérifier qu'on a bien touché une ligne
    get diagnostics rows_affected = row_count;
    if rows_affected = 0 then
      raise exception 'Village code_localite=% introuvable dans la table villages', new.village_code_localite;
    end if;

    -- Succès : passer à 'implemented' avec timestamp
    new.status         := 'implemented';
    new.implemented_at := now();

  exception when others then
    -- Cast raté ou village introuvable : garder status='approved'
    -- et annoter review_notes pour l'admin
    err_msg := sqlerrm;
    new.review_notes := coalesce(new.review_notes || E'\n', '') ||
      '[AUTO-APPLY ÉCHOUÉ ' || to_char(now(), 'YYYY-MM-DD HH24:MI') || '] ' || err_msg;
  end;

  return new;
end;
$$ language plpgsql;

-- ─── 3. Attacher le trigger ────────────────────────────────────────
drop trigger if exists village_updates_auto_apply on public.village_updates;
create trigger village_updates_auto_apply
  before update on public.village_updates
  for each row execute procedure public.apply_village_update();

-- ─── 4. Test manuel recommandé ─────────────────────────────────────
-- Ces requêtes valident que le trigger fonctionne. À exécuter APRÈS
-- avoir déployé le trigger.
--
-- 4.1 · Voir la valeur actuelle d'un village signalé :
--   select code_localite, name_fr, population_total, reseau_aep,
--          moughataa
--   from villages
--   where code_localite = 14646;  -- Legaida
--
-- 4.2 · Approuver le signalement 'Legaida population' (pending → approved) :
--   update village_updates
--   set status = 'approved',
--       reviewed_at = now()
--   where village_code_localite = 14646
--     and field_name = 'population_total'
--     and status = 'pending';
--
-- 4.3 · Vérifier que le trigger a bien appliqué + fait passer à implemented :
--   select village_name, field_name, proposed_value, status,
--          implemented_at, review_notes
--   from village_updates
--   where village_code_localite = 14646;
--
-- 4.4 · Vérifier que villages.population_total a bien été mise à jour :
--   select code_localite, name_fr, population_total, updated_at
--   from villages
--   where code_localite = 14646;
--   → doit afficher 2450 (nouvelle valeur) au lieu de 2021 (ancienne)
