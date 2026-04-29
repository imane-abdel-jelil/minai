import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  /** Retour à la landing */
  onBack: () => void
  /** Entrer dans la cartographie (CTA final) */
  onEnterMap: () => void
}

/**
 * Page éditoriale : "Comprendre l'accès à l'eau"
 *
 * Storytelling 4 couches : vérité universelle → rupture → développement
 * → solution. Distincte de la landing produit. Ton institutionnel,
 * éditorial, lecture longue.
 *
 * Photos : Pexels — free for commercial use.
 *   ‣ 6130668   Macro Photography of Water Drop (symbolique)
 *   ‣ 2101147   Clear Drinking Glass Filled With Water (symbolique)
 *   ‣ 30441483  Şeyhmus Kino — woman with jerrycan (réel)
 *   ‣ 30441497  Şeyhmus Kino — woman with water jugs (rural)
 *   ‣ 11759837  Swastik Arora — boy at hand pump (impact)
 *   ‣ 7165327   Jep Gambardella — child drinking (universel)
 *   ‣ 35328689  Sahara aerial (territoire)
 */

const IMG = {
  water_drop:     'https://images.pexels.com/photos/6130668/pexels-photo-6130668.jpeg?auto=compress&cs=tinysrgb&w=2000',
  glass_water:    'https://images.pexels.com/photos/2101147/pexels-photo-2101147.jpeg?auto=compress&cs=tinysrgb&w=1600',
  woman_jerrycan: 'https://images.pexels.com/photos/30441483/pexels-photo-30441483.jpeg?auto=compress&cs=tinysrgb&w=2000',
  woman_jugs:     'https://images.pexels.com/photos/30441497/pexels-photo-30441497.jpeg?auto=compress&cs=tinysrgb&w=2000',
  boy_pump:       'https://images.pexels.com/photos/11759837/pexels-photo-11759837.jpeg?auto=compress&cs=tinysrgb&w=2000',
  child_drinking: 'https://images.pexels.com/photos/7165327/pexels-photo-7165327.jpeg?auto=compress&cs=tinysrgb&w=2000',
  sahara_aerial:  'https://images.pexels.com/photos/35328689/pexels-photo-35328689.jpeg?auto=compress&cs=tinysrgb&w=2000',
}

export default function UnderstandingPage({ onBack, onEnterMap }: Props) {
  return (
    <div className="bg-white text-[#1d1d1f] overflow-x-hidden font-sans antialiased">
      <Nav onBack={onBack} onEnterMap={onEnterMap} />
      <Hero />
      <Section1Opening />
      <Section2Impact />
      <Section3Rural />
      <Section4Development />
      <Section5SeeingToAct />
      <Section6Conclusion onEnterMap={onEnterMap} />
      <Signature />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Reveal helper
// ─────────────────────────────────────────────────────────────────────────────

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            obs.disconnect()
          }
        }
      },
      { threshold: 0.12 }
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const { ref, visible } = useReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 ease-out will-change-transform ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NAV
// ─────────────────────────────────────────────────────────────────────────────

