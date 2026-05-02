/**
 * Système i18n léger pour MINAI — pas de librairie externe.
 *
 * Usage dans un composant :
 *   const { t, lang, setLang } = useI18n()
 *   <h1>{t('Making the invisible visible again.')}</h1>
 *
 * Le code des composants reste lisible (on voit la phrase FR directement),
 * et la traduction EN est définie dans `translations.ts` sous la même clé.
 *
 * Si une clé n'a pas de traduction EN, elle retombe sur la version FR
 * (la clé elle-même), donc rien ne casse pendant le travail de traduction.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { TRANSLATIONS_EN } from './translations'

export type Lang = 'fr' | 'en'

interface I18nContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (frenchKey: string) => string
}

const Ctx = createContext<I18nContextValue | null>(null)

const STORAGE_KEY = 'minai.lang'

export function I18nProvider({ children }: { children: ReactNode }) {
  // Récupère la préférence sauvegardée (localStorage), sinon FR par défaut
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'fr'
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved === 'en' ? 'en' : 'fr'
  })

  const setLang = (l: Lang) => {
    setLangState(l)
    try { window.localStorage.setItem(STORAGE_KEY, l) } catch { /* ignore */ }
  }

  // Met à jour l'attribut lang du <html> pour l'accessibilité et le SEO
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const t = (frenchKey: string): string => {
    if (lang === 'fr') return frenchKey
    const en = TRANSLATIONS_EN[frenchKey]
    return en ?? frenchKey
  }

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useI18n doit être utilisé dans un I18nProvider')
  return ctx
}
