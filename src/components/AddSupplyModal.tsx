/**
 * AddSupplyModal — enregistre un nouveau ravitaillement dans Supabase.
 *
 * Formulaire compact :
 *   - Village (autocomplete sur la liste ANSADE)
 *   - Quantité (m³)
 *   - Date
 *   - Statut (Livré / En cours / Reporté)
 *   - Note libre (optionnel)
 *
 * L'insertion se fait avec created_by = auth.uid() pour que la RLS
 * du côté Supabase autorise l'écriture.
 */
import { useMemo, useState } from 'react'
import { supabase, type SupplyInsert } from '../lib/supabase'
import type { VillageEval } from '../lib/villages'
import { MAURITANIA_REGIONS } from '../data/mauritania-regions'

interface Props {
  organization: string
  userId: string
  villageEvals: VillageEval[]
  onClose: () => void
  onCreated: () => void
}

export default function AddSupplyModal({
  organization,
  userId,
  villageEvals,
  onClose,
  onCreated,
}: Props) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<VillageEval | null>(null)
  const [quantity, setQuantity] = useState<string>('30')
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [status, setStatus] = useState<SupplyInsert['status']>('delivered')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ─── Autocomplete villages (sur nom + wilaya) ────────────────────
  const suggestions = useMemo(() => {
    if (!search.trim() || selected) return []
    const q = search.toLowerCase()
    return villageEvals
      .filter(
        (e) =>
          e.village.name.toLowerCase().includes(q) ||
          (MAURITANIA_REGIONS.find((r) => r.id === e.village.wilayaId)?.name ?? '')
            .toLowerCase()
            .includes(q),
      )
      .sort((a, b) => b.village.population - a.village.population)
      .slice(0, 8)
  }, [search, selected, villageEvals])

  const canSubmit = !!selected && !!date && Number(quantity) > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !selected || !supabase) return
    setSubmitting(true)
    setError(null)

    const wilayaName =
      MAURITANIA_REGIONS.find((r) => r.id === selected.village.wilayaId)?.name ??
      selected.village.wilayaId ??
      ''

    const payload: SupplyInsert & { created_by: string } = {
      organization,
      village_code_localite: Number(selected.village.id) || null,
      village_name: selected.village.name,
      village_wilaya: wilayaName,
      quantity_m3: Number(quantity),
      supply_date: date,
      status,
      notes: notes.trim() || null,
      created_by: userId,
    }

    const { error } = await supabase.from('supplies').insert(payload)
    setSubmitting(false)

    if (error) {
      setError('Erreur : ' + error.message)
    } else {
      onCreated()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900">
              Ajouter un ravitaillement
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              L'opération sera enregistrée sous {organization}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Village autocomplete */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Village *
            </label>
            {selected ? (
              <div className="flex items-center justify-between bg-cyan-50 border border-cyan-200 rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {selected.village.name}
                  </div>
                  <div className="text-xs text-slate-600">
                    {MAURITANIA_REGIONS.find((r) => r.id === selected.village.wilayaId)?.name ??
                      selected.village.wilayaId}{' '}
                    · {selected.village.population.toLocaleString('fr-FR')} hab.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null)
                    setSearch('')
                  }}
                  className="text-xs text-cyan-700 font-semibold hover:text-cyan-900"
                >
                  Changer
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un village ou une wilaya…"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-900 placeholder-slate-400"
                />
                {suggestions.length > 0 && (
                  <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-auto z-10">
                    {suggestions.map((s) => {
                      const wilayaName =
                        MAURITANIA_REGIONS.find((r) => r.id === s.village.wilayaId)?.name ??
                        s.village.wilayaId
                      return (
                        <li key={s.village.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelected(s)
                              setSearch('')
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 transition"
                          >
                            <div className="font-semibold text-sm">{s.village.name}</div>
                            <div className="text-xs text-slate-500">
                              {wilayaName} · {s.village.population.toLocaleString('fr-FR')} hab.
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Quantity + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Quantité (m³) *
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-900"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Statut
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['delivered', 'in_progress', 'delayed'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                    status === s
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {s === 'delivered' ? 'Livré' : s === 'in_progress' ? 'En cours' : 'Reporté'}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Note (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Camion-citerne, mode de distribution, contact terrain…"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-900 placeholder-slate-400 resize-none"
            />
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-xl transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-300 text-white font-semibold py-2.5 rounded-xl transition"
            >
              {submitting ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
