import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  onEnter: () => void
}

/**
 * Landing page MINAI — version blanche.
 * Inspirations : Apple (typo monumentale, beaucoup d'air, blanc pur),
 * Charity:Water (humain, photos), Our World in Data (chiffres propres).
 *
 * Photos : Pexels — free for commercial use, attribution non requise.
 *   ‣ 30441483  Şeyhmus Kino — woman carrying jerrycan
 *   ‣ 30629420  Jonathan John — smiling woman fetching water
 *   ‣ 35328689  Sahara aerial
 *   ‣ 4511301   women carrying water on heads
 *   ‣ 19163045  woman carrying load on head
 */

// URLs Pexels en CDN (auto-compressées, large)
const IMG = {
  woman_jerrycan: 'https://images.pexels.com/photos/30441483/pexels-photo-30441483.jpeg?auto=compress&cs=tinysrgb&w=2000',
  smiling_water:  'https://images.pexels.com/photos/30629420/pexels-photo-30629420.jpeg?auto=compress&cs=tinysrgb&w=2000',
  sahara_aerial:  'https://images.pexels.com/photos/35328689/pexels-photo-35328689.jpeg?auto=compress&cs=tinysrgb&w=2000',
  women_carrying: 'https://images.pexels.com/photos/4511301/pexels-photo-4511301.jpeg?auto=compress&cs=tinysrgb&w=2000',
  load_head:      'https://images.pexels.com/photos/19163045/pexels-photo-19163045.jpeg?auto=compress&cs=tinysrgb&w=2000',
}

