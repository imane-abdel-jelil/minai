import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  /** Retour à la landing */
  onBack: () => void
  /** Entrer dans la cartographie (CTA primaire) */
  onEnterMap: () => void
}

/**
 * Page éditoriale : "L'eau, condition d'existence"
 *
 * Conçue comme une PROGRESSION continue qui amène à la carte, pas comme
 * un article académique en sections numérotées.
 *
 * Flow narratif (6 beats fluides, sans titres "01/02/...") :
 *   1. Vérité universelle (eau)            → typographie monumentale, pas d'image
 *   2. Réalité terrain (Mauritanie)        → photo 1 full-bleed (rupture)
 *   3. Impact concret                      → split texte/photo 2
 *   4. Visibilité (data)                   → texte sobre, pas d'image
 *   5. Défi de priorisation                → photo 3 full-bleed
 *   6. Transition + lien MINAI             → photo 4 + CTA carte
 *
 * Header simplifié : MINAI · L'eau · Voir la cartographie. C'est tout.
 */

const IMG = {
  mauritania_woman: '/images/mauritania-woman-jerrycans.jpg',
  girl_pump:        '/images/girl-water-pump.jpg',
  water_tanker:     '/images/mauritania-water-tanker.jpg',
  women_sunset:     '/images/women-water-sunset.jpg',
}

