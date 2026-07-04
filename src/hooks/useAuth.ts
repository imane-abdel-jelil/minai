/**
 * useAuth — hook global pour l'état d'authentification Supabase.
 *
 * Suit la session (persistée en localStorage par le SDK Supabase), la
 * rafraîchit auto si besoin, et notifie les composants qui l'utilisent
 * quand l'utilisateur se connecte ou se déconnecte.
 *
 * Usage :
 *   const { user, loading, signIn, signUp, signOut } = useAuth()
 */
import { useEffect, useState, useCallback } from 'react'
import type { AuthError, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface AuthState {
  user: User | null
  loading: boolean
}

type AuthResult = { error: AuthError | null }

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
  })

  useEffect(() => {
    if (!supabase) {
      setState({ user: null, loading: false })
      return
    }

    // 1) Charge la session persistée (si l'utilisateur était déjà connecté)
    supabase.auth.getSession().then(({ data }) => {
      setState({ user: data.session?.user ?? null, loading: false })
    })

    // 2) S'abonne aux changements (login, logout, refresh token…)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, loading: false })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!supabase) return { error: { message: 'Supabase non configuré' } as AuthError }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error }
    },
    [],
  )

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      metadata?: Record<string, unknown>,
    ): Promise<AuthResult> => {
      if (!supabase) return { error: { message: 'Supabase non configuré' } as AuthError }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      })
      return { error }
    },
    [],
  )

  const signOut = useCallback(async (): Promise<void> => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  return {
    user: state.user,
    loading: state.loading,
    isConfigured: isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
  }
}
