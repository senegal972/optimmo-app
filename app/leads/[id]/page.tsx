import { getAcquereurById, getBiens } from '@/lib/notion'
import { calculerScore } from '@/lib/scoring'
import { notFound } from 'next/navigation'
import type { ScoreDetails } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function ScoreBar({ label, val, max, color }: { label: string; val: number; max: number; color: string }) {
  const pct = Math.round((val / max) * 100)
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 text-gray-500 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right font-semibold text-gray-700">{val}/{max}</span>
    </div>
  )
}

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const acq = await getAcquereurById(params.id)
  if (!acq) notFound()

  const details: ScoreDetails = calculerScore(acq)
  const biens = await getBiens(true)

  // Calcul matches simples
  const { matchBienAcquereur } = await import('@/lib/scoring')
  const matches = biens
    .map(b => ({ bien: b, result: matchBienAcquereur(b, acq) }))
    .filter(m => m.result.score >= 25)
    .sort((a, b) => b.result.score - a.result.score)
    .slice(0, 5)

  const joursInactif = acq.derniereActivite
    ? Math.floor((Date.now() - new Date(acq.derniereActivite).getTime()) / 86_400_000)
    : null

  const scoreColor = details.total >= 60 ? 'text-red-600' : details.total >= 30 ? 'text-yellow-600' : 'text-gray-500'
  const scoreBg = details.total >= 60 ? 'bg-red-50 border-red-200' : details.total >= 30 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <a href="/leads" className="hover:text-gray-600">👥 Leads</a>
        <span>/</span>
        <span className="text-gray-700">{acq.nom}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-[#0D1E2E]">{acq.nom}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {acq.statut}
            {acq.acqId && <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{acq.acqId}</span>}
            {acq.portailSource && <span className="ml-2 text-xs text-gray-400">via {acq.portailSource}</span>}
          </p>
        </div>
        <div className={`px-4 py-3 rounded-xl border text-center ${scoreBg}`}>
          <p className="text-xs text-gray-500 mb-0.5">Score IA</p>
          <p className={`text-3xl font-bold ${scoreColor}`}>{details.total}</p>
          <p className="text-xs text-gray-500">/100</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-4">
          {/* Coordonnées */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">📞 Coordonnées</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {acq.email && (
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <a href={`mailto:${acq.email}`} className="text-[#C4964A] hover:underline break-all">{acq.email}</a>
                </div>
              )}
              {acq.telephone && (
                <div>
                  <p className="text-xs text-gray-400">Téléphone</p>
                  <a href={`tel:${acq.telephone}`} className="text-gray-700">{acq.telephone}</a>
                </div>
              )}
              {acq.conseillerAssigne && (
                <div>
                  <p className="text-xs text-gray-400">Conseiller</p>
                  <p className="text-gray-700">{acq.conseillerAssigne}</p>
                </div>
              )}
              {acq.datePremierContact && (
                <div>
                  <p className="text-xs text-gray-400">1er contact</p>
                  <p className="text-gray-700">{new Date(acq.datePremierContact).toLocaleDateString('fr-FR')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Critères recherche */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">🎯 Critères de recherche</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">Type de bien</p>
                <p className="text-gray-700">{acq.typeBien?.join(', ') || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Zone souhaitée</p>
                <p className="text-gray-700">{acq.localisation?.join(', ') || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Budget</p>
                <p className="text-gray-700">
                  {acq.budgetMin ? `${acq.budgetMin.toLocaleString('fr')}€ – ` : ''}
                  {acq.budgetMax ? `${acq.budgetMax.toLocaleString('fr')}€` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Délai</p>
                <p className="text-gray-700">{acq.delaiAcquisition || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Financement</p>
                <p className="text-gray-700">{acq.financement || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Qualité</p>
                <p className="text-gray-700">{acq.qualiteContact || '—'}</p>
              </div>
            </div>
            {acq.notes && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-600 leading-relaxed">{acq.notes}</p>
              </div>
            )}
          </div>

          {/* Matches biens */}
          {matches.length > 0 && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                🔗 Biens compatibles ({matches.length})
              </h2>
              <div className="space-y-2">
                {matches.map(({ bien, result }) => (
                  <div key={bien.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{bien.titre}</p>
                      <p className="text-xs text-gray-500">
                        {bien.prix?.toLocaleString('fr')}€ · {bien.surface}m² · {bien.localisation}
                      </p>
                      <p className="text-xs text-green-600 mt-0.5">{result.raisons[0]}</p>
                    </div>
                    <div className="text-center shrink-0 ml-3">
                      <span className="text-lg font-bold text-[#C4964A]">{result.score}</span>
                      <p className="text-[10px] text-gray-400">/100</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne score + IA */}
        <div className="space-y-4">
          {/* Détail score */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">📊 Détail du score</h2>
            <div className="space-y-2.5">
              <ScoreBar label="Budget" val={details.budget} max={20} color="bg-blue-400" />
              <ScoreBar label="Urgence délai" val={details.delai} max={20} color="bg-orange-400" />
              <ScoreBar label="Activité récente" val={details.activite} max={20} color="bg-green-400" />
              <ScoreBar label="Type de bien" val={details.typeBien} max={15} color="bg-purple-400" />
              <ScoreBar label="Qualité contact" val={details.contact} max={15} color="bg-yellow-400" />
              <ScoreBar label="Visites" val={details.visites} max={10} color="bg-red-400" />
            </div>
            {joursInactif !== null && (
              <p className={`text-xs mt-3 ${joursInactif > 21 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                {joursInactif > 21 ? `⚠️ Inactif depuis ${joursInactif} jours` : `Actif il y a ${joursInactif}j`}
              </p>
            )}
          </div>

          {/* Suggestion IA */}
          {acq.derniereSuggestionIA && (
            <div className="bg-[#0D1E2E] rounded-xl p-5">
              <h2 className="text-xs font-semibold text-[#E8C07A] mb-2">🤖 Suggestion IA</h2>
              <p className="text-xs text-white/80 leading-relaxed">{acq.derniereSuggestionIA}</p>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">⚡ Actions</h2>
            <div className="space-y-2">
              {[
                { href: `mailto:${acq.email}`, label: '📧 Envoyer un email', disabled: !acq.email },
                { href: `tel:${acq.telephone}`, label: '📞 Appeler', disabled: !acq.telephone },
                { href: `/api/score/recalculate`, label: '🔄 Recalculer score', disabled: false },
              ].map(({ href, label, disabled }) => (
                <a
                  key={label}
                  href={disabled ? '#' : href}
                  className={`block text-center py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                    disabled
                      ? 'text-gray-300 border-gray-100 cursor-not-allowed'
                      : 'text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </a>
              ))}
              {acq.notes && (
                <a
                  href={`https://www.notion.so/${params.id.replace(/-/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center py-2 px-3 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 text-gray-700"
                >
                  📋 Ouvrir dans Notion
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
