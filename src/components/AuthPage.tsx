/**
 * AuthPage — écran de connexion / inscription pour accéder à MINAI.
 *
 * Branding institutionnel WATER4ALL. C'est ce que voient les
 * utilisateurs partenaires avant de pouvoir accéder au dashboard et
 * à la carte.
 *
 * Pour le pitch : le compte démo est
 *     Email:    demo@water4all.org
 *     Password: Pitch2026!
 */
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

interface Props {
  /** Retour à la landing page publique. */
  onBackToLanding?: () => void
}

export default function AuthPage({ onBackToLanding }: Props) {
  const { signIn, signUp, isConfigured } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConfigured) {
      setError('Backend non configuré. Vérifie les variables Supabase dans .env.')
      return
    }
    setError(null)
    setNotice(null)
    setLoading(true)

    if (mode === 'signin') {
      const { error } = await signIn(email, password)
      if (error) setError(traduireErreur(error.message))
    } else {
      const { error } = await signUp(email, password, {
        full_name: fullName || null,
        organization: orgName || 'Water4All',
      })
      if (error) {
        setError(traduireErreur(error.message))
      } else {
        setNotice(
          'Compte créé. Vérifie ta boîte mail pour confirmer ton adresse ' +
            "avant de te connecter (ou désactive la confirmation dans Supabase → Auth → Settings pour un pitch immédiat).",
        )
        setMode('signin')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 flex items-center justify-center p-6">
      {/* Retour landing */}
      {onBackToLanding && (
        <button
          onClick={onBackToLanding}
          className="fixed top-6 left-6 text-white/70 hover:text-white text-sm font-medium flex items-center gap-1.5 transition"
        >
          ← Retour à la page d'accueil
        </button>
      )}

      <div className="w-full max-w-md">
        {/* Branding Water4All */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.5c-4 5-7 8.5-7 12a7 7 0 0 0 14 0c0-3.5-3-7-7-12z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-white text-2xl font-bold tracking-tight leading-none">Water4All</div>
              <div className="text-cyan-300/70 text-[11px] uppercase tracking-wider mt-1">
                Accès à l'eau — Mauritanie
              </div>
            </div>
          </div>
          <p className="text-white/60 text-sm">
            Portail partenaires — connectez-vous pour accéder à votre tableau de bord et à la cartographie MINAI.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => {
                setMode('signin')
                setError(null)
                setNotice(null)
              }}
              className={`flex-1 py-4 text-sm font-semibold transition ${
                mode === 'signin'
                  ? 'text-cyan-700 border-b-2 border-cyan-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Se connecter
            </button>
            <button
              onClick={() => {
                setMode('signup')
                setError(null)
                setNotice(null)
              }}
              className={`flex-1 py-4 text-sm font-semibold transition ${
                mode === 'signup'
                  ? 'text-cyan-700 border-b-2 border-cyan-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Créer un compte
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {mode === 'signup' && (
              <>
                <Field
                  label="Nom complet"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Amina Moktar"
                  autoComplete="name"
                />
                <Field
                  label="Organisation"
                  value={orgName}
                  onChange={setOrgName}
                  placeholder="Water4All"
                  autoComplete="organization"
                />
              </>
            )}
            <Field
              label="Adresse email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="prenom.nom@organisation.org"
              autoComplete="email"
              required
            />
            <Field
              label="Mot de passe"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
            />

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            {notice && (
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                {notice}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-300 text-white font-semibold py-3 rounded-xl transition shadow-md shadow-cyan-500/20"
            >
              {loading
                ? '...'
                : mode === 'signin'
                  ? 'Se connecter'
                  : 'Créer mon compte partenaire'}
            </button>
          </form>
        </div>

        <p className="text-white/40 text-[11px] text-center mt-6">
          MINAI — Plateforme d'intelligence géospatiale · Données ANSADE · UNICEF · Banque Mondiale
        </p>
      </div>
    </div>
  )
}

// ─── Sous-composants ──────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  autoComplete?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-gray-900 placeholder-gray-400"
      />
    </div>
  )
}

/** Traduit les messages d'erreur Supabase en français lisible. */
function traduireErreur(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.'
  if (msg.includes('User already registered')) return 'Un compte existe déjà pour cet email.'
  if (msg.includes('Password should be')) return 'Le mot de passe doit contenir au moins 6 caractères.'
  if (msg.includes('Email not confirmed')) return "Veuillez confirmer votre email avant de vous connecter."
  if (msg.includes('Unable to validate email')) return "Format d'email invalide."
  return msg
}
