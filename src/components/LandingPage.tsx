import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  onEnter: () => void
  onUnderstand: () => void
}

/**
 * Landing page MINAI — version institutionnelle v6.
 *
 * Positionnement : MINAI est une INITIATIVE géospatiale d'aide à la
 * décision publique. Pas un produit SaaS. Ton UN / World Bank.
 *
 * Flow narratif : problème → conséquences → solution → impact → SDG 6 →
 * collaboration. Toutes les sections respectent le copywriting demandé :
 * une idée par phrase, transitions fortes, pas de jargon.
 *
 * Photos : Pexels — free for commercial use, attribution non requise.
 */

const IMG = {
  woman_jerrycan:    'https://images.pexels.com/photos/30441483/pexels-photo-30441483.jpeg?auto=compress&cs=tinysrgb&w=2000',
  smiling_water:     'https://images.pexels.com/photos/30629420/pexels-photo-30629420.jpeg?auto=compress&cs=tinysrgb&w=2000',
  women_carrying:    'https://images.pexels.com/photos/4511301/pexels-photo-4511301.jpeg?auto=compress&cs=tinysrgb&w=2000',
  woman_water_jugs:  'https://images.pexels.com/photos/30441497/pexels-photo-30441497.jpeg?auto=compress&cs=tinysrgb&w=1400',
  child_drinking:    'https://images.pexels.com/photos/7165327/pexels-photo-7165327.jpeg?auto=compress&cs=tinysrgb&w=1400',
  boy_pump:          'https://images.pexels.com/photos/11759837/pexels-photo-11759837.jpeg?auto=compress&cs=tinysrgb&w=1400',
}

