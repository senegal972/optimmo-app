import { NextRequest, NextResponse } from 'next/server'
import { syncAnnoncesNotion } from '@/lib/scraper'
import { getAcquereurs, getBiens, updateAcquereur, createActivite } from '@/lib/notion'
import { calculerScore, getPrioriteFromScore } from '@/lib/scoring'
import { genererRapportHebdo } from '@/lib/ai'

// GET /api/cron/weekly
// Déclenchement : Vercel Cron - tous les lundis 7h00 (heure Martinique = UTC-4 → 11h UTC)
export async function GET(req: NextRequest) {
  // Vérification du secret Cron (header Vercel automatique)
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const log: string[] = []
  const startTime = Date.now()

  try {
    // ── 1. Scraping annonces Sextant ─────────────────────────────────────────
    log.push('🔄 Scraping annonces Sextant...')
    const { synced, errors } = await syncAnnoncesNotion()
    log.push(`✅ ${synced} biens synchronisés (${errors} erreurs)`)

    // ── 2. Recalcul des scores ───────────────────────────────────────────────
    log.push('📊 Recalcul des scores...')
    const acquereurs = await getAcquereurs()
    let scoresUpdated = 0

    for (const acq of acquereurs) {
      if (['🎉 Acte signé', '❌ Perdu'].includes(acq.statut)) continue
      const details = calculerScore(acq)
      const priorite = getPrioriteFromScore(details.total)
      if (details.total !== acq.score || priorite !== acq.priorite) {
        await updateAcquereur(acq.id, { score: details.total, priorite })
        scoresUpdated++
      }
    }
    log.push(`✅ ${scoresUpdated} scores mis à jour`)

    // ── 3. Rapport hebdo IA ──────────────────────────────────────────────────
    log.push('🤖 Génération rapport IA...')
    const biens = await getBiens(false)
    const rapport = await genererRapportHebdo(acquereurs, biens)

    await createActivite({
      titre: `📊 Rapport pipeline — ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`,
      type: '📊 Rapport hebdo',
      direction: '🤖 Auto IA',
      statut: '✅ Traité',
      suggestionIA: rapport,
      date: new Date().toISOString().split('T')[0],
      conseiller: 'Franck Fidi',
    })
    log.push('✅ Rapport créé dans Activités')

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    log.push(`⏱️ Cron terminé en ${duration}s`)

    return NextResponse.json({
      success: true,
      log,
      stats: { synced, errors, scoresUpdated },
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.push(`❌ Erreur : ${message}`)
    return NextResponse.json({ success: false, log, error: message }, { status: 500 })
  }
}
