import { getAcquereurs } from '@/lib/notion'
import type { Acquereur } from '@/lib/types'

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 60 ? 'bg-red-100 text-red-800 border-red-200'
    : score >= 30 ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
    : 'bg-gray-100 text-gray-600 border-gray-200'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${cls}`}>
      {score}
    </span>
  )
}

function PrioriteBadge({ p }: { p: string }) {
  if (p === '🔴 Haute') return <span className="text-xs">🔴</span>
  if (p === '🟡 Moyenne') return <span className="text-xs">🟡</span>
  return <span className="text-xs">⬜</span>
}

export default async function LeadsPage({
  searchParams
}: {
  searchParams: { filter?: string; conseiller?: string; q?: string }
}) {
  const all = await getAcquereurs()

  let leads: Acquereur[] = all

  // Filtres
  if (searchParams.filter === 'haute') {
    leads = leads.filter(a => a.priorite === '🔴 Haute')
  } else if (searchParams.filter === 'inactif') {
    leads = leads.filter(a => {
      if (!a.derniereActivite) return false
      const j = Math.floor((Date.now() - new Date(a.derniereActivite).getTime()) / 86_400_000)
      return j > 21 && !['❌ Perdu','💤 Inactif','🎉 Acte signé'].includes(a.statut)
    })
  } else if (searchParams.filter === 'actif') {
    leads = leads.filter(a => !['❌ Perdu','💤 Inactif','🎉 Acte signé'].includes(a.statut))
  }

  if (searchParams.conseiller) {
    leads = leads.filter(a => a.conseillerAssigne === searchParams.conseiller)
  }

  if (searchParams.q) {
    const q = searchParams.q.toLowerCase()
    leads = leads.filter(a =>
      a.nom.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.telephone?.includes(q)
    )
  }

  return (
    <div className="space-y-4">
      {/* Header + filtres */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[#0D1E2E]">
          Leads acquéreurs <span className="text-lg text-gray-400 font-normal">({leads.length})</span>
        </h1>
        <a
          href="/leads/new"
          className="px-4 py-2 bg-[#0D1E2E] text-white text-sm rounded-lg hover:bg-[#1a2e42] transition-colors"
        >
          + Nouveau
        </a>
      </div>

      {/* Filtres rapides */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Tous', value: '' },
          { label: '✅ Actifs', value: 'actif' },
          { label: '🔴 Haute priorité', value: 'haute' },
          { label: '⚠️ Inactifs 21j+', value: 'inactif' },
        ].map(({ label, value }) => (
          <a
            key={value}
            href={`/leads${value ? `?filter=${value}` : ''}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              (searchParams.filter || '') === value
                ? 'bg-[#0D1E2E] text-white border-[#0D1E2E]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nom</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Score</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Budget</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Zone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Activité</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads.map(a => {
                const joursInactif = a.derniereActivite
                  ? Math.floor((Date.now() - new Date(a.derniereActivite).getTime()) / 86_400_000)
                  : null

                return (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <PrioriteBadge p={a.priorite} />
                        <span className="font-medium text-gray-800">{a.nom}</span>
                      </div>
                      {a.portailSource && (
                        <span className="text-[10px] text-gray-400">{a.portailSource}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {a.email && <p className="text-xs text-gray-600 truncate max-w-[160px]">{a.email}</p>}
                      {a.telephone && <p className="text-xs text-gray-400">{a.telephone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">{a.statut}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreBadge score={a.score} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {a.budgetMax ? `${a.budgetMax.toLocaleString('fr')}€` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-[120px]">
                      <span className="truncate block">{a.localisation?.[0] || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {joursInactif !== null ? (
                        <span className={`text-xs ${joursInactif > 21 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                          {joursInactif === 0 ? "Aujourd'hui" : `${joursInactif}j`}
                        </span>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/leads/${a.id}`}
                        className="text-xs text-[#C4964A] hover:underline font-medium"
                      >
                        Voir →
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {leads.length === 0 && (
            <div className="py-12 text-center text-gray-400 text-sm">
              Aucun lead trouvé pour ce filtre
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
