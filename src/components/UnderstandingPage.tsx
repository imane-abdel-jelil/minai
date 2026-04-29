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
 * Storytelling 8 sections : Ouverture → Rupture → Impact → Réalité rurale
 * → Développement → Le défi → Transition → Conclusion. Distincte de la
 * landing produit. Ton institutionnel, lecture longue, photos réelles
 * de la Mauritanie.
 *
 * IMAGES À DÉPOSER MANUELLEMENT dans `public/images/` :
 *   ‣ mauritania-woman-jerrycans.jpg   — femme mauritanienne, robe bleue, 3 jerrycans
 *   ‣ girl-water-pump.jpg              — fillette au point d'eau (chemise rouge)
 *   ‣ mauritania-water-tanker.jpg      — citerne d'eau distribution Mauritanie
 *   ‣ women-water-sunset.jpg           — silhouettes de femmes avec jerrycans, coucher de soleil
 *
 * Photos symboliques (Pexels — fallback) :
 *   ‣ 6130668   Macro Photography of Water Drop (symbolique)
 *   ‣ 11759837  Swastik Arora — boy at hand pump (impact, fallback)
 */

const IMG = {
  // Symbolique (Pexels)
  water_drop:    'https://images.pexels.com/photos/6130668/pexels-photo-6130668.jpeg?auto=compress&cs=tinysrgb&w=2000',
  // Photos Mauritanie locales (à déposer dans public/images/)
  mauritania_woman: '/images/mauritania-woman-jerrycans.jpg',
  girl_pump:        '/images/girl-water-pump.jpg',
  water_tanker:     '/images/mauritania-water-tanker.jpg',
  women_sunset:     '/images/women-water-sunset.jpg',
}

