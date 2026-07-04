/**
 * Client Supabase pour MINAI.
 *
 * Gère :
 *   - authentification (login, signup, session persistante)
 *   - table `supplies` (ravitaillements enregistrés par les ONG utilisatrices)
 *
 * Config via .env :
 *   VITE_SUPABASE_URL       — URL du projet Supabase
 *   VITE_SUPABASE_ANON_KEY  — clé publique (safe à exposer côté client)
 *
 * Il faut aussi renseigner ces deux vars dans Netlify → Site settings
 * → Environment variables pour que le build de production les voie.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const isConfigured =
  !!url &&
  !!anon &&
  !url.startsWith('https://PASTE') &&
  !anon.startsWith('PASTE')

// Le client n'est créé que si les variables ne sont pas des placeholders.
// Sinon on garde null pour permettre à l'UI d'afficher un message clair.
export const supabase: SupabaseClient | null = isConfigured
  ? createClient(url!, anon!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export const isSupabaseConfigured = isConfigured

// ─── Types application ─────────────────────────────────────────────────

/** Une opération de ravitaillement d'eau enregistrée par une ONG. */
export interface Supply {
  id: string
  organization: string
  village_code_localite: number | null
  village_name: string
  village_wilaya: string
  quantity_m3: number
  supply_date: string // ISO date
  status: 'delivered' | 'in_progress' | 'delayed'
  notes: string | null
  created_by: string | null
  created_at: string
}

/** Payload pour créer un nouveau ravitaillement. */
export interface SupplyInsert {
  organization: string
  village_code_localite: number | null
  village_name: string
  village_wilaya: string
  quantity_m3: number
  supply_date: string
  status: 'delivered' | 'in_progress' | 'delayed'
  notes?: string | null
}

// ─── Types DB héritées (schema.sql legacy — non utilisées activement) ──

export interface DbRegion {
  id: string
  name: string
  capital: string | null
  population: number | null
  rural_population: number | null
}

export interface WaterPoint {
  id: string
  region_id: string | null
  type: 'puits' | 'forage' | 'borne_fontaine' | 'riviere' | 'autre'
  status: 'fonctionnel' | 'en_panne' | 'sec' | 'inconnu'
  lng: number
  lat: number
  source: string | null
}

export interface WaterAccessScore {
  region_id: string
  score: number
  computed_at: string
}
