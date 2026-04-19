// lib/scraper.ts — Scraping des annonces Sextant France
// Utilisé par le cron hebdomadaire

import { upsertBien } from './notion'
import type { Bien } from './types'

// URLs des conseillers à surveiller
const SEXTANT_PAGES = [
  'https://franck-fidi.sextantfrance.fr/',
  // Ajouter Philippe Marie-Luce et Lucien Fortune quand URLs connues
  // 'https://philippe-marie-luce.sextantfrance.fr/',
  // 'https://lucien-fortune.sextantfrance.fr/',
]

interface ScrapedBien {
  refSextant: string
  titre: string
  type?: string
  localisation?: string
  prix?: number
  surface?: number
  nbPieces?: number
  lienAnnonce: string
  conseiller?: string
  statut: '🟢 Disponible' | '🔴 Vendu' | '🟡 Sous offre'
}

// ── Scraping via Playwright (Node.js) ────────────────────────────────────────
// Cette fonction est appelée côté serveur dans le cron Vercel
export async function scrapeAnnonces(): Promise<ScrapedBien[]> {
  // En production : utiliser Playwright ou l'API Adaptimmo si disponible
  // Pour le MVP, on utilise l'API Adaptimmo via importation directe

  // Option A : API Adaptimmo (si accès)
  // const res = await fetch(`https://api.adaptimmo.com/v1/annonces?agence=optimmodom`, {
  //   headers: { Authorization: `Bearer ${process.env.ADAPTIMMO_KEY}` }
  // })

  // Option B : Scraping HTML Sextant (fallback)
  const results: ScrapedBien[] = []

  for (const url of SEXTANT_PAGES) {
    try {
      const biens = await scrapeSextantPage(url)
      results.push(...biens)
    } catch (err) {
      console.error(`Erreur scraping ${url}:`, err)
    }
  }

  return results
}

async function scrapeSextantPage(baseUrl: string): Promise<ScrapedBien[]> {
  // Fetch HTML de la page de liste
  const res = await fetch(`${baseUrl}fr/liste-annonces.htm`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; OptimmoDom-CRM/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
    },
    next: { revalidate: 0 }
  })

  if (!res.ok) throw new Error(`HTTP ${res.status} for ${baseUrl}`)

  const html = await res.text()
  return parseSextantListHTML(html, baseUrl)
}

function parseSextantListHTML(html: string, baseUrl: string): ScrapedBien[] {
  const biens: ScrapedBien[] = []

  // Regex patterns pour parser le HTML Sextant France
  // Pattern pour les fiches annonces (structure Adaptimmo standard)
  const fichePattern = /<article[^>]+class="[^"]*annonce[^"]*"[^>]*>([\s\S]*?)<\/article>/gi
  const matches = [...html.matchAll(fichePattern)]

  for (const match of matches) {
    const content = match[1]

    const ref = extractRegex(content, /data-ref="([^"]+)"/) ||
                 extractRegex(content, /ref\.?\s*:?\s*([A-Z0-9]+)/i) || ''
    if (!ref) continue

    const titre = extractRegex(content, /<h2[^>]*>([^<]+)<\/h2>/) ||
                  extractRegex(content, /class="titre"[^>]*>([^<]+)</) || ref

    const prixStr = extractRegex(content, /(\d[\d\s]*)\s*€/)
    const prix = prixStr ? parseInt(prixStr.replace(/\s/g, '')) : undefined

    const surfaceStr = extractRegex(content, /(\d+)\s*m²/)
    const surface = surfaceStr ? parseInt(surfaceStr) : undefined

    const piecesStr = extractRegex(content, /(\d+)\s*pièce/)
    const nbPieces = piecesStr ? parseInt(piecesStr) : undefined

    const lienMatch = extractRegex(content, /href="([^"]*detail[^"]*)"/)
    const lienAnnonce = lienMatch ? new URL(lienMatch, baseUrl).href : baseUrl

    const vendu = /vendu|compromis/i.test(content)
    const sousOffre = /sous.offre|sous offre/i.test(content)

    biens.push({
      refSextant: ref,
      titre: titre.trim(),
      prix,
      surface,
      nbPieces,
      lienAnnonce,
      statut: vendu ? '🔴 Vendu' : sousOffre ? '🟡 Sous offre' : '🟢 Disponible',
      conseiller: 'Franck Fidi',
    })
  }

  return biens
}

function extractRegex(html: string, regex: RegExp): string | undefined {
  const m = html.match(regex)
  return m ? m[1].trim() : undefined
}

// ── Sync vers Notion ──────────────────────────────────────────────────────────
export async function syncAnnoncesNotion(): Promise<{ synced: number; errors: number }> {
  const annonces = await scrapeAnnonces()
  let synced = 0, errors = 0

  for (const a of annonces) {
    try {
      await upsertBien({
        refSextant: a.refSextant,
        titre: a.titre,
        statut: a.statut,
        type: a.type as any,
        localisation: a.localisation,
        prix: a.prix,
        surface: a.surface,
        nbPieces: a.nbPieces,
        lienAnnonce: a.lienAnnonce,
        conseiller: a.conseiller,
      })
      synced++
    } catch {
      errors++
    }
  }

  return { synced, errors }
}
