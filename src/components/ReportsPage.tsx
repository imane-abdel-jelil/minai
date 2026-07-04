/**
 * ReportsPage — page 'Rapports & export' du dashboard MINAI.
 *
 * Contient un rapport type fictif détaillé d'un ravitaillement conjoint
 * pour illustrer ce qu'un rapport MINAI peut contenir :
 *   - Résumé exécutif
 *   - Contexte et zone d'intervention
 *   - Méthodologie et logistique
 *   - Résultats chiffrés + population impactée
 *   - Coordination inter-organisations
 *   - Témoignage de terrain
 *   - Recommandations pour prochaines interventions
 *   - Bloc téléchargement (fictif)
 *
 * Sert de démonstration pédagogique aux investisseurs et partenaires
 * institutionnels lors d'un pitch : voici à quoi ressemble un rapport
 * MINAI généré à partir d'un ravitaillement enregistré sur la plateforme.
 */

export default function ReportsPage() {
  return (
    <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-6 space-y-6">
      {/* ── Header ── */}
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-slate-900 text-[26px] font-bold tracking-tight leading-none">
            Rapports & export
          </h1>
          <p className="text-slate-500 text-[14px] mt-1.5">
            Documents produits automatiquement à partir des ravitaillements enregistrés
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-[13px] px-4 py-2.5 rounded-xl transition flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Télécharger PDF
          </button>
          <button className="bg-sky-500 hover:bg-sky-600 text-white font-semibold text-[13px] px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md shadow-sky-500/20">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nouveau rapport
          </button>
        </div>
      </header>

      {/* ── Autres rapports disponibles (aperçu latéral) ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ReportPreviewCard
          title="Ravitaillement conjoint Camp Mberra"
          org="UNICEF · Water4All"
          date="mai 2026"
          active
        />
        <ReportPreviewCard
          title="Réhabilitation puits de Néma"
          org="UNICEF Mauritanie"
          date="avril 2026"
        />
        <ReportPreviewCard
          title="Extension AEP Guerou"
          org="Ministère de l'Hydraulique"
          date="avril 2026"
        />
      </section>

      {/* ══════════════ RAPPORT PRINCIPAL ══════════════ */}
      <article className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {/* Cover */}
        <div className="bg-gradient-to-br from-sky-500 to-sky-700 text-white px-8 py-10">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-sky-100">
            Rapport d'intervention · MINAI/RPT-2026-042
          </div>
          <h1 className="text-[30px] sm:text-[36px] font-bold mt-3 leading-[1.1] tracking-tight">
            Ravitaillement conjoint d'urgence
            <br />
            Camp Mberra · Février-Mai 2026
          </h1>
          <p className="text-sky-100 text-[15px] mt-4 max-w-2xl leading-relaxed">
            Opération de distribution d'eau potable au camp de réfugiés maliens
            de Mbera, wilaya de Hodh Ech Chargui, dans le cadre du programme
            WASH inter-organisations coordonné via la plateforme MINAI.
          </p>
          <div className="mt-6 flex flex-wrap gap-6 text-[12px] pt-6 border-t border-white/20">
            <StatLine label="Volume total livré" value="1 380 m³" />
            <StatLine label="Personnes impactées" value="48 200" />
            <StatLine label="Convois" value="17" />
            <StatLine label="Organisations coordonnées" value="4" />
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-8 space-y-8 text-slate-800">
          <Section title="Résumé exécutif" number="01">
            <p>
              Entre le 3 février et le 12 mai 2026, quatre organisations partenaires —
              <Strong> UNICEF Mauritanie</Strong>, <Strong>Water4All</Strong>,
              <Strong> Croissant-Rouge Mauritanien</Strong> et <Strong>Action Contre la Faim</Strong>
              — ont mené une opération conjointe de ravitaillement en eau potable
              au camp de Mbera, coordonnée en temps réel via la plateforme MINAI.
              L'intervention a permis la distribution de <Strong>1 380 m³ d'eau potable</Strong>
              à environ <Strong>48 200 personnes</Strong>, dont 62 % de femmes et d'enfants,
              en trois phases logistiques successives sur 14 semaines.
            </p>
            <p>
              La coordination via MINAI a évité 4 opérations redondantes anticipées
              (soit ~180 m³ économisés) grâce à la visibilité inter-organisations
              des convois planifiés, et a permis de rediriger l'excédent vers
              trois villages critiques satellites du camp (Bathett Esbatt,
              Tenouagoutim, Hassi Loughar).
            </p>
          </Section>

          <Section title="Contexte et zone d'intervention" number="02">
            <p>
              Le camp de Mbera, situé à ~50 km de la frontière malienne dans la
              wilaya de Hodh Ech Chargui, accueille depuis 2012 des populations
              déplacées par le conflit au Mali. Selon les données ANSADE RGPH-5
              croisées avec les rapports HCR, la population du camp est estimée
              à <Strong>41 256 résidents permanents</Strong> avec des fluctuations
              saisonnières pouvant atteindre 15 % en période sèche.
            </p>
            <p>
              La distance au point d'eau amélioré le plus proche est de
              <Strong> 10,4 km</Strong>, largement au-dessus du seuil critique
              humanitaire de 5 km (Sphere Standards). L'accès à l'eau dépend
              d'un système de citernes-relais dont le remplissage nécessite
              une logistique lourde depuis Néma.
            </p>
            <ContextBox>
              <ContextItem label="Wilaya" value="Hodh Ech Chargui" />
              <ContextItem label="Moughataa" value="Amourj" />
              <ContextItem label="Coordonnées" value="~ 15,74° N, -5,71° O" />
              <ContextItem label="Statut MINAI" value="Zone critique · Priorité 1" />
              <ContextItem label="Distance au réseau AEP" value="127 km (Néma)" />
              <ContextItem label="Distance point d'eau naturel" value="10,4 km" />
            </ContextBox>
          </Section>

          <Section title="Méthodologie et logistique" number="03">
            <p>
              L'opération a été divisée en trois phases correspondant aux pics
              de besoin identifiés par la modélisation MINAI (croisement des
              données démographiques ANSADE et de la saisonnalité hydrique).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <PhaseCard n={1} title="Réponse d'urgence" period="3-24 fév." volume="420 m³" lead="UNICEF Mauritanie" />
              <PhaseCard n={2} title="Consolidation" period="1er-31 mars" volume="580 m³" lead="Water4All" />
              <PhaseCard n={3} title="Suivi & rattrapage" period="15 avr.-12 mai" volume="380 m³" lead="Action Contre la Faim" />
            </div>

            <p className="mt-4">
              Le mode de distribution combine des citernes-relais de 25 m³
              (approvisionnées 2×/semaine par camions-citernes venant de Néma)
              et une distribution communautaire de jerricans étiquetés MINAI
              via 12 points de collecte gérés par 24 volontaires du
              Croissant-Rouge formés au protocole.
            </p>
          </Section>

          <Section title="Résultats" number="04">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ResultTile value="1 380 m³" label="Eau distribuée" note="Objectif : 1 200 m³ · +15%" positive />
              <ResultTile value="48 200" label="Personnes impactées" note="dont 29 900 femmes et enfants" positive />
              <ResultTile value="7,2 L" label="Par personne / jour" note="Standard humanitaire : 7,5 L" />
              <ResultTile value="0" label="Rupture d'approvisionnement" note="17 convois · 100% de continuité" positive />
            </div>
            <p className="mt-4">
              La consommation moyenne par personne s'est stabilisée à <Strong>7,2 L/jour</Strong>,
              à 4 % en-dessous du standard humanitaire de 7,5 L/jour recommandé par
              les Sphere Standards en contexte de camp. Aucune interruption
              n'a été enregistrée sur les 14 semaines, contre 3 ruptures en
              moyenne sur les opérations comparables des années précédentes.
            </p>
          </Section>

          <Section title="Coordination inter-organisations via MINAI" number="05">
            <p>
              L'apport spécifique de la plateforme MINAI a été mesuré sur trois
              indicateurs de coordination :
            </p>
            <ul className="space-y-2.5 mt-3 text-[14px] text-slate-700">
              <ListItem>
                <Strong>4 doublons évités</Strong> — la visibilité en temps réel des
                convois planifiés a permis à Action Contre la Faim d'annuler trois
                interventions redondantes (économie ~180 m³) et à UNICEF de
                repositionner un convoi vers le village de Bathett Esbatt.
              </ListItem>
              <ListItem>
                <Strong>Délai de réponse divisé par 2,3</Strong> — le tableau de
                bord partagé a permis d'identifier en 6 heures deux villages
                satellites en rupture, alors que le protocole antérieur (échanges
                emails inter-orgs) prenait en moyenne 14 heures.
              </ListItem>
              <ListItem>
                <Strong>Rapports d'impact automatiques</Strong> — chaque
                ravitaillement enregistré alimente les métriques agrégées
                consultées par le Ministère de l'Hydraulique et de l'Assainissement,
                supprimant la charge administrative de reporting mensuel par organisation.
              </ListItem>
            </ul>
          </Section>

          <Section title="Témoignage de terrain" number="06">
            <blockquote className="bg-sky-50 border-l-4 border-sky-500 pl-5 py-4 pr-5 rounded-r-xl">
              <p className="text-slate-800 text-[15px] leading-relaxed italic">
                « Avant MINAI, on découvrait souvent qu'un autre partenaire venait
                de passer dans le même village 48 heures plus tôt — c'était de
                l'énergie et du carburant perdus. Aujourd'hui, on ouvre le tableau
                de bord le matin et on sait exactement où on est utile. Cette
                opération à Mbera, on l'a coordonnée avec UNICEF sans un seul
                email — tout était sur la plateforme. »
              </p>
              <footer className="mt-3 text-[12px] text-slate-600">
                — <Strong>Amina Moktar</Strong>, Coordinatrice logistique · Water4All
              </footer>
            </blockquote>
          </Section>

          <Section title="Recommandations" number="07">
            <ol className="space-y-3 mt-2 text-[14px] text-slate-700 list-decimal list-inside">
              <li>
                <Strong>Prolonger l'opération sur 3 villages satellites</Strong> —
                Bathett Esbatt (289 hab. · 186 km du point d'eau), Hassi Loughar
                (118 hab. · 440 km) et Boir Mariem (157 hab. · 461 km) présentent
                des indicateurs comparables à Mbera avant intervention.
              </li>
              <li>
                <Strong>Formaliser un protocole d'urgence conjoint UNICEF-Water4All</Strong>
                pour les futures crises de type Mbera, sur la base du modèle
                testé lors de cette opération.
              </li>
              <li>
                <Strong>Étendre le maillage citernes-relais</Strong> à 4 points
                supplémentaires dans le corridor Néma-Mbera, permettant de
                réduire la fréquence des convois de 2×/semaine à 1×/semaine
                sans dégradation du service.
              </li>
              <li>
                <Strong>Intégrer les données de suivi post-intervention</Strong>
                (qualité de l'eau, fréquentation des points de collecte) dans
                le module d'analyse MINAI pour affiner les modèles de priorisation.
              </li>
            </ol>
          </Section>

          {/* Signatures */}
          <div className="pt-6 mt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 text-[12px]">
            <div>
              <div className="text-slate-400 uppercase tracking-wider text-[10px]">Rapport établi par</div>
              <div className="text-slate-900 font-semibold mt-1">Amina Moktar</div>
              <div className="text-slate-600">Coordinatrice logistique · Water4All</div>
              <div className="text-slate-400 mt-1">12 mai 2026</div>
            </div>
            <div>
              <div className="text-slate-400 uppercase tracking-wider text-[10px]">Validé par</div>
              <div className="text-slate-900 font-semibold mt-1">Représentation UNICEF Mauritanie</div>
              <div className="text-slate-600">Bureau de coordination WASH</div>
              <div className="text-slate-400 mt-1">14 mai 2026</div>
            </div>
          </div>
        </div>
      </article>

      {/* Note bas de page */}
      <p className="text-slate-400 text-[11px] text-center pt-4 pb-8">
        Ce rapport a été généré automatiquement à partir des données saisies sur MINAI par les organisations partenaires.
        <br />
        MINAI · Plateforme d'intelligence géospatiale · Données ANSADE RGPH-5 · UNICEF · Banque Mondiale
      </p>
    </div>
  )
}

// ─── Sous-composants ─────────────────────────────────────────────────

function ReportPreviewCard({ title, org, date, active }: { title: string; org: string; date: string; active?: boolean }) {
  return (
    <button
      className={`text-left p-4 rounded-2xl border transition ${
        active
          ? 'bg-sky-50 border-sky-300 shadow-sm'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-slate-900 font-semibold text-[13px] leading-snug truncate">{title}</div>
          <div className="text-slate-500 text-[11px] mt-1">{org}</div>
        </div>
        {active && (
          <span className="text-[10px] uppercase tracking-wider font-bold text-sky-700 bg-white border border-sky-200 px-1.5 py-0.5 rounded shrink-0">
            En lecture
          </span>
        )}
      </div>
      <div className="text-slate-400 text-[11px] mt-3">{date}</div>
    </button>
  )
}

function Section({ title, number, children }: { title: string; number: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 text-[13px] font-bold flex items-center justify-center border border-sky-200">
          {number}
        </div>
        <h2 className="text-slate-900 text-[19px] font-bold tracking-tight">{title}</h2>
      </div>
      <div className="space-y-3 text-slate-700 text-[14px] leading-relaxed">{children}</div>
    </section>
  )
}

function Strong({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold text-slate-900">{children}</span>
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-white/70 text-[10px] uppercase tracking-wider">{label}</div>
      <div className="text-white font-bold text-[18px] mt-1 leading-none tabular-nums">{value}</div>
    </div>
  )
}

function ContextBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
      {children}
    </div>
  )
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-slate-500 text-[11px] uppercase tracking-wider">{label}</div>
      <div className="text-slate-900 font-semibold text-[13px] mt-0.5">{value}</div>
    </div>
  )
}

function PhaseCard({ n, title, period, volume, lead }: { n: number; title: string; period: string; volume: string; lead: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-[11px] font-bold flex items-center justify-center border border-sky-200">
          {n}
        </div>
        <div className="text-slate-900 font-semibold text-[13px]">{title}</div>
      </div>
      <div className="mt-3 space-y-1.5 text-[12px]">
        <div className="flex justify-between">
          <span className="text-slate-500">Période</span>
          <span className="text-slate-900 font-medium">{period}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Volume</span>
          <span className="text-slate-900 font-semibold tabular-nums">{volume}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Chef de file</span>
          <span className="text-slate-900 font-medium truncate max-w-[120px]">{lead}</span>
        </div>
      </div>
    </div>
  )
}

function ResultTile({ value, label, note, positive }: { value: string; label: string; note: string; positive?: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="text-slate-900 font-bold text-[22px] leading-none tabular-nums">{value}</div>
      <div className="text-slate-600 text-[12px] mt-1.5">{label}</div>
      <div className={`text-[11px] mt-2 ${positive ? 'text-sky-600' : 'text-slate-500'}`}>
        {note}
      </div>
    </div>
  )
}

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
      <span>{children}</span>
    </li>
  )
}
