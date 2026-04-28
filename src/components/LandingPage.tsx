import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  onEnter: () => void
}

/**
 * Landing page MINAI — version blanche v5.
 * Apple ⨯ Charity:Water ⨯ Our World in Data.
 *
 * Photos : Pexels — free for commercial use, attribution non requise.
 *   ‣ 30441483  Şeyhmus Kino     — woman carrying jerrycan (hero)
 *   ‣ 30629420  Jonathan John    — smiling woman fetching water (human impact)
 *   ‣ 4511301   ?                — women carrying water on heads (partner)
 *   ‣ 30441497  Şeyhmus Kino     — rural African woman with water jugs
 *   ‣ 7165327   Jep Gambardella  — close-up boy drinking water
 *   ‣ 11759837  Swastik Arora    — boy using manual water pump
 */

const IMG = {
  woman_jerrycan:    'https://images.pexels.com/photos/30441483/pexels-photo-30441483.jpeg?auto=compress&cs=tinysrgb&w=2000',
  smiling_water:     'https://images.pexels.com/photos/30629420/pexels-photo-30629420.jpeg?auto=compress&cs=tinysrgb&w=2000',
  women_carrying:    'https://images.pexels.com/photos/4511301/pexels-photo-4511301.jpeg?auto=compress&cs=tinysrgb&w=2000',
  woman_water_jugs:  'https://images.pexels.com/photos/30441497/pexels-photo-30441497.jpeg?auto=compress&cs=tinysrgb&w=1400',
  child_drinking:    'https://images.pexels.com/photos/7165327/pexels-photo-7165327.jpeg?auto=compress&cs=tinysrgb&w=1400',
  boy_pump:          'https://images.pexels.com/photos/11759837/pexels-photo-11759837.jpeg?auto=compress&cs=tinysrgb&w=1400',
}

