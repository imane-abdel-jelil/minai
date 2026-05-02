import { useI18n } from '../lib/i18n'

/**
 * Switch FR / EN — pill discret avec deux segments cliquables.
 * À placer dans le header des pages.
 */
export default function LanguageSwitch({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const { lang, setLang } = useI18n()
  const isDark = tone === 'dark'

  const baseSegment =
    'px-2.5 py-1 text-[11px] font-medium tracking-wide rounded-full transition-colors'
  const activeClass = isDark
    ? 'bg-white text-[#1d1d1f]'
    : 'bg-[#1d1d1f] text-white'
  const inactiveClass = isDark
    ? 'text-white/60 hover:text-white'
    : 'text-[#6e6e73] hover:text-[#1d1d1f]'

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-full p-0.5 ${
        isDark ? 'bg-white/10' : 'bg-black/[0.05]'
      }`}
      role="group"
      aria-label="Language selector"
    >
      <button
        type="button"
        onClick={() => setLang('fr')}
        aria-pressed={lang === 'fr'}
        className={`${baseSegment} ${lang === 'fr' ? activeClass : inactiveClass}`}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        className={`${baseSegment} ${lang === 'en' ? activeClass : inactiveClass}`}
      >
        EN
      </button>
    </div>
  )
}