export default function LandingPage({ onEnter, onUnderstand }: Props) {
  return (
    <div className="bg-white text-[#1d1d1f] overflow-x-hidden font-sans antialiased">
      <Nav onEnter={onEnter} onUnderstand={onUnderstand} />
      <Hero onEnter={onEnter} onUnderstand={onUnderstand} />
      <HeroImage />
      <ContextSection />
      <ProblemSection />
      <ConsequencesGallery />
      <HumanImpactSection />
      <SolutionSection />
      <ByTheNumbersSection />
      <SDG6Section onUnderstand={onUnderstand} />
      <CollaborationSection onEnter={onEnter} />
      <Signature />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Reveal-on-scroll
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

function Nav({ onEnter, onUnderstand }: { onEnter: () => void; onUnderstand: () => void }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-white/75 border-b border-black/5">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 h-14 flex items-center justify-between">
          <span className="font-semibold tracking-tight text-[15px] text-[#1d1d1f]">
            MINAI<span className="text-cyan-600">.</span>
          </span>

          {/* Liens — desktop seulement */}
          <div className="hidden md:flex items-center gap-8 text-[13px] text-[#6e6e73]">
            <button onClick={onUnderstand} className="hover:text-[#1d1d1f] transition">
              Accès à l’eau
            </button>
            <a href="#problem"        className="hover:text-[#1d1d1f] transition">Problème</a>
            <a href="#solution"       className="hover:text-[#1d1d1f] transition">Solution</a>
            <a href="#impact"         className="hover:text-[#1d1d1f] transition">Impact</a>
            <a href="#sdg6"           className="hover:text-[#1d1d1f] transition">SDG 6</a>
            <a href="#collaboration"  className="hover:text-[#1d1d1f] transition">Collaboration</a>
          </div>

          {/* CTA desktop */}
          <button
            onClick={onEnter}
            className="hidden md:block text-[13px] bg-[#1d1d1f] text-white px-4 py-1.5 rounded-full font-medium hover:bg-black transition"
          >
            Voir la cartographie →
          </button>

          {/* Hamburger mobile */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            className="md:hidden w-10 h-10 -mr-2 flex items-center justify-center"
          >
            <span className="relative block w-5 h-4">
              <span
                className={`absolute left-0 top-0 h-0.5 w-5 bg-[#1d1d1f] rounded-full transition-transform duration-200 ${
                  open ? 'translate-y-[7px] rotate-45' : ''
                }`}
              />
              <span
                className={`absolute left-0 top-[7px] h-0.5 w-5 bg-[#1d1d1f] rounded-full transition-opacity duration-200 ${
                  open ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute left-0 top-[14px] h-0.5 w-5 bg-[#1d1d1f] rounded-full transition-transform duration-200 ${
                  open ? '-translate-y-[7px] -rotate-45' : ''
                }`}
              />
            </span>
          </button>
        </div>
      </nav>

      {/* Sheet mobile */}
      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 top-14 z-40 bg-black/30"
            onClick={close}
          />
          <div className="md:hidden fixed top-14 inset-x-0 z-40 bg-white border-b border-black/5 shadow-lg">
            <div className="px-6 py-5 flex flex-col text-[15px] text-[#1d1d1f]">
              <button onClick={() => { close(); onUnderstand() }} className="text-left py-3 border-b border-black/5">
                Accès à l’eau
              </button>
              <a href="#problem"       onClick={close} className="py-3 border-b border-black/5">Problème</a>
              <a href="#solution"      onClick={close} className="py-3 border-b border-black/5">Solution</a>
              <a href="#impact"        onClick={close} className="py-3 border-b border-black/5">Impact</a>
              <a href="#sdg6"          onClick={close} className="py-3 border-b border-black/5">SDG 6</a>
              <a href="#collaboration" onClick={close} className="py-3 border-b border-black/5">Collaboration</a>
              <button
                onClick={() => { close(); onEnter() }}
                className="mt-5 bg-[#1d1d1f] text-white py-3 rounded-full font-medium"
              >
                Voir la cartographie →
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO — institutionnel, court, clair en moins de 10 secondes
// ─────────────────────────────────────────────────────────────────────────────

function Hero({ onEnter, onUnderstand }: { onEnter: () => void; onUnderstand: () => void }) {
  return (
    <section className="relative pt-32 md:pt-40 pb-16 md:pb-20 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <Reveal>
          <p className="text-[11px] tracking-[0.35em] uppercase text-cyan-700 mb-7">
            Initiative géospatiale · Mauritanie
          </p>
        </Reveal>

        <Reveal delay={150}>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-semibold tracking-tight leading-[1.03]">
            Making the invisible
            <br />
            <span className="bg-gradient-to-b from-[#1d1d1f] to-[#6e6e73] bg-clip-text text-transparent">
              visible again.
            </span>
          </h1>
        </Reveal>

        <Reveal delay={300}>
          <p className="mt-9 text-lg md:text-2xl text-[#1d1d1f] max-w-3xl mx-auto leading-snug">
            MINAI est une initiative d’intelligence géospatiale dédiée à l’accès à
            l’eau potable en Mauritanie. Elle vise à rendre visibles les communautés
            aujourd’hui absentes des systèmes de décision.
          </p>
        </Reveal>

        {/* Chip discret avec les chiffres clés et leurs sources */}
        <Reveal delay={450}>
          <a
            href="#impact"
            className="mt-7 inline-flex items-center gap-2 text-xs md:text-sm text-[#6e6e73] hover:text-[#1d1d1f] transition px-3 py-1.5 rounded-full bg-[#fafafa] border border-black/5"
          >
            <span className="text-cyan-700">↳</span>
            <span className="font-medium text-[#1d1d1f]">600K+</span>
            <span>personnes en zones critiques</span>
            <span className="text-[#86868b]">· Sources : ANSADE · UNICEF · World Bank</span>
          </a>
        </Reveal>

        <Reveal delay={600}>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onEnter}
              className="bg-[#1d1d1f] text-white px-7 py-3 rounded-full font-medium hover:bg-black transition"
            >
              Voir la cartographie
            </button>
            <a
              href="#collaboration"
              className="border border-[#1d1d1f]/20 text-[#1d1d1f] px-7 py-3 rounded-full font-medium hover:bg-[#1d1d1f]/[0.04] transition text-center"
            >
              Collaborer
            </a>
          </div>
        </Reveal>

        {/* Lien tertiaire discret vers la page éditoriale */}
        <Reveal delay={750}>
          <button
            onClick={onUnderstand}
            className="mt-8 text-sm text-[#6e6e73] hover:text-[#1d1d1f] transition inline-flex items-center gap-1.5"
          >
            Pourquoi l’accès à l’eau ?{' '}
            <span className="opacity-60">Comprendre l’enjeu →</span>
          </button>
        </Reveal>
      </div>
    </section>
  )
}

function HeroImage() {
  return (
    <div className="px-4 sm:px-6 mb-24">
      <Reveal>
        <div className="relative max-w-7xl mx-auto rounded-3xl overflow-hidden aspect-[16/9] sm:aspect-[21/9] bg-slate-100">
          <img
            src={IMG.woman_jerrycan}
            alt="Femme transportant un jerrycan d’eau dans un village rural"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent pointer-events-none" />
        </div>
      </Reveal>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT — passage du global (Afrique) au local (Mauritanie)
// Pont de crédibilité entre le hero et le problème.
// ─────────────────────────────────────────────────────────────────────────────

function ContextSection() {
  return (
    <section className="bg-white px-6 py-28 md:py-36 border-t border-black/5">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <p className="text-[11px] tracking-[0.35em] uppercase text-cyan-700 mb-6">
            Contexte
          </p>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1] max-w-3xl">
            Un enjeu global,
            <br />
            <span className="text-[#86868b]">une réalité locale.</span>
          </h2>
        </Reveal>

        {/* 2 colonnes 50/50 : texte gauche / stat card droite, alignés en haut */}
        <div className="mt-12 grid md:grid-cols-2 gap-8 md:gap-12 items-start">
          <div className="space-y-5 text-base md:text-lg text-[#1d1d1f] leading-relaxed">
            <Reveal delay={200}>
              <p>
                En Afrique subsaharienne, des centaines de millions de personnes
                vivent sans accès fiable à l’eau potable.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <p>
                En Mauritanie, cette situation est particulièrement marquée dans
                les zones rurales, où l’accès dépend de la distance, de la
                disponibilité et de la régularité des ressources.
              </p>
            </Reveal>
            <Reveal delay={500}>
              <p className="text-[#6e6e73] border-t border-black/5 pt-5 mt-7">
                Une réalité qui reste partiellement invisible dans les systèmes
                de décision.
              </p>
            </Reveal>
          </div>

          <Reveal delay={400}>
            <a
              href="https://data.worldbank.org/indicator/SH.H2O.BASW.ZS?locations=MR"
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-3xl border border-black/[0.06] bg-[#fafafa] p-6 md:p-8 hover:bg-white hover:border-black/15 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] tracking-[0.18em] uppercase text-[#1d1d1f] font-semibold">
                    World Bank
                  </p>
                  <p className="mt-1 text-[10px] text-[#86868b] tracking-wide">
                    Indicator SH.H2O.BASW.ZS
                  </p>
                </div>
                <span className="text-[#86868b] group-hover:text-[#1d1d1f] group-hover:translate-x-0.5 transition transform">
                  ↗
                </span>
              </div>

              <p className="mt-8 text-6xl md:text-7xl font-semibold tracking-tight text-[#1d1d1f] leading-none">
                57%
              </p>
              <p className="mt-4 text-sm md:text-base text-[#1d1d1f] leading-snug">
                de la population rurale en Mauritanie dispose d’un accès à une
                source d’eau améliorée.
              </p>

              <p className="mt-6 text-xs text-cyan-700 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Voir l’indicateur <span aria-hidden>→</span>
              </p>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROBLEM — l'angle central : visibilité, pas ressources
// ─────────────────────────────────────────────────────────────────────────────

function ProblemSection() {
  return (
    <section id="problem" className="bg-[#fafafa] px-6 py-32 md:py-40">
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <p className="text-[11px] tracking-[0.35em] uppercase text-cyan-700 mb-6">
            Le problème
          </p>
        </Reveal>

        <Reveal delay={100}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] max-w-3xl">
            Ce n’est pas un manque de ressources.
            <br />
            <span className="text-[#86868b]">C’est un manque de visibilité.</span>
          </h2>
        </Reveal>

        <Reveal delay={250}>
          <p className="mt-12 max-w-3xl text-lg md:text-xl text-[#1d1d1f] leading-relaxed border-l-2 border-cyan-700 pl-6">
            Dans les zones rurales du sud mauritanien, des villages se trouvent à
            plus de cinq kilomètres du point d’eau le plus proche. Ils
            n’apparaissent pas systématiquement comme prioritaires dans les
            systèmes officiels d’aide à la décision.{' '}
            <span className="text-[#86868b]">
              Ce qui n’est pas vu n’est pas servi.
            </span>
          </p>
        </Reveal>

        <div className="mt-20 grid md:grid-cols-3 gap-12">
          <Reveal delay={150}>
            <Pillar
              n="01"
              title="Données fragmentées"
              body="Les informations existent — UNICEF, ANSADE, OpenStreetMap, ONG. Elles restent dispersées et difficilement exploitables."
            />
          </Reveal>
          <Reveal delay={250}>
            <Pillar
              n="02"
              title="Territoires invisibles"
              body="Une part importante des zones rurales n’est pas correctement représentée dans les systèmes d’aide à la décision."
            />
          </Reveal>
          <Reveal delay={350}>
            <Pillar
              n="03"
              title="Interventions non priorisées"
              body="Les ressources sont mobilisées là où les données sont visibles, pas nécessairement là où les besoins sont les plus critiques."
            />
          </Reveal>
        </div>

        <Reveal delay={500}>
          <p className="mt-24 text-2xl md:text-4xl font-light text-center text-[#1d1d1f] max-w-3xl mx-auto leading-snug">
            Les données existent.{' '}
            <span className="text-[#86868b]">
              Elles ne deviennent pas systématiquement des décisions.
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function Pillar({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <span className="text-[11px] text-cyan-700 font-mono">{n}</span>
      <h3 className="mt-3 text-xl font-semibold tracking-tight text-[#1d1d1f]">{title}</h3>
      <p className="mt-3 text-[#6e6e73] leading-relaxed text-[15px]">{body}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSÉQUENCES — galerie 3 photos, suite logique du problème
// ─────────────────────────────────────────────────────────────────────────────

function ConsequencesGallery() {
  const items = [
    { src: IMG.woman_water_jugs, alt: "Femme rurale transportant des bidons d'eau",
      caption: 'Marche quotidienne vers l’eau' },
    { src: IMG.boy_pump,          alt: 'Enfant utilisant une pompe à eau manuelle',
      caption: 'L’enfance face à la pompe' },
    { src: IMG.child_drinking,    alt: "Enfant buvant un verre d'eau",
      caption: 'Le geste qu’on tient pour acquis' },
  ]
  return (
    <section className="bg-white px-4 sm:px-6 py-24 md:py-32">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <p className="text-[11px] tracking-[0.35em] uppercase text-cyan-700 mb-4 text-center">
            Les conséquences
          </p>
        </Reveal>
        <Reveal delay={100}>
          <h3 className="text-center text-3xl md:text-5xl font-semibold tracking-tight text-[#1d1d1f] max-w-3xl mx-auto leading-tight">
            Quand un territoire devient invisible,
            <br />
            <span className="text-[#86868b]">ses habitants aussi.</span>
          </h3>
        </Reveal>
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {items.map((it, i) => (
            <Reveal key={i} delay={100 + i * 100}>
              <figure className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-slate-100">
                <img
                  src={it.src}
                  alt={it.alt}
                  className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-[1.04]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />
                <figcaption className="absolute bottom-4 left-4 right-4 text-white text-sm md:text-base font-medium tracking-tight">
                  {it.caption}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HUMAN IMPACT — réalité incarnée, photo full-bleed
// ─────────────────────────────────────────────────────────────────────────────

function HumanImpactSection() {
  return (
    <section className="relative px-4 sm:px-6 py-24 md:py-32 bg-white">
      <Reveal>
        <div className="relative max-w-7xl mx-auto rounded-3xl overflow-hidden aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/9]">
          <img
            src={IMG.smiling_water}
            alt="Femme cherchant de l'eau dans un paysage africain"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

          <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-12 md:p-16 text-white">
            <Reveal>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-tight leading-[1.08] max-w-3xl">
                Derrière chaque zone invisible,
                <br />
                <span className="text-white/70">il y a une réalité.</span>
              </h2>
            </Reveal>

            <div className="mt-6 sm:mt-8 space-y-2 sm:space-y-3 max-w-2xl text-base sm:text-lg md:text-xl font-light text-white/90 leading-relaxed">
              <Reveal delay={150}>
                <p>Des femmes qui marchent plusieurs heures pour un accès limité à l’eau.</p>
              </Reveal>
              <Reveal delay={250}>
                <p>Des enfants qui quittent l’école pour subvenir aux besoins du foyer.</p>
              </Reveal>
              <Reveal delay={350}>
                <p>Des communautés entières en attente d’une intervention qui ne vient pas.</p>
              </Reveal>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={400}>
        <p className="mt-16 md:mt-24 max-w-4xl mx-auto text-center text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1] text-[#1d1d1f]">
          Ce qui n’est pas visible
          <br />
          <span className="bg-gradient-to-r from-cyan-600 to-cyan-800 bg-clip-text text-transparent">
            ne peut pas être servi.
          </span>
        </p>
      </Reveal>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SOLUTION — initiative géospatiale, 3 axes (pas 3 features SaaS)
// ─────────────────────────────────────────────────────────────────────────────

function SolutionSection() {
  return (
    <section id="solution" className="bg-[#fafafa] px-6 py-32 md:py-40">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <p className="text-[11px] tracking-[0.35em] uppercase text-cyan-700 mb-6">
            L’initiative
          </p>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] max-w-3xl text-[#1d1d1f]">
            Rendre les données existantes
            <br />
            <span className="bg-gradient-to-r from-cyan-700 to-cyan-500 bg-clip-text text-transparent">
              utilisables pour décider.
            </span>
          </h2>
        </Reveal>
        <Reveal delay={250}>
          <p className="mt-10 text-lg md:text-xl text-[#1d1d1f] max-w-3xl leading-relaxed">
            MINAI ne collecte pas de nouvelles données. L’initiative croise et
            structure les informations institutionnelles déjà publiques pour
            révéler ce qu’elles ne montrent pas seules : les zones où l’accès à
            l’eau potable est insuffisant et où les interventions sont les plus urgentes.
          </p>
        </Reveal>

        <div className="mt-20 grid md:grid-cols-3 gap-px bg-black/[0.06] rounded-3xl overflow-hidden border border-black/5">
          <Reveal delay={150}>
            <Axis
              icon={<TargetIcon />}
              title="Cartographier les zones sous-desservies"
              body="Croisement des données démographiques (ANSADE), des infrastructures (OpenStreetMap) et des standards humanitaires."
            />
          </Reveal>
          <Reveal delay={250}>
            <Axis
              icon={<PinIcon />}
              title="Révéler les priorités"
              body="Score d’accès calculé selon la norme humanitaire Sphere — un point d’eau pour cinq cents habitants."
            />
          </Reveal>
          <Reveal delay={350}>
            <Axis
              icon={<HandshakeIcon />}
              title="Soutenir la décision publique"
              body="Une vision commune et vérifiable, accessible aux ONG, aux institutions et aux décideurs locaux."
            />
          </Reveal>
        </div>

        <Reveal delay={500}>
          <p className="mt-24 text-3xl md:text-5xl font-semibold tracking-tight text-center bg-gradient-to-r from-cyan-700 to-cyan-500 bg-clip-text text-transparent">
            De la donnée à l’action.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function Axis({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="bg-white p-10 h-full">
      <div className="text-cyan-700 mb-5">{icon}</div>
      <h3 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">{title}</h3>
      <p className="mt-3 text-[#6e6e73] leading-relaxed text-[15px]">{body}</p>
    </div>
  )
}

function TargetIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
}
function PinIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M12 21s7-7.5 7-12a7 7 0 0 0-14 0c0 4.5 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}
function HandshakeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l4 4 5-5 3 3 6-6" />
      <path d="M14 6h6v6" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPACT — chiffres adossés aux institutions de référence
// ─────────────────────────────────────────────────────────────────────────────

function ByTheNumbersSection() {
  return (
    <section id="impact" className="bg-white px-6 py-32 md:py-40 border-t border-black/5">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <p className="text-[11px] tracking-[0.35em] uppercase text-cyan-700 mb-6 text-center">
            Aujourd’hui en Mauritanie
          </p>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="text-center text-3xl md:text-5xl font-semibold tracking-tight text-[#1d1d1f] max-w-3xl mx-auto leading-tight">
            Trois chiffres. Trois sources publiques.
            <br />
            <span className="text-[#86868b]">Une seule réalité.</span>
          </h2>
        </Reveal>

        <div className="mt-16 grid md:grid-cols-3 gap-5">
          <Reveal delay={150}>
            <NumberCard
              stat="600K+"
              label="personnes en zones critiques"
              source="ANSADE"
              sourceTag="Recensement RGPH 2013"
              body="Office national de la statistique mauritanien : population totale et milieu rural par wilaya."
              href="https://ansade.mr/fr/"
            />
          </Reveal>
          <Reveal delay={250}>
            <NumberCard
              stat="57%"
              label="population rurale avec eau améliorée"
              source="World Bank"
              sourceTag="Indicator SH.H2O.BASW.ZS"
              body="Open Data Bank : indicateurs de développement, accès à l'eau et sanitation, par pays."
              href="https://data.worldbank.org/indicator/SH.H2O.BASW.ZS?locations=MR"
            />
          </Reveal>
          <Reveal delay={350}>
            <NumberCard
              stat="1 / 4"
              label="enfant sans eau de base au Sahel"
              source="UNICEF · WHO"
              sourceTag="Joint Monitoring Programme"
              body="JMP : suivi mondial de l'accès à l'eau, l'assainissement et l'hygiène — profil Mauritanie."
              href="https://data.unicef.org/topic/water-and-sanitation/drinking-water/"
            />
          </Reveal>
        </div>

        <Reveal delay={550}>
          <p className="mt-20 max-w-3xl mx-auto text-center text-2xl md:text-3xl font-light tracking-tight leading-snug text-[#1d1d1f]">
            Ces chiffres sont publics.
            <br />
            <span className="text-[#86868b]">
              Ils ne sont pas systématiquement croisés avec le terrain.
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function NumberCard({
  stat,
  label,
  source,
  sourceTag,
  body,
  href,
}: {
  stat: string
  label: string
  source: string
  sourceTag: string
  body: string
  href: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-[#fafafa] rounded-3xl p-8 md:p-10 border border-black/[0.06] hover:border-black/15 hover:bg-white transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs tracking-[0.18em] uppercase text-[#1d1d1f] font-semibold">
            {source}
          </p>
          <p className="mt-1 text-[11px] text-[#86868b] tracking-wide">{sourceTag}</p>
        </div>
        <span className="text-[#86868b] group-hover:text-[#1d1d1f] group-hover:translate-x-0.5 transition transform">
          ↗
        </span>
      </div>

      <p className="mt-10 text-6xl md:text-7xl font-semibold tracking-tight text-[#1d1d1f] leading-none">
        {stat}
      </p>
      <p className="mt-3 text-[#1d1d1f] text-base font-medium">{label}</p>

      <p className="mt-6 text-[#6e6e73] text-[14px] leading-relaxed">{body}</p>

      <p className="mt-8 text-cyan-700 text-sm font-medium tracking-tight inline-flex items-center gap-1 group-hover:gap-2 transition-all">
        Consulter la source <span aria-hidden>→</span>
      </p>
    </a>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SDG 6 — alignement avec l'objectif onusien (institutionnel)
// ─────────────────────────────────────────────────────────────────────────────

function SDG6Section({ onUnderstand }: { onUnderstand: () => void }) {
  return (
    <section id="sdg6" className="bg-[#fafafa] px-6 py-32 md:py-40 border-t border-black/5">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-10 md:gap-16">
          {/* Badge inspiré de l'ODD 6 — couleur officielle des Nations Unies */}
          <div className="shrink-0">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-[#26BDE2] flex items-center justify-center shadow-[0_8px_30px_rgba(38,189,226,0.25)]">
              <div className="text-white text-center">
                <p className="text-[10px] uppercase tracking-[0.18em] opacity-80">SDG</p>
                <p className="text-5xl font-bold leading-none mt-1">06</p>
              </div>
            </div>
          </div>

          <div>
            <Reveal>
              <p className="text-[11px] tracking-[0.35em] uppercase text-[#26BDE2] mb-3">
                Nations Unies · Objectif 6
              </p>
            </Reveal>
            <Reveal delay={100}>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-[#1d1d1f] leading-tight">
                Eau propre et assainissement,
                <br />
                <span className="text-[#86868b]">pour tous, d’ici 2030.</span>
              </h2>
            </Reveal>
            <Reveal delay={250}>
              <p className="mt-6 text-base md:text-lg text-[#6e6e73] leading-relaxed max-w-2xl">
                L’objectif de développement durable n°6 vise un accès universel et
                équitable à l’eau potable d’ici 2030. En Mauritanie, le rythme
                actuel ne permet pas d’y parvenir.{' '}
                <span className="text-[#1d1d1f] font-medium">
                  MINAI s’inscrit dans cet effort
                </span>
                {' '}en rendant visibles les zones où l’accélération est la plus
                nécessaire, et en mettant à disposition des décideurs publics une
                lecture commune du territoire.
              </p>
            </Reveal>
            <Reveal delay={400}>
              <button
                onClick={onUnderstand}
                className="mt-6 text-sm text-cyan-700 hover:text-cyan-900 transition inline-flex items-center gap-1.5 font-medium"
              >
                Comprendre l’enjeu en détail{' '}
                <span aria-hidden>→</span>
              </button>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COLLABORATION — initiative ouverte aux acteurs de l'eau
// ─────────────────────────────────────────────────────────────────────────────

function CollaborationSection({ onEnter }: { onEnter: () => void }) {
  return (
    <section id="collaboration" className="bg-white px-6 py-32 md:py-40 border-t border-black/5">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        <div>
          <Reveal>
            <p className="text-[11px] tracking-[0.35em] uppercase text-cyan-700 mb-6">
              Collaboration
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
              Une initiative ouverte
              <br />
              <span className="text-[#86868b]">aux acteurs de l’eau.</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-8 text-lg md:text-xl text-[#1d1d1f] max-w-xl leading-relaxed">
              MINAI est conçue pour être partagée. Toute organisation engagée
              dans l’accès à l’eau potable — ONG, institution publique, agence
              internationale — peut s’en saisir, contribuer ou en demander
              l’adaptation à son contexte d’intervention.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <p className="mt-6 text-base md:text-lg text-[#6e6e73] max-w-xl leading-relaxed">
              L’initiative travaille avec ses partenaires pour :
            </p>
          </Reveal>

          <div className="mt-8 grid gap-3 max-w-md">
            <Reveal delay={350}><Bullet text="Identifier les priorités d’intervention" /></Reveal>
            <Reveal delay={450}><Bullet text="Optimiser l’allocation des ressources" /></Reveal>
            <Reveal delay={550}><Bullet text="Renforcer l’impact des actions terrain" /></Reveal>
          </div>

          <Reveal delay={650}>
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <button
                onClick={onEnter}
                className="bg-[#1d1d1f] text-white px-7 py-3 rounded-full font-medium hover:bg-black transition text-center"
              >
                Visualiser les zones prioritaires
              </button>
              <a
                href="mailto:imaneahmedou1@gmail.com?subject=Collaboration%20MINAI"
                className="border border-[#1d1d1f]/20 text-[#1d1d1f] px-7 py-3 rounded-full font-medium hover:bg-[#1d1d1f]/[0.04] transition text-center"
              >
                Contacter l’initiative
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal delay={300}>
          <div className="relative rounded-3xl overflow-hidden aspect-square bg-slate-100">
            <img
              src={IMG.women_carrying}
              alt="Femmes transportant de l'eau sur la tête"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Bullet({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-700 shrink-0" />
      <p className="text-[#1d1d1f] leading-relaxed">{text}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGNATURE / FOOTER
// ─────────────────────────────────────────────────────────────────────────────

function Signature() {
  return (
    <footer className="px-6 py-24 bg-[#fafafa] border-t border-black/5">
      <Reveal>
        <p className="max-w-4xl mx-auto text-center text-2xl md:text-4xl font-light tracking-tight leading-snug text-[#1d1d1f]">
          MINAI <span className="text-[#86868b]">—</span>{' '}
          <span className="bg-gradient-to-r from-cyan-700 to-cyan-500 bg-clip-text text-transparent">
            making the invisible visible again.
          </span>
        </p>
      </Reveal>
      <div className="mt-12 flex flex-col sm:flex-row justify-between items-center gap-3 max-w-7xl mx-auto text-[11px] text-[#86868b]">
        <span>Nouakchott, Mauritanie · © 2026 MINAI</span>
        <span>
          Aligned with UN SDG 6 · Sources : ANSADE · UNICEF · World Bank · OpenStreetMap
        </span>
      </div>
    </footer>
  )
}