export default function LandingPage({ onEnter }: Props) {
  return (
    <div className="bg-white text-[#1d1d1f] overflow-x-hidden font-sans antialiased">
      <Nav onEnter={onEnter} />
      <Hero onEnter={onEnter} />
      <HeroImage />
      <ProblemSection />
      <PainPointGallery />
      <HumanImpactSection />
      <SolutionSection />
      <SDG6Section />
      <ByTheNumbersSection />
      <FounderSection />
      <PartnerSection onEnter={onEnter} />
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
          <a href="#impact"   className="hover:text-[#1d1d1f] transition">Impact</a>
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
// HERO — court, clair, lisible en 5 secondes
// ─────────────────────────────────────────────────────────────────────────────

function Hero({ onEnter }: { onEnter: () => void }) {
  return (
    <section className="relative pt-32 md:pt-40 pb-16 md:pb-20 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <Reveal>
          <p className="text-[11px] tracking-[0.35em] uppercase text-cyan-700 mb-7">
            Geospatial intelligence · Mauritanie
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
            MINAI aide les ONG et les institutions à identifier où l’accès à l’eau
            est le plus critique en Mauritanie — et à prioriser leurs interventions.
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
            <span className="text-[#86868b]">· ANSADE · UNICEF · World Bank</span>
          </a>
        </Reveal>

        <Reveal delay={600}>
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
// PROBLEM — ouvre par une histoire ancrée, conclut par les 3 piliers
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

        {/* Phrase de transition (ex-TransitionStatement) intégrée ici */}
        <Reveal delay={100}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] max-w-3xl">
            Ce n’est pas un manque de ressources.
            <br />
            <span className="text-[#86868b]">C’est un manque de visibilité.</span>
          </h2>
        </Reveal>

        {/* Anchor humain — conservateur sur les chiffres pour rester défendable */}
        <Reveal delay={250}>
          <p className="mt-12 max-w-3xl text-lg md:text-xl text-[#1d1d1f] leading-relaxed border-l-2 border-cyan-700 pl-6">
            Dans le sud rural mauritanien, certains villages sont à plus de cinq
            kilomètres du point d’eau le plus proche. Sur les cartes officielles,
            ils n’apparaissent pas toujours comme prioritaires.{' '}
            <span className="text-[#86868b]">
              Ce que les systèmes de décision ne voient pas, ils ne peuvent pas servir.
            </span>
          </p>
        </Reveal>

        <div className="mt-20 grid md:grid-cols-3 gap-12">
          <Reveal delay={150}>
            <Pillar
              n="01"
              title="Données fragmentées"
              body="Les informations existent — UNICEF, ANSADE, OpenStreetMap, ONG — mais restent dispersées et difficilement exploitables."
            />
          </Reveal>
          <Reveal delay={250}>
            <Pillar
              n="02"
              title="Territoires invisibles"
              body="Une grande partie des zones rurales n’est pas correctement cartographiée dans les systèmes d’aide à la décision."
            />
          </Reveal>
          <Reveal delay={350}>
            <Pillar
              n="03"
              title="Interventions non priorisées"
              body="Les ressources sont mobilisées là où les données sont visibles — pas nécessairement là où les besoins sont les plus critiques."
            />
          </Reveal>
        </div>

        <Reveal delay={500}>
          <p className="mt-24 text-2xl md:text-4xl font-light text-center text-[#1d1d1f] max-w-3xl mx-auto leading-snug">
            Les données existent.{' '}
            <span className="text-[#86868b]">Mais elles ne deviennent pas des décisions.</span>
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
// PAIN POINT GALLERY — 3 photos (réduit de 4 à 3 pour plus d'impact)
// ─────────────────────────────────────────────────────────────────────────────

function PainPointGallery() {
  const items = [
    { src: IMG.woman_water_jugs, alt: "Femme rurale transportant des bidons d'eau",
      caption: 'Marche quotidienne pour l’eau' },
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
            La réalité, en images
          </p>
        </Reveal>
        <Reveal delay={100}>
          <h3 className="text-center text-3xl md:text-5xl font-semibold tracking-tight text-[#1d1d1f] max-w-3xl mx-auto leading-tight">
            Voici ce que les chiffres ne disent pas.
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
// HUMAN IMPACT
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
// SOLUTION — How it works (3 étapes concrètes) + closing
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
            MINAI n’est pas un outil de data.
            <br />
            <span className="bg-gradient-to-r from-cyan-700 to-cyan-500 bg-clip-text text-transparent">
              C’est un système de priorisation.
            </span>
          </h2>
        </Reveal>
        <Reveal delay={250}>
          <p className="mt-10 text-xl md:text-2xl text-[#1d1d1f] max-w-2xl leading-snug">
            Nous ne collectons pas plus de données.
            <br />
            <span className="text-[#86868b]">Nous rendons les données utilisables.</span>
          </p>
        </Reveal>

        {/* How it works — 3 étapes concrètes pour ONG / institutions */}
        <div className="mt-24">
          <Reveal>
            <p className="text-[11px] tracking-[0.18em] uppercase text-[#86868b] mb-12">
              Comment ça marche
            </p>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            <Reveal delay={150}>
              <Step
                n="01"
                title="Vous nous donnez votre périmètre"
                body="Région, type d'intervention, contraintes budgétaires. Une réunion de cadrage suffit."
              />
            </Reveal>
            <Reveal delay={300}>
              <Step
                n="02"
                title="Nous calculons les priorités"
                body="Score d'accès par village croisé avec votre périmètre, basé sur la norme humanitaire Sphere."
              />
            </Reveal>
            <Reveal delay={450}>
              <Step
                n="03"
                title="Vous recevez une carte décisionnelle"
                body="Top villages classés, justification chiffrée, format partageable avec vos équipes terrain."
              />
            </Reveal>
          </div>
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

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-cyan-700 font-mono text-sm">{n}</span>
        <span className="h-px flex-1 bg-cyan-700/30" />
      </div>
      <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-[#1d1d1f] leading-tight">
        {title}
      </h3>
      <p className="mt-4 text-[#6e6e73] leading-relaxed text-[15px]">{body}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SDG 6 — alignement court avec l'ODD 6 des Nations Unies
// ─────────────────────────────────────────────────────────────────────────────

function SDG6Section() {
  return (
    <section className="bg-white px-6 py-24 md:py-32 border-t border-black/5">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-10 md:gap-14">
        {/* Badge inspiré de l'ODD 6 — couleur officielle #26BDE2 */}
        <div className="shrink-0">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-[#26BDE2] flex items-center justify-center shadow-[0_8px_30px_rgba(38,189,226,0.25)]">
            <div className="text-white text-center">
              <p className="text-[10px] uppercase tracking-[0.18em] opacity-80">SDG</p>
              <p className="text-4xl md:text-5xl font-bold leading-none mt-1">06</p>
            </div>
          </div>
        </div>

        <div>
          <Reveal>
            <p className="text-[11px] tracking-[0.35em] uppercase text-[#26BDE2] mb-3">
              United Nations · Goal 6
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-[#1d1d1f] leading-tight">
              Clean Water &amp; Sanitation pour tous d’ici 2030.
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-5 text-base md:text-lg text-[#6e6e73] leading-relaxed max-w-xl">
              L’objectif 6.1 des Nations Unies vise un accès universel et équitable à
              l’eau potable d’ici 2030. En Mauritanie, le rythme actuel ne suffit
              pas. <span className="text-[#1d1d1f] font-medium">MINAI accélère la priorisation</span> pour
              que les interventions atteignent les zones qui en ont le plus besoin.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BY THE NUMBERS — fusion Impact + Institutions, 3 cards cliquables
// ─────────────────────────────────────────────────────────────────────────────

function ByTheNumbersSection() {
  return (
    <section id="impact" className="bg-[#fafafa] px-6 py-32 md:py-40">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <p className="text-[11px] tracking-[0.35em] uppercase text-cyan-700 mb-6 text-center">
            Aujourd’hui en Mauritanie
          </p>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="text-center text-3xl md:text-5xl font-semibold tracking-tight text-[#1d1d1f] max-w-3xl mx-auto leading-tight">
            Trois chiffres. Trois institutions.
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
              href="https://washdata.org/data/country/MRT/water/overview"
            />
          </Reveal>
        </div>

        <Reveal delay={550}>
          <p className="mt-20 max-w-3xl mx-auto text-center text-2xl md:text-3xl font-light tracking-tight leading-snug text-[#1d1d1f]">
            Ces chiffres sont publics.
            <br />
            <span className="text-[#86868b]">
              Aujourd’hui, ils ne sont pas systématiquement croisés avec le terrain.
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
      className="group block bg-white rounded-3xl p-8 md:p-10 border border-black/[0.06] hover:border-black/15 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
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
        Voir les données <span aria-hidden>→</span>
      </p>
    </a>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FOUNDER — courte, humaine, crédibilité projet
// ─────────────────────────────────────────────────────────────────────────────

function FounderSection() {
  return (
    <section className="bg-white px-6 py-32 md:py-40 border-t border-black/5">
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <p className="text-[11px] tracking-[0.35em] uppercase text-cyan-700 mb-6">
            À propos
          </p>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
            Une initiative née à Nouakchott.
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <p className="mt-10 text-lg md:text-xl text-[#1d1d1f] max-w-3xl leading-relaxed">
            MINAI est portée par <span className="font-semibold">Imane Ahmedou</span>,
            avec la conviction que la donnée doit servir le terrain — pas l’inverse.
          </p>
        </Reveal>
        <Reveal delay={300}>
          <p className="mt-5 text-base md:text-lg text-[#6e6e73] max-w-3xl leading-relaxed">
            Le projet collabore avec des ONG, des institutions publiques et des
            chercheurs. Les outils, les données et les méthodes sont documentés
            ouvertement pour que chaque décideur puisse vérifier, contester, améliorer.
          </p>
        </Reveal>

        {/* Trois micro-chips : valeurs / posture du projet */}
        <Reveal delay={400}>
          <div className="mt-10 flex flex-wrap gap-2">
            <Chip>Open data</Chip>
            <Chip>Méthode Sphere</Chip>
            <Chip>Partenariat ONG</Chip>
            <Chip>Souveraineté locale</Chip>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs px-3 py-1.5 rounded-full bg-[#fafafa] border border-black/5 text-[#1d1d1f]">
      {children}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTNER — split layout (texte gauche / photo droite)
// ─────────────────────────────────────────────────────────────────────────────

function PartnerSection({ onEnter }: { onEnter: () => void }) {
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
            <p className="mt-8 text-xl md:text-2xl text-[#1d1d1f] max-w-xl leading-snug font-medium">
              Si vous ne pouvez pas voir le problème,
              <br />
              <span className="text-[#86868b]">vous ne pouvez pas agir.</span>
            </p>
          </Reveal>
          <Reveal delay={300}>
            <p className="mt-6 text-base md:text-lg text-[#6e6e73] max-w-xl leading-relaxed">
              MINAI vous permet de voir. Nous travaillons avec des ONG et des
              institutions pour :
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
                See priority zones
              </button>
              <a
                href="mailto:imaneahmedou1@gmail.com?subject=Work%20with%20MINAI"
                className="border border-[#1d1d1f]/20 text-[#1d1d1f] px-7 py-3 rounded-full font-medium hover:bg-[#1d1d1f]/[0.04] transition text-center"
              >
                Work with MINAI
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
        <span>Nouakchott, Mauritanie · © 2026 MINAI</span>
        <span>Aligned with UN SDG 6 · Sources : ANSADE · UNICEF · World Bank · OpenStreetMap</span>
      </div>
    </footer>
  )
}
