import { NextRequest, NextResponse } from 'next/server'
import { getAcquereurs, getBiens, createActivite, updateAcquereur } from '@/lib/notion'
import { matcherBienIA, genererSuggestionRelance } from '@/lib/ai'

// POST /api/match/run — Lance le matching complet
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [acquereurs, biens] = await Promise.all([getAcquereurs(), getBiens(true)])

  let totalMatches = 0
  const suggestions: { bien: string; acquereur: string; score: number }[] = []

  // Pour chaque bien dispo, trouver les acquéreurs compatibles
  for (const bien of biens.slice(0, 10)) { // limite 10 biens par run
    const matches = await matcherBienIA(bien, acquereurs)

    for (const match of matches.slice(0, 3)) { // top 3 par bien
      const acq = acquereurs.find(a => a.id === match.acquereurId)
      if (!acq) continue

      // Créer une activité de suggestion
      await createActivite({
        titre: `Match IA : ${bien.type || 'Bien'} ${bien.localisation || ''} → ${acq.nom}`,
        type: '🤖 Suggestion IA',
        direction: '🤖 Auto IA',
        statut: '⏳ En attente',
        resume: match.raisons.join(' | '),
        suggestionIA: match.suggestionEmail || `Score matching: ${match.score}/100`,
        date: new Date().toISOString().split('T')[0],
        conseiller: acq.conseillerAssigne || 'Franck Fidi',
      })

      // Mettre à jour le champ suggestion sur l'acquéreur
      if (match.suggestionEmail) {
        await updateAcquereur(acq.id, {
          derniereSuggestionIA: `[${new Date().toLocaleDateString('fr-FR')}] ${match.suggestionEmail}`
        })
      }

      suggestions.push({ bien: bien.titre, acquereur: acq.nom, score: match.score })
      totalMatches++
    }
  }

  return NextResponse.json({ totalMatches, suggestions })
}

// POST /api/match/run?type=relance — Suggestions de relance pour inactifs
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const acquereurs = await getAcquereurs()

  // Inactifs depuis > 14 jours
  const aRelancer = acquereurs.filter(a => {
    if (['🎉 Acte signé', '❌ Perdu', '💤 Inactif'].includes(a.statut)) return false
    if (!a.derniereActivite) return true
    const j = Math.floor((Date.now() - new Date(a.derniereActivite).getTime()) / 86_400_000)
    return j > 14
  }).slice(0, 8) // max 8 par run (coût IA)

  const results: { nom: string; suggestion: string }[] = []

  for (const acq of aRelancer) {
    const suggestion = await genererSuggestionRelance(acq)
    await updateAcquereur(acq.id, { derniereSuggestionIA: suggestion })
    await createActivite({
      titre: `Suggestion relance IA : ${acq.nom}`,
      type: '🤖 Suggestion IA',
      direction: '🤖 Auto IA',
      statut: '⏳ En attente',
      suggestionIA: suggestion,
      date: new Date().toISOString().split('T')[0],
      conseiller: acq.conseillerAssigne || 'Franck Fidi',
    })
    results.push({ nom: acq.nom, suggestion })
  }

  return NextResponse.json({ total: results.length, results })
}
