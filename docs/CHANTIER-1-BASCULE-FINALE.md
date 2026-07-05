# Chantier 1 · Bascule finale

Ce guide te permet de faire basculer MINAI de "lit des fichiers geojson
statiques" à "interroge Supabase PostGIS en temps réel", **calmement,
sans stress, une fois ton pitch fait**.

Toutes les étapes préparatoires sont déjà en place : schéma PostGIS,
data importée, vues geojson, fonction de scoring, loaders frontend
avec fallback automatique, feature flag. Il ne reste que la bascule
opérationnelle.

---

## Étape A · Test local avec le flag activé

Objectif : valider que Supabase répond correctement et que la carte
+ dashboard fonctionnent exactement comme avec les fichiers statiques.

1. Édite `.env` à la racine du projet et ajoute la ligne :
   ```
   VITE_USE_SUPABASE_GEODATA=true
   ```

2. Lance le dev server :
   ```bash
   npm run dev
   ```

3. Ouvre `http://localhost:5173` et **ouvre la console** (Cmd+Opt+I).
   Tu dois voir dans la console :
   ```
   [villages] 8447 villages chargés depuis Supabase
   ```
   Sans erreur en rouge. Si tu vois `fallback fichier statique`, c'est
   qu'un loader Supabase a échoué — regarde le message d'erreur.

4. Tests fonctionnels à passer un par un :
   - [ ] La carte apparaît avec les polygones de wilayas colorés
   - [ ] Les 30 pins rouges TOP-30 sont visibles
   - [ ] Les 24 pins verts success stories sont visibles
   - [ ] Les clusters bleus des points d'eau apparaissent
   - [ ] Cliquer sur une wilaya déclenche le drill-down (dots colorés)
   - [ ] Cliquer sur un village ouvre le panneau détails
   - [ ] Le dashboard Water4All affiche les métriques
   - [ ] La section "Prochains ravitaillements" liste les 5 planifiés
   - [ ] Le bouton "+ Nouveau ravitaillement" ouvre le modal et
         l'autocomplete village fonctionne (sur les données Supabase)

Si tout passe : Supabase est validé, on peut basculer en prod.

Si un test échoue : remet `VITE_USE_SUPABASE_GEODATA=false` dans le
`.env` pour retomber immédiatement sur les fichiers statiques, et
raconte-moi ce qui ne va pas — on debug.

---

## Étape B · Activation en production sur Netlify

1. Va sur ton dashboard Netlify → ton site MINAI → **Site settings**
   → **Environment variables**.

2. Clique **Add a variable** :
   - Key : `VITE_USE_SUPABASE_GEODATA`
   - Value : `true`
   - Save.

3. Va dans **Deploys** → clique **Trigger deploy** → **Clear cache and
   deploy site** (essentiel — Vite embarque les variables au build,
   il faut un rebuild).

4. Attends que le deploy passe en vert "Published" (2-3 min).

5. Ouvre ton site Netlify en **navigation privée**. Ouvre la console.
   Tu dois voir :
   ```
   [villages] 8447 villages chargés depuis Supabase
   ```
   Refais les 8 tests fonctionnels ci-dessus.

Si tout passe : la production est basculée. Ton bundle Netlify continue
à embarquer les fichiers geojson (~15 Mo) mais ne les lit plus.

---

## Étape C · Cleanup des fichiers geojson statiques

À faire seulement après quelques jours d'observation de production
avec Supabase actif, quand tu es sûre que rien ne casse.

1. Supprime les fichiers suivants :
   ```bash
   cd ~/Desktop/MINAI
   rm public/data/villages-scored.geojson
   rm public/data/villages-priorities.geojson
   rm public/data/water-points.geojson
   rm public/data/wilayas.geojson
   rm public/data/villages.geojson
   rm public/data/points_eau.geojson
   ```

2. Retire les paths de fallback dans le code (optionnel — les
   fonctions `fetch('/data/*.geojson')` retourneront 404 sinon, ce
   qui est OK car Supabase est la source primaire). Si tu veux
   nettoyer :
   - `src/components/MapView.tsx` : les blocs `try { fetch('/data/...')`
   - `src/lib/ansade-villages.ts` : la partie "Path 2 : fichier
     statique (fallback)"

3. Rebuild + redeploy Netlify. Ton bundle passe de ~15 Mo à ~500 Ko.
   Chargement quasi-instantané pour tes utilisateurs.

---

## Rollback d'urgence

Si à n'importe quel moment quelque chose casse en prod :

1. Netlify → Site settings → Environment variables
2. Change `VITE_USE_SUPABASE_GEODATA` à `false` (ou supprime la variable)
3. Trigger deploy → Clear cache and deploy site
4. En 2-3 min, ton site retombe sur les fichiers statiques comme avant.

C'est pour ça qu'il ne faut PAS supprimer les fichiers geojson avant
d'être sûre. Ils sont ta corde de sécurité.

---

## Vérification que le Chantier 1 est vraiment terminé

Coche cette liste :

- [x] Extension PostGIS activée dans Supabase
- [x] Tables villages, water_points, wilayas créées
- [x] Data importée (8447 + ~7000 + 15 lignes)
- [x] Vues villages_geojson, water_points_geojson, wilayas_geojson créées
- [x] Fonction refresh_village_scoring() créée et testée
- [x] Loaders frontend Supabase-aware (avec fallback)
- [x] Feature flag VITE_USE_SUPABASE_GEODATA en place
- [ ] Flag activé en local, tests passés
- [ ] Flag activé en prod Netlify, tests passés
- [ ] Fichiers geojson supprimés du bundle
- [ ] Bundle Netlify < 1 Mo

Quand toutes les cases sont cochées, MINAI est officiellement une
plateforme dynamique. Ready pour le Chantier 2.
