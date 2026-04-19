import { getBiens } from '@/lib/notion'

export default async function BiensPage() {
  const biens = await getBiens(false)
  const dispos = biens.filter(b => b.statut === '🟢 Disponible')
  const autres = biens.filter(b => b.statut !== '🟢 Disponible')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#0D1E2E]">
          Biens & Annonces <span className="text-gray-400 font-normal text-lg">({biens.length})</span>
        </h1>
        <span className="px-3 py-1.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
          {dispos.length} disponibles
        </span>
      </div>

      {/* Biens disponibles */}
      {dispos.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-600 mb-3">🟢 Disponibles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dispos.map(b => (
              <div key={b.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                    {b.type || 'Bien'}
                  </span>
                  {b.exclusivite && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-[#C4964A]/10 text-[#C4964A] rounded font-semibold">
                      EXCLU
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-[#0D1E2E] text-sm leading-snug mb-1">{b.titre}</h3>
                <p className="text-xs text-gray-500 mb-3">📍 {b.localisation || '—'}</p>
                <div className="flex items-end justify-between">
                  <div>
                    {b.prix && (
                      <p className="text-lg font-bold text-[#0D1E2E]">{b.prix.toLocaleString('fr')}€</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {b.surface && `${b.surface}m²`}
                      {b.nbPieces && ` · ${b.nbPieces}P`}
                    </p>
                  </div>
                  <div className="text-right">
                    {b.scoreMatching !== undefined && b.scoreMatching > 0 && (
                      <div className="text-center">
                        <p className="text-lg font-bold text-[#C4964A]">{b.scoreMatching}</p>
                        <p className="text-[10px] text-gray-400">acq. match</p>
                      </div>
                    )}
                  </div>
                </div>
                {b.lienAnnonce && (
                  <a
                    href={b.lienAnnonce}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block text-center text-xs text-[#C4964A] hover:underline"
                  >
                    Voir l'annonce →
                  </a>
                )}
                {b.conseiller && (
                  <p className="text-[10px] text-gray-400 mt-2">👤 {b.conseiller}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Autres biens */}
      {autres.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-600 mb-3">Autres statuts</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Bien</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Prix</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Conseiller</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {autres.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-700 text-xs">{b.titre}</p>
                      <p className="text-[10px] text-gray-400">{b.localisation}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{b.statut}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {b.prix ? `${b.prix.toLocaleString('fr')}€` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{b.conseiller || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {biens.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🏡</p>
          <p>Aucun bien pour l'instant. Le scraping hebdo les alimentera automatiquement.</p>
        </div>
      )}
    </div>
  )
}
