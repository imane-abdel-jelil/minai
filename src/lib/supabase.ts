import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Le client n'est créé que si les variables ne sont pas des placeholders
export const supabase: SupabaseClient | null =
  url && anon && !url.startsWith('https://PASTE') ? createClient(url, anon) : null

// Types côté DB (à aligner avec supabase/schema.sql)
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
