/**
 * Diagnostic WPDx : quelles données sont disponibles pour la Mauritanie ?
 * - liste les noms de pays présents (avec compte)
 * - tente plusieurs variantes pour la Mauritanie
 */
const ENDPOINT = 'https://data.waterpointdata.org/resource/eqje-vguj.json'

async function go(path, label) {
  const url = `${ENDPOINT}?${path}`
  process.stdout.write(`\n→ ${label}\n  ${url}\n`)
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'MINAI-probe/1.0' } })
    if (!r.ok) {
      console.log(`  ❌ HTTP ${r.status}`)
      const text = await r.text()
      console.log(`     ${text.slice(0, 200)}`)
      return null
    }
    return await r.json()
  } catch (e) {
    console.log(`  ❌ ${e.message}`)
    return null
  }
}

// 1. Ping API : récupère 1 enregistrement quelconque pour voir le schéma
const sample = await go('$limit=1', 'Test ping (1 enregistrement quelconque)')
if (sample && sample.length > 0) {
  console.log('  ✅ API OK. Champs disponibles :')
  console.log('  ' + Object.keys(sample[0]).sort().join(', '))
  console.log('\n  Exemple de pays :', sample[0].country_name || sample[0].clean_country_name || '(aucun champ pays trouvé)')
}

// 2. Compte par pays (alias corrigé) — pour voir si la Mauritanie est dans le dataset
const byCountry = await go(
  '$select=country_name,count(*) AS n&$group=country_name&$order=n DESC&$limit=300',
  'Top pays (par nombre de points)'
)
if (byCountry) {
  console.log(`  ✅ ${byCountry.length} pays trouvés. Top 10 :`)
  byCountry.slice(0, 10).forEach((r, i) =>
    console.log(`     ${i + 1}. ${r.country_name || '(vide)'} — ${r.n}`)
  )
  // cherche Mauritanie sous toutes ses formes
  const mauritania = byCountry.filter((r) =>
    /maurit/i.test(r.country_name || '')
  )
  console.log('\n  🔍 Variantes "maurit*" dans country_name :')
  if (mauritania.length === 0) {
    console.log('     (aucune)')
  } else {
    mauritania.forEach((r) =>
      console.log(`     • "${r.country_name}" — ${r.n} points`)
    )
  }
  // liste tous les pays africains de l’ouest pour contexte
  const wAfrica = ['Mali', 'Senegal', 'Niger', 'Algeria', 'Morocco', 'Burkina Faso']
  console.log('\n  📍 Voisins ouest-africains présents dans WPDx :')
  wAfrica.forEach((c) => {
    const f = byCountry.find((r) => r.country_name === c)
    console.log(`     ${c.padEnd(15)} ${f ? `→ ${f.n} points` : '→ absent'}`)
  })
}

// 2bis. Idem mais sur clean_country_name (champ normalisé WPDx)
const byClean = await go(
  '$select=clean_country_name,count(*) AS n&$group=clean_country_name&$order=n DESC&$limit=300',
  'Top pays sur clean_country_name (champ normalisé)'
)
if (byClean) {
  const mau = byClean.filter((r) => /maurit/i.test(r.clean_country_name || ''))
  console.log(`  Variantes "maurit*" dans clean_country_name :`)
  if (mau.length === 0) console.log('     (aucune)')
  else mau.forEach((r) => console.log(`     • "${r.clean_country_name}" — ${r.n} points`))
}

// 2ter. Recherche LIKE permissive
const likeSearch = await go(
  "$where=upper(country_name) like '%MAURIT%' OR upper(clean_country_name) like '%MAURIT%'&$select=country_name,clean_country_name,count(*) AS n&$group=country_name,clean_country_name",
  'Recherche LIKE permissive sur les deux champs pays'
)
if (likeSearch) {
  console.log(`  → ${likeSearch.length} groupe(s) trouvé(s)`)
  likeSearch.forEach((r) => console.log(`     ${JSON.stringify(r)}`))
}

// 3. Tentatives directes avec variantes connues
console.log('\n→ Tentatives directes (1er résultat retourné, s’il y en a) :')
for (const q of [
  'country_name=Mauritania',
  'country_name=MAURITANIA',
  "country_name=République Islamique de Mauritanie",
  'country_id=MRT',
  'country_id=MR',
]) {
  const url = `${ENDPOINT}?${q}&$limit=1`
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'MINAI-probe/1.0' } })
    const data = await r.json()
    console.log(`  ${q.padEnd(60)} → ${Array.isArray(data) ? data.length : '?'} résultat(s)`)
  } catch (e) {
    console.log(`  ${q.padEnd(60)} → erreur ${e.message}`)
  }
}
