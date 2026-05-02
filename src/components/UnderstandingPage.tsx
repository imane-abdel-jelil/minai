import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useI18n } from '../lib/i18n'
import LanguageSwitch from './LanguageSwitch'

interface Props {
  /** Retour à la landing */
  onBack: () => void
  /** Entrer dans la cartographie (CTA primaire) */
  onEnterMap: () => void
  /** Naviguer vers une section précise de la landing (#problem, #solution, …) */
  onJumpToSection: (sectionId: string) => void
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

export default function UnderstandingPage({ onBack, onEnterMap, onJumpToSection }: Props) {
  const { t } = useI18n()
  return (
    <div className="bg-white text-[#1d1d1f] overflow-x-hidden font-sans antialiased">
      <Nav onBack={onBack} onEnterMap={onEnterMap} onJumpToSection={onJumpToSection} />
      <Beat1Universal />
      <FullBleedImage
        src={IMG.mauritania_woman}
        alt="Femme mauritanienne transportant trois jerrycans dans le désert"
        caption={t('Mauritanie · Le quotidien de l’accès à l’eau')}
      />
      <Beat2Reality />
      <Beat3Impact />
      <Beat4Visibility />
      <FullBleedImage
        src={IMG.water_tanker}
        alt="Distribution d'eau par citerne, jerrycans alignés en Mauritanie"
        caption={t('Une intervention. Des centaines d’attentes.')}
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

function Nav({
  onBack,
  onEnterMap,
  onJumpToSection,
}: {
  onBack: () => void
  onEnterMap: () => void
  onJumpToSection: (id: string) => void
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-white/80 border-b border-black/5">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className="font-semibold tracking-tight text-[15px] text-[#1d1d1f] hover:opacity-70 transition"
          >
            MINAI<span className="text-cyan-600">.</span>
          </button>

          {/* Liens — desktop */}
          <div className="hidden md:flex items-center gap-7 text-[13px] text-[#6e6e73]">
            <span className="text-[#1d1d1f] font-medium tracking-tight">{t('Accès à l’eau')}</span>
            <button onClick={() => onJumpToSection('problem')}       className="hover:text-[#1d1d1f] transition">{t('Problème')}</button>
            <button onClick={() => onJumpToSection('solution')}      className="hover:text-[#1d1d1f] transition">{t('Solution')}</button>
            <button onClick={() => onJumpToSection('impact')}        className="hover:text-[#1d1d1f] transition">{t('Impact')}</button>
            <button onClick={() => onJumpToSection('sdg6')}          className="hover:text-[#1d1d1f] transition">{t('SDG 6')}</button>
            <button onClick={() => onJumpToSection('collaboration')} className="hover:text-[#1d1d1f] transition">{t('Collaboration')}</button>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitch />
            <button
              onClick={onEnterMap}
              className="text-[13px] bg-[#1d1d1f] text-white px-4 py-1.5 rounded-full font-medium hover:bg-black transition"
            >
              {t('Voir la cartographie →')}
            </button>
          </div>

          {/* Hamburger mobile */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t('Fermer le menu') : t('Ouvrir le menu')}
            aria-expanded={open}
            className="md:hidden w-10 h-10 -mr-2 flex items-center justify-center"
          >
            <span className="relative block w-5 h-4">
              <span className={`absolute left-0 top-0 h-0.5 w-5 bg-[#1d1d1f] rounded-full transition-transform duration-200 ${open ? 'translate-y-[7px] rotate-45' : ''}`} />
              <span className={`absolute left-0 top-[7px] h-0.5 w-5 bg-[#1d1d1f] rounded-full transition-opacity duration-200 ${open ? 'opacity-0' : 'opacity-100'}`} />
              <span className={`absolute left-0 top-[14px] h-0.5 w-5 bg-[#1d1d1f] rounded-full transition-transform duration-200 ${open ? '-translate-y-[7px] -rotate-45' : ''}`} />
            </span>
          </button>
        </div>
      </nav>

      {/* Sheet mobile */}
      {open && (
        <>
          <div className="md:hidden fixed inset-0 top-14 z-40 bg-black/30" onClick={close} />
          <div className="md:hidden fixed top-14 inset-x-0 z-40 bg-white border-b border-black/5 shadow-lg">
            <div className="px-6 py-5 flex flex-col text-[15px] text-[#1d1d1f]">
              <span className="py-3 border-b border-black/5 font-medium">{t('Accès à l’eau')}</span>
              <button onClick={() => { close(); onJumpToSection('problem') }}       className="text-left py-3 border-b border-black/5">{t('Problème')}</button>
              <button onClick={() => { close(); onJumpToSection('solution') }}      className="text-left py-3 border-b border-black/5">{t('Solution')}</button>
              <button onClick={() => { close(); onJumpToSection('impact') }}        className="text-left py-3 border-b border-black/5">{t('Impact')}</button>
              <button onClick={() => { close(); onJumpToSection('sdg6') }}          className="text-left py-3 border-b border-black/5">{t('SDG 6')}</button>
              <button onClick={() => { close(); onJumpToSection('collaboration') }} className="text-left py-3 border-b border-black/5">{t('Collaboration')}</button>
              <div className="mt-4 mb-1 flex justify-center">
                <LanguageSwitch />
              </div>
              <button
                onClick={() => { close(); onEnterMap() }}
                className="mt-3 bg-[#1d1d1f] text-white py-3 rounded-full font-medium"
              >
                {t('Voir la cartographie →')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BEAT 1 — VÉRITÉ UNIVERSELLE (typographie pure, ouverture sobre)
// ─────────────────────────────────────────────────────────────────────────────

function Beat1Universal() {
  const { t } = useI18n()
  return (
    <section className="pt-32 md:pt-40 pb-20 md:pb-28 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <Reveal>
          <p className="text-[11px] tracking-[0.35em] uppercase text-cyan-700 mb-7">
            {t('MINAI · Comprendre')}
          </p>
        </Reveal>

        <Reveal delay={150}>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-semibold tracking-tight leading-[1.03]">
            {t('L’eau, condition')}
            <br />
            <span className="bg-gradient-to-b from-[#1d1d1f] to-[#6e6e73] bg-clip-text text-transparent">
              {t('d’existence.')}
            </span>
          </h1>
        </Reveal>

        <Reveal delay={350}>
          <p className="mt-10 text-lg md:text-2xl text-[#1d1d1f] leading-snug max-w-2xl mx-auto">
            {t('Sans accès à l’eau, rien ne fonctionne durablement —')}{' '}
            <span className="text-[#86868b]">{t('ni la santé, ni l’éducation, ni l’économie.')}</span>
          </p>
        </Reveal>

        <Reveal delay={500}>
          <p className="mt-6 text-base md:text-lg text-[#6e6e73] max-w-2xl mx-auto leading-relaxed">
            {t('Pourtant, aujourd’hui encore, l’accès à l’eau potable reste incertain.')}
          </p>
        </Reveal>

        <Reveal delay={700}>
          <p className="mt-12 text-sm md:text-base italic text-[#86868b]">
            {t('« L’eau est le principe de toute chose. » — Thalès de Milet')}
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
  const { t } = useI18n()
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <p className="text-base md:text-lg text-[#86868b] leading-relaxed">
            {t('Mais cette réalité n’est pas répartie de manière égale.')}
          </p>
        </Reveal>
        <Reveal delay={150}>
          <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
            {t('Pour certaines communautés,')}
            <br />
            <span className="text-[#86868b]">{t('l’accès à l’eau dépend de plusieurs heures de marche.')}</span>
          </h2>
        </Reveal>
        <Reveal delay={300}>
          <p className="mt-6 text-2xl md:text-3xl font-semibold tracking-tight text-cyan-700">
            {t('Chaque jour.')}
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
  const { t } = useI18n()
  return (
    <section className="bg-[#fafafa] px-6 py-24 md:py-32 border-t border-black/5">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 md:gap-14 items-start">
        <div>
          <Reveal>
            <p className="text-base md:text-lg text-[#86868b] leading-relaxed">
              {t('Ce déséquilibre se traduit en conséquences concrètes.')}
            </p>
          </Reveal>
          <Reveal delay={150}>
            <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
              {t('L’accès à l’eau ne détermine pas')}
              <br />
              <span className="text-[#86868b]">{t('seulement la survie.')}</span>
            </h2>
          </Reveal>
          <Reveal delay={300}>
            <p className="mt-6 text-xl md:text-2xl text-[#1d1d1f] leading-snug">
              {t('Il détermine la capacité à vivre.')}
            </p>
          </Reveal>

          <ul className="mt-10 space-y-3 text-base md:text-lg text-[#1d1d1f] leading-relaxed">
            <Reveal delay={400}>
              <li className="flex gap-3">
                <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-cyan-700 shrink-0" />
                <span>{t('Santé fragilisée.')}</span>
              </li>
            </Reveal>
            <Reveal delay={480}>
              <li className="flex gap-3">
                <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-cyan-700 shrink-0" />
                <span>{t('Scolarité interrompue.')}</span>
              </li>
            </Reveal>
            <Reveal delay={560}>
              <li className="flex gap-3">
                <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-cyan-700 shrink-0" />
                <span>{t('Activité économique limitée.')}</span>
              </li>
            </Reveal>
          </ul>

          <Reveal delay={700}>
            <p className="mt-10 text-sm md:text-base text-[#6e6e73] leading-relaxed border-t border-black/5 pt-5">
              {t('En Mauritanie, l’eau n’est pas absente. Elle est difficilement accessible : villages éloignés des points d’eau, ressources irrégulières, infrastructures inégalement réparties.')}
            </p>
          </Reveal>
        </div>

        <Reveal delay={250}>
          <div className="relative rounded-3xl overflow-hidden aspect-[4/5] md:aspect-square bg-slate-200 md:sticky md:top-20">
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
  const { t } = useI18n()
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <p className="text-base md:text-lg text-[#86868b] leading-relaxed">
            {t('Ce constat est connu. Il est même reconnu :')}
          </p>
        </Reveal>
        <Reveal delay={150}>
          <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
            {t('l’accès à l’eau')}
            <br />
            <span className="bg-gradient-to-r from-cyan-700 to-cyan-500 bg-clip-text text-transparent">
              {t('est un droit humain fondamental.')}
            </span>
          </h2>
        </Reveal>

        <Reveal delay={300}>
          <p className="mt-8 text-base md:text-lg text-[#1d1d1f] leading-relaxed">
            {t('Mais malgré cette reconnaissance, toutes les zones ne sont pas identifiées avec la même précision. Dans de nombreux cas, les communautés les plus exposées restent en dehors des systèmes de décision.')}
          </p>
        </Reveal>

        <Reveal delay={500}>
          <div className="mt-8 flex items-center gap-3 p-3 rounded-xl bg-[#fafafa] border border-black/5 max-w-md">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-[#26BDE2] flex items-center justify-center">
              <span className="text-white font-bold text-xs">06</span>
            </div>
            <p className="text-xs text-[#6e6e73] leading-snug">
              <span className="text-[#1d1d1f] font-medium">
                {t('Objectif de développement durable n°6')}
              </span>
              {' '}{t('— Eau propre et assainissement, Nations Unies.')}
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
  const { t } = useI18n()
  return (
    <section className="bg-[#fafafa] px-6 py-24 md:py-32 border-t border-black/5">
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <p className="text-base md:text-lg text-[#86868b] leading-relaxed">
            {t('Le problème n’est pas un manque de données.')}
          </p>
        </Reveal>
        <Reveal delay={150}>
          <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
            {t('Les données existent.')}
            <br />
            <span className="text-[#86868b]">{t('Mais elles ne sont pas croisées.')}</span>
          </h2>
        </Reveal>
        <Reveal delay={300}>
          <p className="mt-8 text-base md:text-lg text-[#1d1d1f] leading-relaxed">
            {t('ANSADE, UNICEF, World Bank, OpenStreetMap : les informations sont disponibles, mais dispersées. Sans une lecture claire du terrain, les priorités ne sont pas toujours établies.')}
          </p>
        </Reveal>

        <Reveal delay={500}>
          <div className="mt-12 border-l-2 border-cyan-700 pl-6">
            <p className="text-2xl md:text-3xl font-semibold tracking-tight text-[#1d1d1f] leading-snug">
              {t('Le défi n’est pas uniquement d’agir.')}
            </p>
            <p className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight bg-gradient-to-r from-cyan-700 to-cyan-500 bg-clip-text text-transparent leading-snug">
              {t('Le défi est de savoir où agir en premier.')}
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
  const { t } = useI18n()
  return (
    <section className="px-6 py-32 md:py-40">
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <p className="text-base md:text-lg text-[#86868b] leading-relaxed">
            {t('C’est là que MINAI intervient.')}
          </p>
        </Reveal>
        <Reveal delay={150}>
          <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
            {t('Identifier les zones critiques.')}
            <br />
            <span className="text-[#86868b]">{t('Prioriser les interventions.')}</span>
          </h2>
        </Reveal>
        <Reveal delay={300}>
          <p className="mt-8 text-base md:text-lg text-[#1d1d1f] leading-relaxed">
            {t('MINAI aide les ONG et les institutions à identifier les zones où l’accès à l’eau est le plus critique en Mauritanie, et à orienter leurs interventions là où elles auront le plus d’impact.')}
          </p>
        </Reveal>

        <Reveal delay={500}>
          <div className="mt-12 p-8 md:p-10 rounded-3xl bg-[#1d1d1f] text-white">
            <p className="text-lg md:text-xl leading-relaxed">
              {t('La carte rend visible ce que les données isolées ne montrent pas.')}
            </p>
            <button
              onClick={onEnterMap}
              className="mt-8 bg-white text-[#1d1d1f] px-7 py-3 rounded-full font-medium hover:bg-white/90 transition inline-flex items-center gap-2"
            >
              {t('Voir la cartographie')}
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
  const { t } = useI18n()
  return (
    <footer className="px-6 py-16 bg-white border-t border-black/5">
      <p className="max-w-4xl mx-auto text-center text-base md:text-xl font-light tracking-tight leading-snug text-[#1d1d1f]">
        MINAI <span className="text-[#86868b]">—</span>{' '}
        <span className="bg-gradient-to-r from-cyan-700 to-cyan-500 bg-clip-text text-transparent">
          {t('making the invisible visible again.')}
        </span>
      </p>
      <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-3 max-w-7xl mx-auto text-[11px] text-[#86868b]">
        <span>{t('Nouakchott, Mauritanie · © 2026 MINAI')}</span>
        <span>{t('Aligned with UN SDG 6 · Sources : ANSADE · UNICEF · World Bank · OpenStreetMap')}</span>
      </div>
    </footer>
  )
}
