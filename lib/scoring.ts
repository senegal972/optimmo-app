import type { Acquereur, ScoreDetails } from './types'

// ── Scoring 0-100 ────────────────────────────────────────────────────────────
// Budget défini      → max 20 pts
// Délai d'urgence    → max 20 pts
// Type de bien       → max 15 pts
// Qualité contact    → max 15 pts
// Activité récente   → max 20 pts
// Visites réalisées  → max 10 pts

export function calculerScore(acq: Acquereur): ScoreDetails {
  // Budget
  const budget = (acq.budgetMin && acq.budgetMax)
    ? 20 : (acq.budgetMax ? 15 : (acq.budgetMin ? 10 : 0))

  // Délai
  const delaiMap: Record<string, number> = {
    '⚡ Urgent < 3 mois': 20,
    '📆 Court 3-6 mois':  15,
    '📅 Moyen 6-12 mois': 10,
    '🗓️ Long > 12 mois':  5,
  }
  const delai = acq.delaiAcquisition ? (delaiMap[acq.delaiAcquisition] ?? 5) : 0

  // Type de bien
  const typeBien = (acq.typeBien && acq.typeBien.length > 0) ? 15 : 0

  // Qualité contact
  const qualiteMap: Record<string, number> = {
    '⭐⭐⭐ Très qualifié': 15,
    '⭐⭐ Qualifié':        10,
    '⭐ À qualifier':       5,
    '🚫 Invalide':          0,
  }
  const contact = acq.email
    ? (acq.telephone ? 15 : 8) // email + tél = 15, email seul = 8
    : 0
  const qualiteBonus = acq.qualiteContact ? (qualiteMap[acq.qualiteContact] ?? 5) : 5
  const contactFinal = Math.min(15, Math.round((contact + qualiteBonus) / 2))

  // Activité récente (jours depuis dernière activité)
  let activite = 0
  if (acq.derniereActivite) {
    const jours = Math.floor((Date.now() - new Date(acq.derniereActivite).getTime()) / 86_400_000)
    if (jours <= 7)  activite = 20
    else if (jours <= 30) activite = 15
    else if (jours <= 90) activite = 5
    else activite = 0
  } else if (acq.datePremierContact) {
    const jours = Math.floor((Date.now() - new Date(acq.datePremierContact).getTime()) / 86_400_000)
    activite = jours <= 30 ? 10 : 0
  }

  // Visites
  const visites = Math.min(10, (acq.nbVisites ?? 0) * 5)

  const total = budget + delai + typeBien + contactFinal + activite + visites

  return { total, budget, delai, typeBien, contact: contactFinal, activite, visites }
}

export function getPrioriteFromScore(score: number): '🔴 Haute' | '🟡 Moyenne' | '⬜ Basse' {
  if (score >= 60) return '🔴 Haute'
  if (score >= 30) return '🟡 Moyenne'
  return '⬜ Basse'
}

// ── Matching bien ↔ acquéreur ─────────────────────────────────────────────────
import type { Bien, MatchResult } from './types'

export function matchBienAcquereur(bien: Bien, acq: Acquereur): MatchResult {
  let score = 0
  const raisons: string[] = []

  // Type de bien (30 pts)
  if (acq.typeBien && bien.type) {
    if (acq.typeBien.includes(bien.type as any)) {
      score += 30
      raisons.push(`Type correspondant : ${bien.type}`)
    }
  }

  // Budget (30 pts)
  if (bien.prix) {
    const maxBudget = acq.budgetMax
    const minBudget = acq.budgetMin || 0
    if (maxBudget) {
      if (bien.prix <= maxBudget && bien.prix >= minBudget) {
        score += 30
        raisons.push(`Budget compatible : ${bien.prix.toLocaleString('fr')}€ ≤ ${maxBudget.toLocaleString('fr')}€`)
      } else if (bien.prix <= maxBudget * 1.1) {
        score += 15
        raisons.push(`Budget légèrement au-dessus (marge 10%)`)
      }
    }
  }

  // Localisation (25 pts)
  if (acq.localisation && bien.localisation) {
    const locMatch = acq.localisation.some(l =>
      bien.localisation?.toLowerCase().includes(l.toLowerCase()) ||
      l === 'Martinique entière'
    )
    if (locMatch) {
      score += 25
      raisons.push(`Zone souhaitée : ${bien.localisation}`)
    }
  }

  // Statut bien (15 pts) — bonus si disponible
  if (bien.statut === '🟢 Disponible') {
    score += 15
    raisons.push('Bien actuellement disponible')
  }

  return { acquereurId: acq.id, bienId: bien.id, score, raisons }
}
