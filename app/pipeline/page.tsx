import { getAcquereurs } from '@/lib/notion'
import type { Acquereur, PipelineStage } from '@/lib/types'

const STAGES: { stage: PipelineStage; color: string; bg: string }[] = [
  { stage: '🆕 Lead',       color: 'text-gray-700',   bg: 'bg-gray-50 border-gray-200' },
  { stage: '✅ Qualifié',   color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  { stage: '🔥 Actif',      color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  { stage: '🏠 En visite',  color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  { stage: '📝 Offre',      color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  { stage: '📋 Compromis',  color: 'text-pink-700',   bg: 'bg-pink-50 border-pink-200' },
  { stage: '🎉 Acte signé', color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
]

function ScorePill({ score }: { score: number }) {
  const cls = score >= 60 ? 'bg-red-100 text-red-800'
    : score >= 30 ? 'bg-yellow-100 text-yellow-800'
    : 'bg-gray-100 text-gray-600'
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cls}`}>{score}</span>
}

function LeadCard({ acq }: { acq: Acquereur }) {
  return (
    <a href={`/leads/${acq.id}`}>
      <div className="pipeline-card group">
        <div className="flex items-start justify-between gap-1 mb-1.5">
          <p className="text-xs font-semibold text-gray-800 truncate leading-tight">{acq.nom}</p>
          <ScorePill score={acq.score} />
        </div>
        {acq.budgetMax && (
          <p className="text-[10px] text-gray-500">
            💰 {acq.budgetMax.toLocaleString('fr')}€
          </p>
        )}
        {acq.typeBien && acq.typeBien.length > 0 && (
          <p className="text-[10px] text-gray-500 truncate">
            🏠 {acq.typeBien.slice(0,2).join(', ')}
          </p>
        )}
        {acq.localisation && acq.localisation.length > 0 && (
          <p className="text-[10px] text-gray-500 truncate">
            📍 {acq.localisation[0]}
          </p>
        )}
        {acq.derniereActivite && (
          <p className="text-[10px] text-gray-400 mt-1">
            {(() => {
              const j = Math.floor((Date.now() - new Date(acq.derniereActivite!).getTime()) / 86_400_000)
              return j === 0 ? "Aujourd'hui" : `il y a ${j}j`
            })()}
          </p>
        )}
      </div>
    </a>
  )
}

export default async function PipelinePage() {
  const acquereurs = await getAcquereurs()
  const byStage = STAGES.reduce<Record<string, Acquereur[]>>((acc, { stage }) => {
    acc[stage] = acquereurs.filter(a => a.statut === stage).sort((a, b) => b.score - a.score)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#0D1E2E]">Pipeline acquéreurs</h1>
        <a
          href="/leads/new"
          className="px-4 py-2 bg-[#0D1E2E] text-white text-sm rounded-lg hover:bg-[#1a2e42] transition-colors"
        >
          + Nouveau lead
        </a>
      </div>

      {/* Kanban horizontal scroll */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {STAGES.map(({ stage, color, bg }) => {
            const cards = byStage[stage] || []
            return (
              <div key={stage} className={`w-52 rounded-xl border ${bg} flex flex-col`}>
                <div className="px-3 py-2.5 border-b border-inherit">
                  <span className={`text-xs font-semibold ${color}`}>{stage}</span>
                  <span className="ml-2 text-[10px] bg-white rounded-full px-1.5 py-0.5 text-gray-600 font-bold">
                    {cards.length}
                  </span>
                </div>
                <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-220px)]">
                  {cards.length === 0 ? (
                    <p className="text-[10px] text-gray-400 text-center py-4">Aucun</p>
                  ) : (
                    cards.map(a => <LeadCard key={a.id} acq={a} />)
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
