import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  onEnter: () => void
}

/**
 * Landing page MINAI — narrative + emotional + institutional.
 * Inspirations : Apple (typo monumentale, dark, beaucoup d'air),
 * Charity:Water (humain), Our World in Data (chiffres propres).
 */
export default function LandingPage({ onEnter }: Props) {
  return (
    <div className="bg-[#05080f] text-white overflow-x-hidden font-sans antialiased">
      {/* ---- keyframes locales (rise + breathe) ---- */}
      <style>{`
        @keyframes rise {
          0%   { transform: translateY(0)        scale(0.6); opacity: 0; }
          15%  {                                              opacity: 0.55; }
          85%  {                                              opacity: 0.55; }
          100% { transform: translateY(-110vh)   scale(1.1); opacity: 0; }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1);    opacity: 0.55; }
          50%      { transform: scale(1.18); opacity: 1; }
        }
        .rise   { animation: rise 18s linear infinite; }
        .breathe{ animation: breathe 6s ease-in-out infinite; }
      `}</style>

      <Nav onEnter={onEnter} />
      <Hero onEnter={onEnter} />
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
// Reveal-on-scroll helper
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
    <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-[#05080f]/70 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <span className="font-semibold tracking-tight text-[15px]">
          MINAI<span className="text-cyan-300/80">.</span>
        </span>
        <div className="hidden md:flex items-center gap-8 text-[13px] text-white/55">
          <a href="#problem" className="hover:text-white transition">Problème</a>
          <a href="#solution" className="hover:text-white transition">Solution</a>
          <a href="#data" className="hover:text-white transition">Données</a>
          <a href="#partner" className="hover:text-white transition">Partenaires</a>
        </div>
        <button
          onClick={onEnter}
          className="text-[13px] bg-white text-slate-900 px-4 py-1.5 rounded-full font-medium hover:bg-white/90 transition"
        >
          Explorer la carte →
        </button>
      </div>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────

function Hero({ onEnter }: { onEnter: () => void }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-14 overflow-hidden">
      {/* Atmosphère : dégradés + gouttes qui montent */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#08111f] to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.20),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(14,165,233,0.10),transparent_55%)]" />
        <RisingDroplets />
      </div>

      <Reveal>
        <p className="text-[11px] tracking-[0.35em] uppercase text-cyan-300/70 mb-7">
          MINAI · Mauritanie
        </p>
      </Reveal>

      <Reveal delay={150}>
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-semibold tracking-tight leading-[1.03] text-center max-w-5xl">
          Making the invisible
          <br />
          <span className="bg-gradient-to-b from-white to-white/55 bg-clip-text text-transparent">
            visible again.
          </span>
        </h1>
      </Reveal>

      <Reveal delay={350}>
        <p className="mt-9 text-base md:text-xl text-white/65 max-w-2xl text-center leading-relaxed">
          MINAI est une intelligence géospatiale appliquée à l’accès à l’eau,
          conçue pour révéler les communautés aujourd’hui invisibles dans les
          systèmes de décision.
        </p>
      </Reveal>

      <Reveal delay={550}>
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onEnter}
            className="bg-white text-slate-900 px-7 py-3 rounded-full font-medium hover:bg-white/90 transition"
          >
            Explore the map
          </button>
          <a
            href="#partner"
            className="border border-white/25 text-white px-7 py-3 rounded-full font-medium hover:border-white/60 hover:bg-white/5 transition text-center"
          >
            Partner with MINAI
          </a>
        </div>
      </Reveal>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-[10px] tracking-[0.4em] uppercase flex flex-col items-center gap-2">
        <span>Scroll</span>
        <span className="block h-8 w-px bg-gradient-to-b from-white/30 to-transparent" />
      </div>
    </section>
  )
}

// 12 gouttes qui s'élèvent doucement, vitesse et taille variées
function RisingDroplets() {
  const drops = Array.from({ length: 14 }, (_, i) => ({
    left: `${(i * 137) % 100}%`,
    size: 4 + ((i * 7) % 12),
    delay: -((i * 1.7) % 18),
    duration: 14 + ((i * 5) % 12),
    blur: i % 3 === 0,
  }))
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {drops.map((d, i) => (
        <span
          key={i}
          className={`rise absolute rounded-full bg-cyan-300/25 ${d.blur ? 'blur-[2px]' : ''}`}
          style={{
            left: d.left,
            bottom: '-30px',
            width: d.size,
            height: d.size,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INTRO STATEMENT — large, calme, une phrase
// ─────────────────────────────────────────────────────────────────────────────

function IntroStatement() {
  return (
    <section className="px-6 py-32 md:py-48">
      <Reveal>
        <p className="max-w-4xl mx-auto text-2xl md:text-4xl font-light leading-snug tracking-tight text-white/80 text-center">
          En Mauritanie, des milliers de familles vivent sans accès fiable à l’eau potable —{' '}
          <span className="text-white">non pas parce que les solutions n’existent pas,</span>{' '}
          mais parce que{' '}
          <span className="text-white">leur réalité reste invisible dans les données.</span>
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
    <section
      id="problem"
      className="px-6 py-32 md:py-40 border-t border-white/5"
    >
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <p className="text-[11px] tracking-[0.35em] uppercase text-cyan-300/70 mb-6">
            Le problème
          </p>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] max-w-3xl">
            L’accès à l’eau n’est pas qu’une question de ressources.
            <br />
            <span className="text-white/45">C’est une question de visibilité.</span>
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
          <p className="mt-24 text-2xl md:text-4xl font-light text-center text-white/75 max-w-3xl mx-auto leading-snug">
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
      <span className="text-[11px] text-cyan-300/60 font-mono">{n}</span>
      <h3 className="mt-3 text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-3 text-white/55 leading-relaxed text-[15px]">{body}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HUMAN IMPACT — section émotion, fond chaud (terre / désert)
// ─────────────────────────────────────────────────────────────────────────────

function HumanImpactSection() {
  return (
    <section className="relative px-6 py-32 md:py-48 border-t border-white/5 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 via-[#0a0e1a] to-[#05080f]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_50%,rgba(245,158,11,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(217,119,6,0.06),transparent_55%)]" />
      </div>

      <div className="max-w-5xl mx-auto">
        <Reveal>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] max-w-3xl">
            Derrière chaque point invisible,
            <br />
            <span className="text-white/45">il y a une réalité.</span>
          </h2>
        </Reveal>

        <div className="mt-16 space-y-6 max-w-2xl text-xl md:text-2xl font-light text-white/75 leading-relaxed">
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

        <Reveal delay={550}>
          <p className="mt-24 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1] max-w-3xl">
            Ce qui n’est pas visible
            <br />
            <span className="bg-gradient-to-r from-cyan-300 to-cyan-200 bg-clip-text text-transparent">
              ne peut pas être servi.
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SOLUTION
// ─────────────────────────────────────────────────────────────────────────────

function SolutionSection() {
  return (
    <section
      id="solution"
      className="px-6 py-32 md:py-40 border-t border-white/5"
    >
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <p className="text-[11px] tracking-[0.35em] uppercase text-cyan-300/70 mb-6">
            La solution
          </p>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] max-w-3xl">
            MINAI transforme des données fragmentées
            <br />
            <span className="text-white/45">en décisions claires.</span>
          </h2>
        </Reveal>

        <div className="mt-20 grid md:grid-cols-3 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/5">
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
          <p className="mt-24 text-3xl md:text-5xl font-semibold tracking-tight text-center bg-gradient-to-r from-cyan-200 to-cyan-400 bg-clip-text text-transparent">
            De la donnée à l’action.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function Feature({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="bg-[#05080f] p-10 h-full">
      <div className="text-cyan-300 mb-5">{icon}</div>
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-3 text-white/55 leading-relaxed text-[15px]">{body}</p>
    </div>
  )
}

// Petits SVG d'icônes — line-art Apple-style, très sobres
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
// DATA — Our World in Data style
// ─────────────────────────────────────────────────────────────────────────────

function DataSection() {
  return (
    <section
      id="data"
      className="px-6 py-32 md:py-40 border-t border-white/5"
    >
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <p className="text-[11px] tracking-[0.35em] uppercase text-cyan-300/70 mb-6 text-center">
            Aujourd’hui en Mauritanie
          </p>
        </Reveal>
        <div className="mt-12 grid md:grid-cols-3 gap-16 md:gap-8">
          <Reveal delay={100}>
            <Stat n="600 000+" label="personnes en zone à risque" sub="Wilayas critiques au sud" />
          </Reveal>
          <Reveal delay={250}>
            <Stat n="200+" label="villages prioritaires identifiés" sub="Densité OSM < cible Sphere" />
          </Reveal>
          <Reveal delay={400}>
            <Stat n="3" label="régions pilotes en analyse" sub="Gorgol · Brakna · Guidimakha" />
          </Reveal>
        </div>
        <Reveal delay={600}>
          <p className="mt-20 text-center text-white/40 text-xs">
            Sources : Office National de la Statistique (RGPH 2013) · UNICEF · World Bank · OpenStreetMap.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function Stat({ n, label, sub }: { n: string; label: string; sub: string }) {
  return (
    <div className="text-center">
      <div className="text-6xl md:text-8xl font-semibold tracking-tight bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent leading-none">
        {n}
      </div>
      <p className="mt-4 text-white/75 text-base">{label}</p>
      <p className="mt-1 text-white/35 text-xs tracking-wide">{sub}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTNER
// ─────────────────────────────────────────────────────────────────────────────

function PartnerSection() {
  return (
    <section
      id="partner"
      className="relative px-6 py-32 md:py-48 border-t border-white/5 overflow-hidden"
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.10),transparent_55%)]" />
      </div>

      <div className="max-w-4xl mx-auto text-center">
        <Reveal>
          <p className="text-[11px] tracking-[0.35em] uppercase text-cyan-300/70 mb-6">
            Collaborer
          </p>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
            Partner with MINAI.
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <p className="mt-8 text-base md:text-xl text-white/65 max-w-2xl mx-auto leading-relaxed">
            Nous collaborons avec les ONG et les institutions pour rendre l’accès à l’eau plus
            rapide, plus équitable et plus efficace.
          </p>
        </Reveal>

        <div className="mt-14 grid sm:grid-cols-3 gap-8 text-left max-w-3xl mx-auto">
          <Reveal delay={150}>
            <Bullet text="Identifier les priorités" />
          </Reveal>
          <Reveal delay={250}>
            <Bullet text="Optimiser les interventions" />
          </Reveal>
          <Reveal delay={350}>
            <Bullet text="Renforcer l’impact terrain" />
          </Reveal>
        </div>

        <Reveal delay={500}>
          <div className="mt-14 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:imaneahmedou1@gmail.com?subject=Demo%20MINAI"
              className="bg-white text-slate-900 px-7 py-3 rounded-full font-medium hover:bg-white/90 transition"
            >
              Request a demo
            </a>
            <a
              href="mailto:imaneahmedou1@gmail.com?subject=Collaboration%20MINAI"
              className="border border-white/25 text-white px-7 py-3 rounded-full font-medium hover:border-white/60 hover:bg-white/5 transition"
            >
              Collaborate with us
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Bullet({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-300 shrink-0" />
      <p className="text-white/80 leading-relaxed">{text}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGNATURE
// ─────────────────────────────────────────────────────────────────────────────

function Signature() {
  return (
    <footer className="px-6 py-24 border-t border-white/5">
      <Reveal>
        <p className="max-w-4xl mx-auto text-center text-2xl md:text-4xl font-light tracking-tight text-white/85 leading-snug">
          MINAI <span className="text-white/30">—</span>{' '}
          <span className="bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
            making the invisible visible again.
          </span>
        </p>
      </Reveal>
      <div className="mt-12 flex flex-col sm:flex-row justify-between items-center gap-3 max-w-7xl mx-auto text-[11px] text-white/35">
        <span>© 2026 MINAI · Nouakchott, Mauritanie</span>
        <span>Données ouvertes · ONS · UNICEF · OpenStreetMap</span>
      </div>
    </footer>
  )
}
