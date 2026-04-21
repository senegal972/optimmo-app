import { getAcquereurs } from '@/lib/notion'
import { getBiens } from '@/lib/notion'
import type { PipelineStage } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const STAGES: PipelineStage[] = [
  '🆕 Lead','✅ Qualifié','🔥 Actif',
  '🏠 En visite','📝 Offre','📋 Compromis','🎉 Acte signé',
]

function ScoreBadge({ score }: { score: number }) {
  const bg = score >= 60 ? 'bg-red-100 text-red-800'
    : score >= 30 ? 'bg-yellow-100 text-yellow-800'
    : 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${bg}`}>
      {score}
    </span>
  )
}

export default async function DashboardPage() {
  const [acquereurs, biens] = await Promise.all([getAcquereurs(), getBiens(false)])

  const actifs = acquereurs.filter(a => !['❌ Perdu','💤 Inactif'].includes(a.statut))
  const hautePrio = acquereurs.filter(a => a.priorite === '🔴 Haute')
  const biensDispos = biens.filter(b => b.statut === '🟢 Disponible')
  const enVisite = acquereurs.filter(a => a.statut === '🏠 En visite')

  const byStage = STAGES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = acquereurs.filter(a => a.statut === s).length
    return acc
  }, {})

  const inactifs21j = acquereurs.filter(a => {
    if (!a.derniereActivite) return false
    const j = Math.floor((Date.now() - new Date(a.derniereActivite).getTime()) / 86_400_000)
    return j > 21 && !['❌ Perdu','💤 Inactif','🎉 Acte signé'].includes(a.statut)
  })

  const topLeads = acquereurs
    .filter(a => !['❌ Perdu','💤 Inactif','🎉 Acte signé'].includes(a.statut))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#0D1E2E]">Dashboard Pipeline</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Acquéreurs actifs', value: actifs.length, icon: '👥', color: 'text-blue-600' },
          { label: 'Haute priorité', value: hautePrio.length, icon: '🔴', color: 'text-red-600' },
          { label: 'Biens disponibles', value: biensDispos.length, icon: '🏡', color: 'text-green-600' },
          { label: 'En visite', value: enVisite.length, icon: '🏠', color: 'text-orange-600' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
              </div>
              <span className="text-2xl">{icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline funnel */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Répartition pipeline</h2>
          <div className="space-y-2">
            {STAGES.map(stage => {
              const count = byStage[stage] || 0
              const max = Math.max(...Object.values(byStage), 1)
              const pct = Math.round((count / max) * 100)
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-36 shrink-0">{stage}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-[#C4964A] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-6 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Alertes */}
        <div className="space-y-4">
          {inactifs21j.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-amber-800 mb-2">
                ⚠️ {inactifs21j.length} inactifs &gt; 21j
              </h2>
              <ul className="space-y-1">
                {inactifs21j.slice(0, 4).map(a => (
                  <li key={a.id} className="text-xs text-amber-700">
                    • {a.nom}
                    {a.derniereActivite && (
                      <span className="ml-1 opacity-70">
                        ({Math.floor((Date.now() - new Date(a.derniereActivite).getTime()) / 86_400_000)}j)
                      </span>
                    )}
                  </li>
                ))}
                {inactifs21j.length > 4 && (
                  <li className="text-xs text-amber-600 font-medium">+{inactifs21j.length - 4} autres</li>
                )}
              </ul>
            </div>
          )}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">🏆 Top 5 leads</h2>
            <ul className="space-y-2">
              {topLeads.map(a => (
                <li key={a.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 truncate max-w-[140px]">{a.nom}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">{a.statut.split(' ').slice(0,2).join(' ')}</span>
                    <ScoreBadge score={a.score} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-[#0D1E2E] rounded-xl p-5 text-white">
        <h2 className="text-sm font-semibold mb-3 text-[#E8C07A]">⚡ Actions rapides</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/api/score/recalculate', label: '🔄 Recalculer les scores', method: 'Cron' },
            { href: '/leads?filter=haute', label: '🔴 Voir haute priorité', method: 'Link' },
            { href: '/api/match/run', label: '🤖 Lancer le matching IA', method: 'Cron' },
            { href: '/biens', label: '🏡 Voir les biens dispo', method: 'Link' },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