function Nav({ onBack, onEnterMap }: { onBack: () => void; onEnterMap: () => void }) {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-white/80 border-b border-black/5">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <button
          onClick={onBack}
          className="font-semibold tracking-tight text-[15px] text-[#1d1d1f] flex items-center gap-1.5 hover:opacity-70 transition"
        >
          <span className="text-[#86868b]">←</span> MINAI<span className="text-cyan-600">.</span>
        </button>
        <div className="hidden md:flex items-center gap-8 text-[13px] text-[#6e6e73]">
          <a href="#opening"     className="hover:text-[#1d1d1f] transition">L’eau</a>
          <a href="#impact"      className="hover:text-[#1d1d1f] transition">Impact</a>
          <a href="#rural"       className="hover:text-[#1d1d1f] transition">Réalité rurale</a>
          <a href="#development" className="hover:text-[#1d1d1f] transition">Développement</a>
          <a href="#challenge"   className="hover:text-[#1d1d1f] transition">Le défi</a>
        </div>
        <button
          onClick={onEnterMap}
          className="text-[13px] bg-[#1d1d1f] text-white px-4 py-1.5 rounded-full font-medium hover:bg-black transition"
        >
          Voir la cartographie →
        </button>
      </div>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="pt-32 md:pt-40 pb-12 md:pb-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <Reveal>
          <p className="text-[11px] tracking-[0.35em] uppercase text-cyan-700 mb-7">
            Comprendre · Page éditoriale
          </p>
        </Reveal>
        <Reveal delay={150}>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[1.05]">
            Comprendre l’accès
            <br />
            <span className="bg-gradient-to-b from-[#1d1d1f] to-[#6e6e73] bg-clip-text text-transparent">
              à l’eau.
            </span>
          </h1>
        </Reveal>
        <Reveal delay={300}>
          <p className="mt-9 text-base md:text-xl text-[#6e6e73] max-w-2xl mx-auto leading-relaxed">
            Un enjeu universel, une réalité contrastée, un défi de visibilité.
            Une lecture pour comprendre pourquoi l’accès à l’eau potable
            conditionne le développement.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — OUVERTURE (vérité universelle)
// ─────────────────────────────────────────────────────────────────────────────

function Section1Opening() {
  return (
    <section id="opening" className="bg-white">
      {/* Image symbolique pleine largeur — goutte d'eau macro */}
      <div className="px-4 sm:px-6 mb-16 md:mb-24">
        <Reveal>
          <div className="relative max-w-7xl mx-auto rounded-3xl overflow-hidden aspect-[16/9] sm:aspect-[21/9] bg-slate-100">
            <img
              src={IMG.water_drop}
              alt="Goutte d'eau créant des ondulations sur une surface"
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
          </div>
        </Reveal>
      </div>

      <div className="px-6 pb-32 md:pb-40">
        <div className="max-w-3xl mx-auto">
          <SectionEyebrow num="01" label="Vérité universelle" />
          <Reveal delay={100}>
            <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
              L’eau est une condition d’existence.
            </h2>
          </Reveal>
          <Reveal delay={250}>
            <div className="mt-8 space-y-5 text-lg md:text-xl text-[#1d1d1f] leading-relaxed">
              <p>
                Sans eau, il n’y a ni santé, ni agriculture, ni développement.
              </p>
              <p className="text-[#6e6e73]">
                Pourtant, pour des millions de personnes, l’accès à l’eau
                potable reste incertain.
              </p>
            </div>
          </Reveal>
          <Reveal delay={400}>
            <blockquote className="mt-12 border-l-2 border-cyan-700 pl-6 py-2">
              <p className="text-2xl md:text-3xl font-light italic tracking-tight text-[#1d1d1f] leading-snug">
                « L’eau est le principe de toute chose. »
              </p>
              <footer className="mt-3 text-sm text-[#86868b]">
                — Thalès de Milet
              </footer>
            </blockquote>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — IMPACT
// ─────────────────────────────────────────────────────────────────────────────

function Section2Impact() {
  const levers = [
    { title: 'Santé',           body: 'Une eau non sécurisée est l’une des principales causes de maladies évitables.' },
    { title: 'Éducation',       body: 'Lorsque l’eau est éloignée, les enfants — en particulier les filles — manquent l’école.' },
    { title: 'Économie locale', body: 'Le temps consacré à la collecte de l’eau réduit la capacité de travail et de production.' },
    { title: 'Résilience climatique', body: 'L’accès à l’eau renforce la capacité des communautés à faire face aux sécheresses.' },
  ]
  return (
    <section id="impact" className="bg-[#fafafa] px-6 py-32 md:py-40">
      <div className="max-w-5xl mx-auto">
        <SectionEyebrow num="02" label="Impact" />
        <Reveal delay={100}>
          <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1] max-w-3xl">
            L’accès à l’eau ne se limite pas
            <br />
            <span className="text-[#86868b]">
              à un besoin fondamental.
            </span>
          </h2>
        </Reveal>
        <Reveal delay={250}>
          <p className="mt-8 max-w-3xl text-lg md:text-xl text-[#1d1d1f] leading-relaxed">
            Il conditionne l’ensemble des dynamiques de développement.
          </p>
        </Reveal>

        <div className="mt-16 grid md:grid-cols-2 gap-px bg-black/[0.06] rounded-3xl overflow-hidden border border-black/5">
          {levers.map((l, i) => (
            <Reveal key={l.title} delay={150 + i * 80}>
              <div className="bg-white p-8 md:p-10 h-full">
                <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-[#1d1d1f]">
                  {l.title}
                </h3>
                <p className="mt-3 text-[#6e6e73] leading-relaxed text-[15px]">
                  {l.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={500}>
          <p className="mt-16 max-w-3xl text-base md:text-lg text-[#6e6e73] leading-relaxed border-t border-black/5 pt-8">
            Selon les estimations internationales, des centaines de millions
            de personnes dans le monde n’ont toujours pas accès à un service
            d’eau potable de base.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — RÉALITÉ RURALE
// ─────────────────────────────────────────────────────────────────────────────

function Section3Rural() {
  return (
    <section id="rural" className="bg-white">
      <div className="px-4 sm:px-6 pt-32 md:pt-40 mb-16">
        <Reveal>
          <div className="relative max-w-7xl mx-auto rounded-3xl overflow-hidden aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/9]">
            <img
              src={IMG.woman_jugs}
              alt="Femme rurale transportant des bidons d'eau"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            <div className="absolute inset-0 flex items-end p-8 sm:p-12 md:p-16 text-white">
              <Reveal>
                <p className="max-w-xl text-lg md:text-2xl font-light leading-snug">
                  Dans les zones rurales, l’accès à l’eau devient une
                  contrainte quotidienne, plutôt qu’un service garanti.
                </p>
              </Reveal>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="px-6 pb-32 md:pb-40">
        <div className="max-w-3xl mx-auto">
          <SectionEyebrow num="03" label="Réalité amplifiée en zones rurales" />
          <Reveal delay={100}>
            <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
              En zones rurales,
              <br />
              <span className="text-[#86868b]">les contraintes se cumulent.</span>
            </h2>
          </Reveal>
          <Reveal delay={250}>
            <p className="mt-8 text-lg md:text-xl text-[#1d1d1f] leading-relaxed">
              Distances importantes, infrastructures limitées, ressources
              irrégulières.
            </p>
          </Reveal>

          <Reveal delay={400}>
            <div className="mt-10 border-l-2 border-cyan-700 pl-6">
              <p className="text-sm text-cyan-700 font-medium tracking-wide uppercase mb-3">
                En Mauritanie
              </p>
              <ul className="space-y-3 text-base md:text-lg text-[#1d1d1f] leading-relaxed">
                <li className="flex gap-3">
                  <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-cyan-700 shrink-0" />
                  <span>
                    Certaines communautés sont situées à plusieurs kilomètres
                    du point d’eau le plus proche.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-cyan-700 shrink-0" />
                  <span>L’accès dépend souvent de ressources intermittentes.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-cyan-700 shrink-0" />
                  <span>
                    Les systèmes de distribution restent inégalement développés.
                  </span>
                </li>
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — DÉVELOPPEMENT (eau = levier)
// ─────────────────────────────────────────────────────────────────────────────

function Section4Development() {
  const levers = [
    'Permettre aux enfants d’aller à l’école.',
    'Améliorer les conditions sanitaires.',
    'Soutenir les activités économiques locales.',
    'Réduire les inégalités territoriales.',
  ]
  return (
    <section id="development" className="bg-[#fafafa] px-6 py-32 md:py-40">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        <div>
          <SectionEyebrow num="04" label="Une question de développement" />
          <Reveal delay={100}>
            <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
              L’eau, un levier
              <br />
              <span className="bg-gradient-to-r from-cyan-700 to-cyan-500 bg-clip-text text-transparent">
                de développement.
              </span>
            </h2>
          </Reveal>
          <Reveal delay={250}>
            <p className="mt-8 text-base md:text-lg text-[#6e6e73] leading-relaxed">
              Améliorer l’accès à l’eau, ce n’est pas seulement répondre à un
              besoin immédiat. C’est créer les conditions du développement.
            </p>
          </Reveal>
          <ul className="mt-8 space-y-3">
            {levers.map((text, i) => (
              <Reveal key={i} delay={350 + i * 80}>
                <li className="flex gap-3 text-[#1d1d1f] leading-relaxed">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-700 shrink-0" />
                  <span>{text}</span>
                </li>
              </Reveal>
            ))}
          </ul>

          {/* Mention SDG 6 — discrète, institutionnelle */}
          <Reveal delay={700}>
            <div className="mt-10 flex items-center gap-4 p-4 rounded-2xl bg-white border border-black/5">
              <div className="shrink-0 w-12 h-12 rounded-lg bg-[#26BDE2] flex items-center justify-center">
                <span className="text-white font-bold text-sm">06</span>
              </div>
              <p className="text-sm text-[#6e6e73] leading-snug">
                <span className="text-[#1d1d1f] font-medium">
                  Objectif de développement durable n°6
                </span>{' '}
                des Nations Unies — Eau propre et assainissement.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={300}>
          <div className="relative rounded-3xl overflow-hidden aspect-[4/5] bg-slate-100">
            <img
              src={IMG.boy_pump}
              alt="Enfant utilisant une pompe à eau manuelle"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — VOIR POUR AGIR (transition vers MINAI)
// ─────────────────────────────────────────────────────────────────────────────

function Section5SeeingToAct() {
  return (
    <section id="challenge" className="bg-white px-6 py-32 md:py-40 border-t border-black/5">
      <div className="max-w-4xl mx-auto">
        <SectionEyebrow num="05" label="Le défi" />
        <Reveal delay={100}>
          <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
            Voir pour agir.
          </h2>
        </Reveal>
        <Reveal delay={250}>
          <p className="mt-8 text-lg md:text-xl text-[#1d1d1f] leading-relaxed max-w-3xl">
            Pourtant, malgré l’importance de cet enjeu, toutes les zones ne
            sont pas identifiées avec la même précision.
          </p>
        </Reveal>

        <div className="mt-12 grid md:grid-cols-3 gap-6 md:gap-8">
          <Reveal delay={150}>
            <ChallengeCard
              n="A"
              title="Communautés absentes des données"
              body="Certaines zones rurales n’apparaissent pas dans les systèmes officiels d’information."
            />
          </Reveal>
          <Reveal delay={250}>
            <ChallengeCard
              n="B"
              title="Informations fragmentées"
              body="Les sources existent, mais ne sont pas croisées entre elles."
            />
          </Reveal>
          <Reveal delay={350}>
            <ChallengeCard
              n="C"
              title="Priorités peu établies"
              body="Sans lecture commune, les interventions ne ciblent pas toujours les zones les plus critiques."
            />
          </Reveal>
        </div>

        <Reveal delay={550}>
          <p className="mt-16 max-w-3xl text-2xl md:text-3xl font-light tracking-tight leading-snug text-[#1d1d1f]">
            Résultat :{' '}
            <span className="text-[#86868b]">
              les interventions ne ciblent pas toujours les zones les plus
              critiques.
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function ChallengeCard({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="border-t border-black/10 pt-5">
      <span className="text-[11px] font-mono text-cyan-700">{n}</span>
      <h3 className="mt-2 text-lg font-semibold tracking-tight text-[#1d1d1f]">
        {title}
      </h3>
      <p className="mt-2 text-[#6e6e73] leading-relaxed text-[14px]">{body}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — CONCLUSION (lien MINAI)
// ─────────────────────────────────────────────────────────────────────────────

function Section6Conclusion({ onEnterMap }: { onEnterMap: () => void }) {
  return (
    <section className="relative bg-[#fafafa] px-6 py-32 md:py-44 border-t border-black/5 overflow-hidden">
      <div className="max-w-4xl mx-auto text-center">
        <SectionEyebrow num="06" label="Conclusion" centered />
        <Reveal delay={100}>
          <h2 className="mt-6 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
            Améliorer l’accès à l’eau
            <br />
            <span className="text-[#86868b]">
              nécessite des ressources.
            </span>
          </h2>
        </Reveal>
        <Reveal delay={250}>
          <p className="mt-6 text-2xl md:text-3xl font-light tracking-tight text-[#1d1d1f] leading-snug">
            Mais cela nécessite aussi une meilleure capacité à orienter les
            interventions.
          </p>
        </Reveal>

        <Reveal delay={450}>
          <div className="mt-14 max-w-2xl mx-auto p-8 md:p-10 rounded-3xl bg-white border border-black/5">
            <p className="text-base md:text-lg text-[#1d1d1f] leading-relaxed">
              <span className="font-semibold">MINAI</span> aide les ONG et les
              institutions à identifier les zones où l’accès à l’eau est le
              plus critique, afin de prioriser les actions là où elles sont
              réellement nécessaires.
            </p>
            <button
              onClick={onEnterMap}
              className="mt-8 bg-[#1d1d1f] text-white px-7 py-3 rounded-full font-medium hover:bg-black transition"
            >
              Voir la cartographie
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGNATURE
// ─────────────────────────────────────────────────────────────────────────────

function Signature() {
  return (
    <footer className="px-6 py-16 bg-white border-t border-black/5">
      <p className="max-w-4xl mx-auto text-center text-base md:text-xl font-light tracking-tight leading-snug text-[#1d1d1f]">
        MINAI <span className="text-[#86868b]">—</span>{' '}
        <span className="bg-gradient-to-r from-cyan-700 to-cyan-500 bg-clip-text text-transparent">
          making the invisible visible again.
        </span>
      </p>
      <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-3 max-w-7xl mx-auto text-[11px] text-[#86868b]">
        <span>Nouakchott, Mauritanie · © 2026 MINAI</span>
        <span>
          Aligned with UN SDG 6 · Sources : ANSADE · UNICEF · World Bank · OpenStreetMap
        </span>
      </div>
    </footer>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Petits composants partagés
// ─────────────────────────────────────────────────────────────────────────────

function SectionEyebrow({
  num, label, centered = false,
}: { num: string; label: string; centered?: boolean }) {
  return (
    <Reveal>
      <p className={`text-[11px] tracking-[0.35em] uppercase text-cyan-700 ${centered ? 'text-center' : ''}`}>
        <span className="font-mono">{num}</span>
        <span className="mx-2 text-[#86868b]">·</span>
        <span>{label}</span>
      </p>
    </Reveal>
  )
}