export default function UnderstandingPage({ onBack, onEnterMap }: Props) {
  return (
    <div className="bg-white text-[#1d1d1f] overflow-x-hidden font-sans antialiased">
      <Nav onBack={onBack} onEnterMap={onEnterMap} />
      <Beat1Universal />
      <FullBleedImage
        src={IMG.mauritania_woman}
        alt="Femme mauritanienne transportant trois jerrycans dans le désert"
        caption="Mauritanie · Le quotidien de l’accès à l’eau"
      />
      <Beat2Reality />
      <Beat3Impact />
      <Beat4Visibility />
      <FullBleedImage
        src={IMG.water_tanker}
        alt="Distribution d'eau par citerne, jerrycans alignés en Mauritanie"
        caption="Une intervention. Des centaines d’attentes."
      />
      <Beat5Challenge />
      <FullBleedImage
        src={IMG.women_sunset}
        alt="Silhouettes de femmes transportant des jerrycans au coucher du soleil"
        caption=""
        tone="dark"
      />
      <Beat6Decision onEnterMap={onEnterMap} />
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
// NAV — 3 items seulement
// ─────────────────────────────────────────────────────────────────────────────

function Nav({ onBack, onEnterMap }: { onBack: () => void; onEnterMap: () => void }) {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-white/80 border-b border-black/5">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <button
          onClick={onBack}
          className="font-semibold tracking-tight text-[15px] text-[#1d1d1f] hover:opacity-70 transition"
        >
          MINAI<span className="text-cyan-600">.</span>
        </button>

        {/* Indicateur page courante — 'L'eau' actif, statique */}
        <span className="text-[13px] text-[#1d1d1f] font-medium tracking-tight">
          L’eau
        </span>

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
// BEAT 1 — VÉRITÉ UNIVERSELLE (typographie pure, ouverture sobre)
// ─────────────────────────────────────────────────────────────────────────────

function Beat1Universal() {
  return (
    <section className="pt-32 md:pt-40 pb-20 md:pb-28 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <Reveal>
          <p className="text-[11px] tracking-[0.35em] uppercase text-cyan-700 mb-7">
            MINAI · Comprendre
          </p>
        </Reveal>

        <Reveal delay={150}>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-semibold tracking-tight leading-[1.03]">
            L’eau, condition
            <br />
            <span className="bg-gradient-to-b from-[#1d1d1f] to-[#6e6e73] bg-clip-text text-transparent">
              d’existence.
            </span>
          </h1>
        </Reveal>

        <Reveal delay={350}>
          <p className="mt-10 text-lg md:text-2xl text-[#1d1d1f] leading-snug max-w-2xl mx-auto">
            Sans accès à l’eau, rien ne fonctionne durablement —{' '}
            <span className="text-[#86868b]">
              ni la santé, ni l’éducation, ni l’économie.
            </span>
          </p>
        </Reveal>

        <Reveal delay={500}>
          <p className="mt-6 text-base md:text-lg text-[#6e6e73] max-w-2xl mx-auto leading-relaxed">
            Pourtant, aujourd’hui encore, l’accès à l’eau potable reste incertain.
          </p>
        </Reveal>

        <Reveal delay={700}>
          <p className="mt-12 text-sm md:text-base italic text-[#86868b]">
            « L’eau est le principe de toute chose. » — Thalès de Milet
          </p>
        </Reveal>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BEAT 2 — RÉALITÉ TERRAIN (continue après photo 1)
// ─────────────────────────────────────────────────────────────────────────────

function Beat2Reality() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <p className="text-base md:text-lg text-[#86868b] leading-relaxed">
            Mais cette réalité n’est pas répartie de manière égale.
          </p>
        </Reveal>
        <Reveal delay={150}>
          <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
            Pour certaines communautés,
            <br />
            <span className="text-[#86868b]">
              l’accès à l’eau dépend de plusieurs heures de marche.
            </span>
          </h2>
        </Reveal>
        <Reveal delay={300}>
          <p className="mt-6 text-2xl md:text-3xl font-semibold tracking-tight text-cyan-700">
            Chaque jour.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BEAT 3 — IMPACT CONCRET (split texte/photo)
// ─────────────────────────────────────────────────────────────────────────────

function Beat3Impact() {
  return (
    <section className="bg-[#fafafa] px-6 py-24 md:py-32 border-t border-black/5">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        <div>
          <Reveal>
            <p className="text-base md:text-lg text-[#86868b] leading-relaxed">
              Ce déséquilibre se traduit en conséquences concrètes.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
              L’accès à l’eau ne détermine pas
              <br />
              <span className="text-[#86868b]">seulement la survie.</span>
            </h2>
          </Reveal>
          <Reveal delay={300}>
            <p className="mt-6 text-xl md:text-2xl text-[#1d1d1f] leading-snug">
              Il détermine la capacité à vivre.
            </p>
          </Reveal>

          <ul className="mt-10 space-y-3 text-base md:text-lg text-[#1d1d1f] leading-relaxed">
            <Reveal delay={400}>
              <li className="flex gap-3">
                <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-cyan-700 shrink-0" />
                <span>Santé fragilisée.</span>
              </li>
            </Reveal>
            <Reveal delay={480}>
              <li className="flex gap-3">
                <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-cyan-700 shrink-0" />
                <span>Scolarité interrompue.</span>
              </li>
            </Reveal>
            <Reveal delay={560}>
              <li className="flex gap-3">
                <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-cyan-700 shrink-0" />
                <span>Activité économique limitée.</span>
              </li>
            </Reveal>
          </ul>

          <Reveal delay={700}>
            <p className="mt-10 text-sm md:text-base text-[#6e6e73] leading-relaxed border-t border-black/5 pt-5">
              En Mauritanie, l’eau n’est pas absente. Elle est difficilement
              accessible : villages éloignés des points d’eau, ressources
              irrégulières, infrastructures inégalement réparties.
            </p>
          </Reveal>
        </div>

        <Reveal delay={250}>
          <div className="relative rounded-3xl overflow-hidden aspect-[4/5] bg-slate-200">
            <img
              src={IMG.girl_pump}
              alt="Fillette debout près d'un point d'eau"
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
// BEAT 4 — VISIBILITÉ (data, sobre, pas d'image)
// ─────────────────────────────────────────────────────────────────────────────

function Beat4Visibility() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <p className="text-base md:text-lg text-[#86868b] leading-relaxed">
            Ce constat est connu. Il est même reconnu :
          </p>
        </Reveal>
        <Reveal delay={150}>
          <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
            l’accès à l’eau
            <br />
            <span className="bg-gradient-to-r from-cyan-700 to-cyan-500 bg-clip-text text-transparent">
              est un droit humain fondamental.
            </span>
          </h2>
        </Reveal>

        <Reveal delay={300}>
          <p className="mt-8 text-base md:text-lg text-[#1d1d1f] leading-relaxed">
            Mais malgré cette reconnaissance, toutes les zones ne sont pas
            identifiées avec la même précision. Dans de nombreux cas, les
            communautés les plus exposées restent en dehors des systèmes
            de décision.
          </p>
        </Reveal>

        {/* SDG 6 inline, discret */}
        <Reveal delay={500}>
          <div className="mt-8 flex items-center gap-3 p-3 rounded-xl bg-[#fafafa] border border-black/5 max-w-md">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-[#26BDE2] flex items-center justify-center">
              <span className="text-white font-bold text-xs">06</span>
            </div>
            <p className="text-xs text-[#6e6e73] leading-snug">
              <span className="text-[#1d1d1f] font-medium">
                Objectif de développement durable n°6
              </span>
              {' '}— Eau propre et assainissement, Nations Unies.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BEAT 5 — DÉFI DE PRIORISATION (continue après photo 3)
// ─────────────────────────────────────────────────────────────────────────────

function Beat5Challenge() {
  return (
    <section className="bg-[#fafafa] px-6 py-24 md:py-32 border-t border-black/5">
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <p className="text-base md:text-lg text-[#86868b] leading-relaxed">
            Le problème n’est pas un manque de données.
          </p>
        </Reveal>
        <Reveal delay={150}>
          <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
            Les données existent.
            <br />
            <span className="text-[#86868b]">
              Mais elles ne sont pas croisées.
            </span>
          </h2>
        </Reveal>
        <Reveal delay={300}>
          <p className="mt-8 text-base md:text-lg text-[#1d1d1f] leading-relaxed">
            ANSADE, UNICEF, World Bank, OpenStreetMap : les informations sont
            disponibles, mais dispersées. Sans une lecture claire du terrain,
            les priorités ne sont pas toujours établies.
          </p>
        </Reveal>

        <Reveal delay={500}>
          <div className="mt-12 border-l-2 border-cyan-700 pl-6">
            <p className="text-2xl md:text-3xl font-semibold tracking-tight text-[#1d1d1f] leading-snug">
              Le défi n’est pas uniquement d’agir.
            </p>
            <p className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight bg-gradient-to-r from-cyan-700 to-cyan-500 bg-clip-text text-transparent leading-snug">
              Le défi est de savoir où agir en premier.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BEAT 6 — DÉCISION + LIEN MINAI (CTA finale, after photo 4)
// ─────────────────────────────────────────────────────────────────────────────

function Beat6Decision({ onEnterMap }: { onEnterMap: () => void }) {
  return (
    <section className="px-6 py-32 md:py-40">
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <p className="text-base md:text-lg text-[#86868b] leading-relaxed">
            C’est là que MINAI intervient.
          </p>
        </Reveal>
        <Reveal delay={150}>
          <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
            Identifier les zones critiques.
            <br />
            <span className="text-[#86868b]">
              Prioriser les interventions.
            </span>
          </h2>
        </Reveal>
        <Reveal delay={300}>
          <p className="mt-8 text-base md:text-lg text-[#1d1d1f] leading-relaxed">
            MINAI aide les ONG et les institutions à identifier les zones où
            l’accès à l’eau est le plus critique en Mauritanie, et à orienter
            leurs interventions là où elles auront le plus d’impact.
          </p>
        </Reveal>

        <Reveal delay={500}>
          <div className="mt-12 p-8 md:p-10 rounded-3xl bg-[#1d1d1f] text-white">
            <p className="text-lg md:text-xl leading-relaxed">
              La carte rend visible ce que les données isolées ne montrent pas.
            </p>
            <button
              onClick={onEnterMap}
              className="mt-8 bg-white text-[#1d1d1f] px-7 py-3 rounded-full font-medium hover:bg-white/90 transition inline-flex items-center gap-2"
            >
              Voir la cartographie
              <span aria-hidden>→</span>
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL-BLEED IMAGE — composant générique pour les 3 respirations visuelles
// ─────────────────────────────────────────────────────────────────────────────

function FullBleedImage({
  src,
  alt,
  caption,
  tone = 'light',
}: {
  src: string
  alt: string
  caption: string
  tone?: 'light' | 'dark'
}) {
  return (
    <div className="px-4 sm:px-6">
      <Reveal>
        <div className="relative max-w-7xl mx-auto rounded-3xl overflow-hidden aspect-[16/9] md:aspect-[21/9] bg-slate-200">
          <img
            src={src}
            alt={alt}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          {tone === 'dark' && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          )}
          {caption && (
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <p className="text-white text-sm md:text-base font-medium tracking-tight drop-shadow-md">
                {caption}
              </p>
            </div>
          )}
        </div>
      </Reveal>
    </div>
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