export default function UnderstandingPage({ onBack, onEnterMap }: Props) {
  return (
    <div className="bg-white text-[#1d1d1f] overflow-x-hidden font-sans antialiased">
      <Nav onBack={onBack} onEnterMap={onEnterMap} />
      <Hero />
      <Section1Opening />
      <Section2Rupture />
      <Section3Impact />
      <Section4Rural />
      <Section5Development />
      <Section6Challenge />
      <Section7Transition />
      <Section8Conclusion onEnterMap={onEnterMap} />
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
        <div className="hidden md:flex items-center gap-7 text-[13px] text-[#6e6e73]">
          <a href="#opening"     className="hover:text-[#1d1d1f] transition">L’eau</a>
          <a href="#rupture"     className="hover:text-[#1d1d1f] transition">Rupture</a>
          <a href="#impact"      className="hover:text-[#1d1d1f] transition">Impact</a>
          <a href="#rural"       className="hover:text-[#1d1d1f] transition">Réalité rurale</a>
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
// SECTION 1 — OUVERTURE 🟢
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
          <SectionEyebrow num="01" label="Ouverture" />
          <Reveal delay={100}>
            <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
              L’eau est une condition d’existence.
            </h2>
          </Reveal>
          <Reveal delay={250}>
            <div className="mt-8 space-y-5 text-lg md:text-xl text-[#1d1d1f] leading-relaxed">
              <p>
                Sans accès à l’eau, rien ne fonctionne durablement —{' '}
                <span className="text-[#86868b]">
                  ni la santé, ni l’éducation, ni l’économie.
                </span>
              </p>
              <p className="text-[#6e6e73]">
                Pourtant, aujourd’hui encore, l’accès à l’eau potable reste
                incertain.
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
// SECTION 2 — RUPTURE 🔴 (NOUVELLE — photo Mauritanie pleine largeur)
// ─────────────────────────────────────────────────────────────────────────────

function Section2Rupture() {
  return (
    <section id="rupture" className="bg-[#fafafa] py-32 md:py-40">
      <div className="px-4 sm:px-6 mb-12 md:mb-16">
        <Reveal>
          <div className="relative max-w-7xl mx-auto rounded-3xl overflow-hidden aspect-[16/9] md:aspect-[21/9] bg-slate-200">
            <img
              src={IMG.mauritania_woman}
              alt="Femme mauritanienne transportant trois jerrycans dans le désert"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        </Reveal>
      </div>

      <div className="px-6">
        <div className="max-w-3xl mx-auto">
          <SectionEyebrow num="02" label="Rupture" />
          <Reveal delay={100}>
            <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
              Mais cette réalité
              <br />
              <span className="text-[#86868b]">
                n’est pas répartie de manière égale.
              </span>
            </h2>
          </Reveal>
          <Reveal delay={250}>
            <div className="mt-8 space-y-5 text-lg md:text-xl text-[#1d1d1f] leading-relaxed">
              <p>
                Pour certaines communautés, l’accès à l’eau dépend encore de
                plusieurs heures de marche.
              </p>
              <p className="text-3xl md:text-4xl font-semibold tracking-tight text-cyan-700">
                Chaque jour.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — IMPACT 🟠
// ─────────────────────────────────────────────────────────────────────────────

function Section3Impact() {
  const consequences = [
    'Santé fragilisée.',
    'Scolarité interrompue.',
    'Activité économique limitée.',
  ]
  return (
    <section id="impact" className="bg-white px-6 py-32 md:py-40">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        <div>
          <SectionEyebrow num="03" label="Impact" />
          <Reveal delay={100}>
            <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
              L’accès à l’eau ne détermine pas
              <br />
              <span className="text-[#86868b]">seulement la survie.</span>
            </h2>
          </Reveal>
          <Reveal delay={250}>
            <p className="mt-8 text-xl md:text-2xl text-[#1d1d1f] leading-snug">
              Il détermine la capacité à vivre.
            </p>
          </Reveal>
          <ul className="mt-10 space-y-3">
            {consequences.map((text, i) => (
              <Reveal key={i} delay={350 + i * 80}>
                <li className="flex gap-3 text-base md:text-lg text-[#1d1d1f] leading-relaxed">
                  <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-cyan-700 shrink-0" />
                  <span>{text}</span>
                </li>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={650}>
            <p className="mt-10 text-base md:text-lg text-[#6e6e73] leading-relaxed border-t border-black/5 pt-6">
              Dans certaines régions, accéder à l’eau peut représenter{' '}
              <span className="text-[#1d1d1f] font-medium">
                plusieurs heures chaque jour
              </span>.
            </p>
          </Reveal>
        </div>

        <Reveal delay={300}>
          <div className="relative rounded-3xl overflow-hidden aspect-[4/5] bg-slate-100">
            <img
              src={IMG.girl_pump}
              alt="Fillette debout près d'un point d'eau avec l'eau qui coule"
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
// SECTION 4 — RÉALITÉ RURALE 🔵
// ─────────────────────────────────────────────────────────────────────────────

function Section4Rural() {
  return (
    <section id="rural" className="bg-[#fafafa]">
      <div className="px-4 sm:px-6 pt-32 md:pt-40 mb-12 md:mb-16">
        <Reveal>
          <div className="relative max-w-7xl mx-auto rounded-3xl overflow-hidden aspect-[16/9] md:aspect-[21/9] bg-slate-200">
            <img
              src={IMG.water_tanker}
              alt="Distribution d'eau par citerne, jerrycans alignés en Mauritanie"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            <div className="absolute inset-0 flex items-end p-8 sm:p-12 md:p-16 text-white">
              <Reveal>
                <p className="max-w-xl text-lg md:text-2xl font-light leading-snug">
                  L’eau n’est pas absente.
                  <br />
                  <span className="text-white/75">
                    Elle est difficilement accessible.
                  </span>
                </p>
              </Reveal>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="px-6 pb-32 md:pb-40">
        <div className="max-w-3xl mx-auto">
          <SectionEyebrow num="04" label="Réalité rurale" />
          <Reveal delay={100}>
            <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
              Dans les zones rurales,
              <br />
              <span className="text-[#86868b]">
                une contrainte structurelle.
              </span>
            </h2>
          </Reveal>
          <Reveal delay={250}>
            <p className="mt-8 text-lg md:text-xl text-[#1d1d1f] leading-relaxed">
              L’accès à l’eau n’y dépend pas seulement de la disponibilité.
              Il dépend de l’infrastructure, de la régularité et de la
              répartition géographique des services.
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
                  <span>Villages éloignés des points d’eau.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-cyan-700 shrink-0" />
                  <span>Ressources irrégulières.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-cyan-700 shrink-0" />
                  <span>Infrastructures inégalement réparties.</span>
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
// SECTION 5 — DÉVELOPPEMENT 🟣 (eau = droit)
// ─────────────────────────────────────────────────────────────────────────────

function Section5Development() {
  return (
    <section id="development" className="bg-white px-6 py-32 md:py-40 border-t border-black/5">
      <div className="max-w-4xl mx-auto">
        <SectionEyebrow num="05" label="Développement" />
        <Reveal delay={100}>
          <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
            Pas seulement une question de ressources.
            <br />
            <span className="bg-gradient-to-r from-cyan-700 to-cyan-500 bg-clip-text text-transparent">
              Une question de droit.
            </span>
          </h2>
        </Reveal>
        <Reveal delay={250}>
          <p className="mt-10 text-lg md:text-xl text-[#1d1d1f] leading-relaxed max-w-3xl">
            Reconnu comme un droit humain fondamental, l’accès à l’eau reste,
            dans de nombreuses régions, inégalement garanti.
          </p>
        </Reveal>

        {/* Mention SDG 6 — discrète, institutionnelle */}
        <Reveal delay={400}>
          <div className="mt-10 flex items-center gap-4 p-4 rounded-2xl bg-[#fafafa] border border-black/5 max-w-xl">
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
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — LE DÉFI ⚫
// ─────────────────────────────────────────────────────────────────────────────

function Section6Challenge() {
  return (
    <section id="challenge" className="bg-[#fafafa] px-6 py-32 md:py-40 border-t border-black/5">
      <div className="max-w-4xl mx-auto">
        <SectionEyebrow num="06" label="Le défi" />
        <Reveal delay={100}>
          <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
            Toutes les zones ne sont pas
            <br />
            <span className="text-[#86868b]">
              identifiées avec la même précision.
            </span>
          </h2>
        </Reveal>
        <Reveal delay={250}>
          <p className="mt-8 text-lg md:text-xl text-[#1d1d1f] leading-relaxed max-w-3xl">
            Dans de nombreux cas, les communautés les plus exposées restent
            en dehors des systèmes de décision.
          </p>
        </Reveal>

        <div className="mt-16 grid md:grid-cols-2 gap-12 md:gap-16 max-w-4xl">
          <Reveal delay={350}>
            <ChallengeBlock
              title="Les données existent"
              body="Mais elles sont fragmentées, dispersées entre les institutions."
            />
          </Reveal>
          <Reveal delay={450}>
            <ChallengeBlock
              title="Les informations sont disponibles"
              body="Mais rarement croisées entre elles pour produire une lecture commune."
            />
          </Reveal>
        </div>

        <Reveal delay={650}>
          <p className="mt-16 text-2xl md:text-3xl font-light tracking-tight leading-snug max-w-3xl text-[#1d1d1f]">
            Sans une lecture claire du terrain,{' '}
            <span className="text-[#86868b]">
              les priorités ne sont pas toujours établies.
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function ChallengeBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-t border-black/10 pt-5">
      <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-[#1d1d1f]">
        {title}
      </h3>
      <p className="mt-3 text-[#6e6e73] leading-relaxed">{body}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — TRANSITION 🔥 (NOUVELLE — pivot vers MINAI)
// ─────────────────────────────────────────────────────────────────────────────

function Section7Transition() {
  return (
    <section className="relative bg-white">
      {/* Photo silhouettes coucher de soleil — pleine largeur, tonalité poétique */}
      <div className="px-4 sm:px-6 pt-32 md:pt-40 mb-12">
        <Reveal>
          <div className="relative max-w-7xl mx-auto rounded-3xl overflow-hidden aspect-[16/9] md:aspect-[21/9] bg-slate-200">
            <img
              src={IMG.women_sunset}
              alt="Silhouettes de femmes transportant des jerrycans au coucher du soleil"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
          </div>
        </Reveal>
      </div>

      <div className="px-6 pb-32 md:pb-40">
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <p className="text-2xl md:text-4xl font-light tracking-tight text-[#86868b] leading-snug">
              Le défi n’est pas uniquement d’agir.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <p className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight text-[#1d1d1f] leading-[1.1]">
              Le défi est de savoir{' '}
              <span className="bg-gradient-to-r from-cyan-700 to-cyan-500 bg-clip-text text-transparent">
                où agir en premier.
              </span>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — CONCLUSION 🟢 (lien MINAI)
// ─────────────────────────────────────────────────────────────────────────────

function Section8Conclusion({ onEnterMap }: { onEnterMap: () => void }) {
  return (
    <section className="relative bg-[#fafafa] px-6 py-32 md:py-44 border-t border-black/5 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <SectionEyebrow num="08" label="Conclusion" />
        <Reveal delay={100}>
          <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
            Améliorer l’accès à l’eau
            <br />
            <span className="text-[#86868b]">nécessite des ressources.</span>
          </h2>
        </Reveal>
        <Reveal delay={250}>
          <p className="mt-8 text-lg md:text-xl text-[#1d1d1f] leading-relaxed max-w-3xl">
            Mais sans une lecture claire du terrain,{' '}
            <span className="text-[#86868b]">
              ces ressources ne sont pas orientées de manière optimale.
            </span>
          </p>
        </Reveal>

        <Reveal delay={450}>
          <div className="mt-14 max-w-2xl p-8 md:p-10 rounded-3xl bg-white border border-black/5">
            <p className="text-base md:text-lg text-[#1d1d1f] leading-relaxed">
              <span className="font-semibold">MINAI</span> aide les ONG et les
              institutions à identifier les zones les plus critiques, afin de
              prioriser les interventions et maximiser leur impact.
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
