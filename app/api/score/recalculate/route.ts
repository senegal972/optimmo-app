import { NextRequest, NextResponse } from 'next/server'
import { getAcquereurs, updateAcquereur } from '@/lib/notion'
import { calculerScore, getPrioriteFromScore } from '@/lib/scoring'

// GET /api/score/recalculate
// Protégé par CRON_SECRET (appelé par Vercel Cron)
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const acquereurs = await getAcquereurs()
  const results: { id: string; nom: string; score: number; priorite: string }[] = []

  for (const acq of acquereurs) {
    if (['🎉 Acte signé', '❌ Perdu'].includes(acq.statut)) continue

    const details = calculerScore(acq)
    const priorite = getPrioriteFromScore(details.total)

    if (details.total !== acq.score || priorite !== acq.priorite) {
      await updateAcquereur(acq.id, { score: details.total, priorite })
      results.push({ id: acq.id, nom: acq.nom, score: details.total, priorite })
    }
  }

  return NextResponse.json({
    updated: results.length,
    total: acquereurs.length,
    results,
  })
}
