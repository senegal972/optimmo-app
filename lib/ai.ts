import Anthropic from '@anthropic-ai/sdk'
import type { Acquereur, Bien, MatchResult } from './types'
import { matchBienAcquereur } from './scoring'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Suggestion de relance pour un acquéreur ───────────────────────────────────

export async function genererSuggestionRelance(acq: Acquereur): Promise<string> {
  const joursDepuis = acq.derniereActivite
    ? Math.floor((Date.now() - new Date(acq.derniereActivite).getTime()) / 86_400_000)
    : null

  const prompt = `Tu es Franck Fidi, conseiller immobilier Optimmo Dom en Martinique (réseau Sextant France).

Profil de l'acquéreur :
- Nom : ${acq.nom}
- Budget : ${acq.budgetMin ? `${acq.budgetMin.toLocaleString('fr')}€ – ` : ''}${acq.budgetMax ? `${acq.budgetMax.toLocaleString('fr')}€` : 'non précisé'}
- Type recherché : ${acq.typeBien?.join(', ') || 'non précisé'}
- Zone souhaitée : ${acq.localisation?.join(', ') || 'non précisée'}
- Délai : ${acq.delaiAcquisition || 'non précisé'}
- Financement : ${acq.financement || 'non précisé'}
- Statut pipeline : ${acq.statut}
- Dernière activité : ${joursDepuis !== null ? `il y a ${joursDepuis} jours` : 'inconnue'}
- Portail source : ${acq.portailSource || 'direct'}
- Notes : ${acq.notes || 'aucune'}

Génère une suggestion courte (3-4 phrases max) pour relancer ce contact de façon naturelle et personnalisée. 
Indique : 1) Le canal recommandé (email/SMS/appel), 2) Le meilleur moment, 3) L'angle d'approche.
Réponds en français, ton professionnel mais chaleureux.`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  return msg.content[0].type === 'text' ? msg.content[0].text : ''
}

// ── Match IA acquéreurs ↔ biens ───────────────────────────────────────────────

export async function matcherBienIA(bien: Bien, acquereurs: Acquereur[]): Promise<MatchResult[]> {
  // Matching algorithmique d'abord
  const matches = acquereurs
    .filter(a => !['🎉 Acte signé', '❌ Perdu', '💤 Inactif'].includes(a.statut))
    .map(a => matchBienAcquereur(bien, a))
    .filter(m => m.score >= 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10) // top 10

  if (matches.length === 0) return []

  // Enrichissement IA pour les top matches
  const topMatches = matches.slice(0, 5)
  const acqDetails = topMatches.map(m => {
    const acq = acquereurs.find(a => a.id === m.acquereurId)!
    return `- ${acq.nom} (budget: ${acq.budgetMax?.toLocaleString('fr') || '?'}€, zone: ${acq.localisation?.join('/')}, score: ${m.score}/100)`
  }).join('\n')

  const prompt = `Tu es un assistant immobilier Optimmo Dom Martinique.

Nouveau bien disponible :
- ${bien.type} à ${bien.localisation}
- Prix : ${bien.prix?.toLocaleString('fr') || '?'}€
- Surface : ${bien.surface || '?'} m² — ${bien.nbPieces || '?'} pièces
- ${bien.exclusivite ? 'EXCLUSIVITÉ Sextant' : 'Non exclusif'}

Top acquéreurs matchant :
${acqDetails}

Pour chaque acquéreur, génère un email de proposition court (5-6 lignes, en français, professionnel et chaleureux).
Format JSON : [{"acquereurId": "...", "email": "..."}]
Utilise les IDs exacts fournis.`

  // Note: on retourne les matches algorithmiques enrichis
  // L'IA est utilisée pour générer les emails de suggestion
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    if (msg.content[0].type === 'text') {
      const text = msg.content[0].text
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const emailSuggestions: { acquereurId: string; email: string }[] = JSON.parse(jsonMatch[0])
        return topMatches.map(m => ({
          ...m,
          suggestionEmail: emailSuggestions.find(e => e.acquereurId === m.acquereurId)?.email
        }))
      }
    }
  } catch {}

  return topMatches
}

// ── Rapport hebdo pipeline ────────────────────────────────────────────────────

export async function genererRapportHebdo(acquereurs: Acquereur[], biens: Bien[]): Promise<string> {
  const parStatut: Record<string, number> = {}
  acquereurs.forEach(a => {
    parStatut[a.statut] = (parStatut[a.statut] || 0) + 1
  })

  const hautePriorite = acquereurs.filter(a => a.priorite === '🔴 Haute')
  const inactifs = acquereurs.filter(a => {
    if (!a.derniereActivite) return false
    const jours = Math.floor((Date.now() - new Date(a.derniereActivite).getTime()) / 86_400_000)
    return jours > 21
  })

  const prompt = `Tu es Franck Fidi, conseiller Optimmo Dom Martinique.

Bilan pipeline cette semaine :
${Object.entries(parStatut).map(([s, n]) => `${s}: ${n}`).join('\n')}

Total acquéreurs actifs : ${acquereurs.filter(a => !['❌ Perdu','💤 Inactif'].includes(a.statut)).length}
Haute priorité : ${hautePriorite.length}
Inactifs depuis > 21 jours : ${inactifs.length}
Biens disponibles : ${biens.filter(b => b.statut === '🟢 Disponible').length}

Génère un brief hebdo professionnel en français (10-15 lignes) avec :
1. Synthèse pipeline
2. 3 actions prioritaires recommandées
3. Opportunités à saisir cette semaine`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  return msg.content[0].type === 'text' ? msg.content[0].text : ''
}