export default function LandingPage({ onEnter }: Props) {
  return (
    <div className="bg-white text-[#1d1d1f] overflow-x-hidden font-sans antialiased">
      <Nav onEnter={onEnter} />
      <Hero onEnter={onEnter} />
      <HeroImage />
      <IntroStatement />
      <ProblemSection />
      <HumanImpactSection />
      <SolutionSection />
      <DataSection />
      <PartnerSection />
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

function Nav({ onEnter }: { onEnter: () => void }) {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-white/75 border-b border-black/5">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <span className="font-semibold tracking-tight text-[15px] text-[#1d1d1f]">
          MINAI<span className="text-cyan-600">.</span>
        </span>
        <div className="hidden md:flex items-center gap-8 text-[13px] text-[#6e6e73]">
          <a href="#problem"  className="hover:text-[#1d1d1f] transition">Problème</a>
          <a href="#solution" className="hover:text-[#1d1d1f] transition">Solution</a>
          <a href="#data"     className="hover:text-[#1d1d1f] transition">Données</a>
          <a href="#partner"  className="hover:text-[#1d1d1f] transition">Partenaires</a>
        </div>
        <button
          onClick={onEnter}
          className="text-[13px] bg-[#1d1d1f] text-white px-4 py-1.5 rounded-full font-medium hover:bg-black transition"
        >
          Explorer la carte →
        </button>
      </div>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO — texte sur blanc
// ─────────────────────────────────────────────────────────────────────────────

function Hero({ onEnter }: { onEnter: () => void }) {
  return (
    <section className="relative pt-32 md:pt-40 pb-16 md:pb-20 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <Reveal>
          <p className="text-[11px] tracking-[0.35em] uppercase text-cyan-700 mb-7">
            MINAI · Mauritanie
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

        <Reveal delay={350}>
          <p className="mt-9 text-base md:text-xl text-[#6e6e73] max-w-2xl mx-auto leading-relaxed">
            MINAI est une intelligence géospatiale appliquée à l’accès à l’eau,
            conçue pour révéler les communautés aujourd’hui invisibles dans les
            systèmes de décision.
          </p>
        </Reveal>

        <Reveal delay={550}>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onEnter}
              className="bg-[#1d1d1f] text-white px-7 py-3 rounded-full font-medium hover:bg-black transition"
            >
              Explore the map
            </button>
            <a
              href="#partner"
              className="border border-[#1d1d1f]/20 text-[#1d1d1f] px-7 py-3 rounded-full font-medium hover:bg-[#1d1d1f]/[0.04] transition text-center"
            >
              Partner with MINAI
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// Photo full-bleed sous le hero — woman carrying jerrycan
function HeroImage() {
  return (
    <div className="px-4 sm:px-6 mb-24">
      <Reveal>
        <div className="relative max-w-7xl mx-auto rounded-3xl overflow-hidden aspect-[16/9] sm:aspect-[21/9] bg-slate-100">
          <img
            src={IMG.woman_jerrycan}
            alt="Femme transportant un jerrycan d’eau dans un village rural d’Afrique"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
          {/* léger fade en bas pour fondre vers le contenu suivant */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent pointer-events-none" />
        </div>
      </Reveal>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INTRO STATEMENT — phrase calme, beaucoup d'air
// ─────────────────────────────────────────────────────────────────────────────

function IntroStatement() {
  return (
    <section className="px-6 py-32 md:py-44">
      <Reveal>
        <p className="max-w-4xl mx-auto text-2xl md:text-4xl font-light leading-snug tracking-tight text-[#1d1d1f] text-center">
          En Mauritanie, des milliers de familles vivent sans accès fiable à l’eau potable —{' '}
          <span className="text-[#86868b]">non pas parce que les solutions n’existent pas,</span>{' '}
          mais parce que{' '}
          <span className="text-[#86868b]">leur réalité reste invisible dans les données.</span>
        </p>
      </Reveal>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROBLEM
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
            L’accès à l’eau n’est pas qu’une question de ressources.
            <br />
            <span className="text-[#86868b]">C’est une question de visibilité.</span>
          </h2>
        </Reveal>

        <div className="mt-20 grid md:grid-cols-3 gap-12">
          <Reveal delay={150}>
            <Pillar
              n="01"
              title="Données fragmentées"
              body="Les sources existent — ONS, UNICEF, OpenStreetMap, ONG locales — mais ne se parlent pas."
            />
          </Reveal>
          <Reveal delay={250}>
            <Pillar
              n="02"
              title="Zones rurales non cartographiées"
              body="Une grande partie du territoire mauritanien échappe aux relevés systématiques d’accès à l’eau."
            />
          </Reveal>
          <Reveal delay={350}>
            <Pillar
              n="03"
              title="Décisions sans priorisation"
              body="Les interventions arrivent là où l’on regarde — pas toujours là où c’est le plus urgent."
            />
          </Reveal>
        </div>

        <Reveal delay={500}>
          <p className="mt-24 text-2xl md:text-4xl font-light text-center text-[#1d1d1f] max-w-3xl mx-auto leading-snug">
            Résultat : des communautés entières restent ignorées.
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
// HUMAN IMPACT — full-bleed photo + texte en overlay
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
          {/* Overlay sombre dégradé pour la lisibilité du texte */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

          {/* Texte aligné en bas-gauche */}
          <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-12 md:p-16 text-white">
            <Reveal>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-tight leading-[1.08] max-w-3xl">
                Derrière chaque point invisible,
                <br />
                <span className="text-white/70">il y a une réalité.</span>
              </h2>
            </Reveal>

            <div className="mt-6 sm:mt-8 space-y-2 sm:space-y-3 max-w-2xl text-base sm:text-lg md:text-xl font-light text-white/90 leading-relaxed">
              <Reveal delay={150}>
                <p>Des femmes qui marchent des heures pour un seau d’eau.</p>
              </Reveal>
              <Reveal delay={250}>
                <p>Des enfants qui quittent l’école pour aller au puits.</p>
              </Reveal>
              <Reveal delay={350}>
                <p>Des villages qui attendent une intervention qui ne vient pas.</p>
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
// SOLUTION
// ─────────────────────────────────────────────────────────────────────────────

function SolutionSection() {
  return (
    <section id="solution" className="bg-[#fafafa] px-6 py-32 md:py-40">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <p className="text-[11px] tracking-[0.35em] uppercase text-cyan-700 mb-6">
            La solution
          </p>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] max-w-3xl text-[#1d1d1f]">
            MINAI transforme des données fragmentées
            <br />
            <span className="text-[#86868b]">en décisions claires.</span>
          </h2>
        </Reveal>

        <div className="mt-20 grid md:grid-cols-3 gap-px bg-black/[0.06] rounded-3xl overflow-hidden border border-black/5">
          <Reveal delay={150}>
            <Feature
              icon={<TargetIcon />}
              title="Identifier les zones à risque"
              body="Croisement des données démographiques officielles (RGPH 2013) et de l’infrastructure existante (OSM)."
            />
          </Reveal>
          <Reveal delay={250}>
            <Feature
              icon={<PinIcon />}
              title="Prioriser les interventions"
              body="Score d’accès calculé en temps réel selon la norme humanitaire Sphere : 1 point d’eau pour 500 personnes."
            />
          </Reveal>
          <Reveal delay={350}>
            <Feature
              icon={<HandshakeIcon />}
              title="Mieux allouer les ressources"
              body="Une carte commune pour les ONG, les institutions et les décideurs locaux."
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

function Feature({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
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
// DATA — chiffres compacts (600K), photo Sahara à gauche
// ─────────────────────────────────────────────────────────────────────────────

function DataSection() {
  return (
    <section id="data" className="bg-white px-6 py-32 md:py-40">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <p className="text-[11px] tracking-[0.35em] uppercase text-cyan-700 mb-6 text-center">
            Aujourd’hui en Mauritanie
          </p>
        </Reveal>
        <div className="mt-12 grid md:grid-cols-3 gap-16 md:gap-8">
          <Reveal delay={100}>
            <Stat n="600K" label="personnes en zone à risque" sub="Wilayas critiques au sud" />
          </Reveal>
          <Reveal delay={250}>
            <Stat n="200+" label="villages prioritaires" sub="Densité OSM < cible Sphere" />
          </Reveal>
          <Reveal delay={400}>
            <Stat n="3" label="régions pilotes" sub="Gorgol · Brakna · Guidimakha" />
          </Reveal>
        </div>
        <Reveal delay={600}>
          <p className="mt-20 text-center text-[#86868b] text-xs">
            Sources : Office National de la Statistique (RGPH 2013) · UNICEF · World Bank · OpenStreetMap.
          </p>
        </Reveal>

        {/* Photo de contexte — Sahara aérien */}
        <Reveal delay={300}>
          <div className="mt-24 relative rounded-3xl overflow-hidden aspect-[21/9] bg-slate-100">
            <img
              src={IMG.sahara_aerial}
              alt="Vue aérienne du désert du Sahara"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Stat({ n, label, sub }: { n: string; label: string; sub: string }) {
  return (
    <div className="text-center">
      <div className="text-7xl md:text-9xl font-semibold tracking-tight text-[#1d1d1f] leading-none">
        {n}
      </div>
      <p className="mt-4 text-[#1d1d1f] text-base font-medium">{label}</p>
      <p className="mt-1 text-[#86868b] text-xs tracking-wide">{sub}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTNER — fond gris clair, image à droite, texte à gauche
// ─────────────────────────────────────────────────────────────────────────────

function PartnerSection() {
  return (
    <section id="partner" className="bg-[#fafafa] px-6 py-32 md:py-40">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        <div>
          <Reveal>
            <p className="text-[11px] tracking-[0.35em] uppercase text-cyan-700 mb-6">
              Collaborer
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
              Partner with MINAI.
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-8 text-base md:text-xl text-[#6e6e73] max-w-xl leading-relaxed">
              Nous collaborons avec les ONG et les institutions pour rendre l’accès à l’eau
              plus rapide, plus équitable et plus efficace.
            </p>
          </Reveal>

          <div className="mt-10 grid sm:grid-cols-1 gap-3 max-w-md">
            <Reveal delay={250}><Bullet text="Identifier les priorités" /></Reveal>
            <Reveal delay={350}><Bullet text="Optimiser les interventions" /></Reveal>
            <Reveal delay={450}><Bullet text="Renforcer l’impact terrain" /></Reveal>
          </div>

          <Reveal delay={550}>
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <a
                href="mailto:imaneahmedou1@gmail.com?subject=Demo%20MINAI"
                className="bg-[#1d1d1f] text-white px-7 py-3 rounded-full font-medium hover:bg-black transition text-center"
              >
                Request a demo
              </a>
              <a
                href="mailto:imaneahmedou1@gmail.com?subject=Collaboration%20MINAI"
                className="border border-[#1d1d1f]/20 text-[#1d1d1f] px-7 py-3 rounded-full font-medium hover:bg-[#1d1d1f]/[0.04] transition text-center"
              >
                Collaborate with us
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
    <footer className="px-6 py-24 bg-white border-t border-black/5">
      <Reveal>
        <p className="max-w-4xl mx-auto text-center text-2xl md:text-4xl font-light tracking-tight leading-snug text-[#1d1d1f]">
          MINAI <span className="text-[#86868b]">—</span>{' '}
          <span className="bg-gradient-to-r from-cyan-700 to-cyan-500 bg-clip-text text-transparent">
            making the invisible visible again.
          </span>
        </p>
      </Reveal>
      <div className="mt-12 flex flex-col sm:flex-row justify-between items-center gap-3 max-w-7xl mx-auto text-[11px] text-[#86868b]">
        <span>© 2026 MINAI · Nouakchott, Mauritanie</span>
        <span>Données ouvertes · ONS · UNICEF · OpenStreetMap · Photos : Pexels</span>
      </div>
    </footer>
  )
}
