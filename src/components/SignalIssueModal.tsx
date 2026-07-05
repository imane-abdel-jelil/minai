/**
 * SignalIssueModal — modal pour signaler une correction sur un village.
 *
 * Chantier 2 · brique crowdsourcing. Chaque partenaire peut signaler
 * une erreur (population fausse, coordonnées imprécises, nouveau
 * réseau AEP, etc.) directement depuis le panneau village. Le
 * signalement est stocké dans la table Supabase village_updates avec
 * status='pending' en attente de validation par un admin institutionnel.
 */
import { useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  supabase,
  type VillageUpdateField,
  type VillageUpdateInsert,
} from '../lib/supabase'
import type { Village } from '../data/mauritania-villages'
import type { VillageEval } from '../lib/villages'
import { MAURITANIA_REGIONS } from '../data/mauritania-regions'

interface Props {
  village: Village
  villageEval: VillageEval | null
  user: User
  organization: string
  onClose: () => void
  onCreated: () => void
}

const FIELD_LABELS: Record<VillageUpdateField, string> = {
  name_fr:              'Nom (français)',
  name_ar:              'Nom (arabe)',
  population_total:     'Population totale',
  distance_to_water_km: 'Distance au point d\'eau (km)',
  reseau_aep:           'Sur réseau d\'eau potable (AEP)',
  coordinates:          'Coordonnées GPS',
  moughataa:            'Moughataa',
  commune:              'Commune',
  other:                'Autre',
}

const FIELD_PLACEHOLDER: Record<VillageUpdateField, string> = {
  name_fr:              'Nouveau nom en français',
  name_ar:              'الاسم الجديد باللغة العربية',
  population_total:     'Nombre d\'habitants (ex : 2450)',
  distance_to_water_km: 'Distance en km (ex : 18.5)',
  reseau_aep:           'Oui ou Non',
  coordinates:          'Longitude, Latitude (ex : -6.418, 16.279)',
  moughataa:            'Nom de la moughataa',
  commune:              'Nom de la commune',
  other:                'Description libre de la correction',
}

export default function SignalIssueModal({
  village,
  villageEval,
  user,
  organization,
  onClose,
  onCreated,
}: Props) {
  const [fieldName, setFieldName] = useState<VillageUpdateField>('population_total')
  const [proposedValue, setProposedValue] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wilayaName = useMemo(() => {
    return (
      MAURITANIA_REGIONS.find((r) => r.id === village.wilayaId)?.name ??
      village.wilayaId ??
      ''
    )
  }, [village.wilayaId])

  // Valeur actuelle calculée dynamiquement selon le champ choisi
  const currentValue = useMemo(() => {
    switch (fieldName) {
      case 'name_fr':
        return village.name
      case 'population_total':
        return village.population.toString()
      case 'distance_to_water_km':
        return villageEval?.distanceToWaterKm?.toFixed(2) ?? '?'
      case 'coordinates':
        return `${village.center[0].toFixed(4)}, ${village.center[1].toFixed(4)}`
      case 'reseau_aep':
        // On ne le connaît pas directement ici, laissons vide
        return null
      default:
        return null
    }
  }, [fieldName, village, villageEval])

  const canSubmit = proposedValue.trim().length > 0 && reason.trim().length >= 10

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !supabase) return
    setSubmitting(true)
    setError(null)

    const payload: VillageUpdateInsert & { submitted_by: string } = {
      village_code_localite: Number(village.id) || 0,
      village_name: village.name,
      village_wilaya: wilayaName || null,
      field_name: fieldName,
      current_value: currentValue,
      proposed_value: proposedValue.trim(),
      reason: reason.trim(),
      submitted_by_organization: organization,
      submitted_by: user.id,
    }

    const { error: insertError } = await supabase
      .from('village_updates')
      .insert(payload)
    setSubmitting(false)

    if (insertError) {
      setError(insertError.message)
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
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900">Signaler une erreur</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {village.name}
              {wilayaName ? ` · ${wilayaName}` : ''}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Vous soumettez au nom de <span className="font-medium text-slate-700">{organization}</span>
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
          {/* Field select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Champ concerné *
            </label>
            <select
              value={fieldName}
              onChange={(e) => {
                setFieldName(e.target.value as VillageUpdateField)
                setProposedValue('')
              }}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 bg-white"
            >
              {Object.entries(FIELD_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Current value display */}
          {currentValue !== null && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="text-xs text-slate-500 uppercase tracking-wider">
                Valeur actuelle
              </div>
              <div className="text-sm font-medium text-slate-900 mt-0.5">
                {currentValue}
              </div>
            </div>
          )}

          {/* Proposed value */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nouvelle valeur proposée *
            </label>
            <input
              type="text"
              value={proposedValue}
              onChange={(e) => setProposedValue(e.target.value)}
              placeholder={FIELD_PLACEHOLDER[fieldName]}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 placeholder-slate-400"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Motif · source de l'information *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Ex : Recensement communautaire local du 14 mai 2026 · Extension AEP validée par le Ministère · Coordonnées relevées GPS lors du convoi du 12 mai…"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 placeholder-slate-400 resize-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Minimum 10 caractères. Ce motif sera examiné par un admin
              institutionnel avant validation.
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              Erreur : {error}
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
              className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold py-2.5 rounded-xl transition"
            >
              {submitting ? 'Envoi…' : 'Envoyer le signalement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
