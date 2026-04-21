import { Client } from '@notionhq/client'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PageObjectResponse = any
import type { Acquereur, Bien, Activite, PipelineStage } from './types'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

const DB = {
  acquereurs: process.env.NOTION_ACQUEREURS_DB!,
  biens:      process.env.NOTION_BIENS_DB!,
  activites:  process.env.NOTION_ACTIVITES_DB!,
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function prop(page: PageObjectResponse, name: string) {
  return (page.properties as Record<string, any>)[name]
}

function getText(page: PageObjectResponse, name: string): string | undefined {
  const p = prop(page, name)
  if (!p) return undefined
  if (p.type === 'title')     return p.title?.[0]?.plain_text
  if (p.type === 'rich_text') return p.rich_text?.[0]?.plain_text
  if (p.type === 'email')     return p.email
  if (p.type === 'phone_number') return p.phone_number
  if (p.type === 'url')       return p.url
  if (p.type === 'select')    return p.select?.name
  if (p.type === 'formula')   return p.formula?.string
  return undefined
}

function getNumber(page: PageObjectResponse, name: string): number | undefined {
  const p = prop(page, name)
  return p?.type === 'number' ? p.number : undefined
}

function getBool(page: PageObjectResponse, name: string): boolean {
  const p = prop(page, name)
  return p?.type === 'checkbox' ? p.checkbox : false
}

function getMulti(page: PageObjectResponse, name: string): string[] {
  const p = prop(page, name)
  return p?.type === 'multi_select' ? p.multi_select.map((o: any) => o.name) : []
}

function getDate(page: PageObjectResponse, name: string): string | undefined {
  const p = prop(page, name)
  return p?.type === 'date' ? p.date?.start : undefined
}

function getUniqueId(page: PageObjectResponse, name: string): string | undefined {
  const p = prop(page, name)
  if (p?.type === 'unique_id') return `${p.unique_id.prefix || ''}-${p.unique_id.number}`
  return undefined
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function pageToAcquereur(page: PageObjectResponse): Acquereur {
  return {
    id:                   page.id,
    acqId:                getUniqueId(page, 'ID'),
    nom:                  getText(page, 'Nom complet') || '—',
    email:                getText(page, 'Email'),
    telephone:            getText(page, 'Téléphone'),
    statut:               (getText(page, 'Statut pipeline') || '🆕 Lead') as PipelineStage,
    score:                getNumber(page, 'Score') ?? 0,
    priorite:             (getText(page, 'Priorité') || '⬜ Basse') as any,
    portailSource:        getText(page, 'Portail source'),
    typeBien:             getMulti(page, 'Type de bien') as any,
    localisation:         getMulti(page, 'Localisation souhaitée') as any,
    budgetMin:            getNumber(page, 'Budget min (€)'),
    budgetMax:            getNumber(page, 'Budget max (€)'),
    delaiAcquisition:     getText(page, 'Délai acquisition'),
    financement:          getText(page, 'Financement'),
    nbVisites:            getNumber(page, 'Nb visites'),
    nbBiensPropoases:     getNumber(page, 'Nb biens proposés'),
    conseillerAssigne:    getText(page, 'Conseiller assigné'),
    datePremierContact:   getDate(page, 'Date premier contact'),
    derniereActivite:     getDate(page, 'Dernière activité'),
    qualiteContact:       getText(page, 'Qualité contact'),
    succession:           getBool(page, 'Succession'),
    notes:                getText(page, 'Notes'),
    derniereSuggestionIA: getText(page, 'Dernière suggestion IA'),
    creeLe:               getDate(page, 'Créé le'),
    modifieLe:            getDate(page, 'Modifié le'),
  }
}

function pageToBien(page: PageObjectResponse): Bien {
  return {
    id:                   page.id,
    titre:                getText(page, 'Titre annonce') || '—',
    refSextant:           getText(page, 'Réf Sextant'),
    statut:               (getText(page, 'Statut') || '🟢 Disponible') as any,
    type:                 getText(page, 'Type de bien') as any,
    localisation:         getText(page, 'Localisation'),
    prix:                 getNumber(page, 'Prix (€)'),
    surface:              getNumber(page, 'Surface m²'),
    nbPieces:             getNumber(page, 'Nb pièces'),
    lienAnnonce:          getText(page, 'Lien annonce'),
    conseiller:           getText(page, 'Conseiller'),
    exclusivite:          getBool(page, 'Exclusivité'),
    scoreMatching:        getNumber(page, 'Score matching'),
    dateMiseEnLigne:      getDate(page, 'Date mise en ligne'),
    derniereVerification: getDate(page, 'Dernière vérification'),
  }
}

// ── Acquéreurs ────────────────────────────────────────────────────────────────

export async function getAcquereurs(): Promise<Acquereur[]> {
  try {
    const pages: PageObjectResponse[] = []
    let cursor: string | undefined

    do {
      const res = await (notion as any).databases.query({
        database_id: DB.acquereurs,
        start_cursor: cursor,
        page_size: 100,
        sorts: [{ property: 'Score', direction: 'descending' }],
      })
      pages.push(...res.results.filter((r: any) => r.object === 'page'))
      cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined
    } while (cursor)

    return pages.map(pageToAcquereur)
  } catch (err) {
    console.error('[getAcquereurs] Notion error:', err)
    return []
  }
}

export async function getAcquereurById(id: string): Promise<Acquereur | null> {
  try {
    const page = await (notion as any).pages.retrieve({ page_id: id }) as PageObjectResponse
    return pageToAcquereur(page)
  } catch { return null }
}

export async function updateAcquereur(
  id: string,
  data: Partial<{
    statut: PipelineStage
    score: number
    priorite: string
    derniereSuggestionIA: string
    nbVisites: number
    derniereActivite: string
  }>
) {
  const properties: Record<string, any> = {}

  if (data.statut)               properties['Statut pipeline'] = { select: { name: data.statut } }
  if (data.score !== undefined)  properties['Score']           = { number: data.score }
  if (data.priorite)             properties['Priorité']        = { select: { name: data.priorite } }
  if (data.nbVisites !== undefined) properties['Nb visites']   = { number: data.nbVisites }
  if (data.derniereSuggestionIA) properties['Dernière suggestion IA'] = {
    rich_text: [{ text: { content: data.derniereSuggestionIA.slice(0, 2000) } }]
  }
  if (data.derniereActivite) properties['Dernière activité'] = {
    date: { start: data.derniereActivite }
  }

  return notion.pages.update({ page_id: id, properties })
}

export async function createAcquereur(data: Partial<Acquereur>) {
  const properties: Record<string, any> = {
    'Nom complet': { title: [{ text: { content: data.nom || 'Nouveau lead' } }] },
    'Statut pipeline': { select: { name: data.statut || '🆕 Lead' } },
    'Priorité': { select: { name: data.priorite || '⬜ Basse' } },
    'Score': { number: data.score || 0 },
  }
  if (data.email)     properties['Email']     = { email: data.email }
  if (data.telephone) properties['Téléphone'] = { phone_number: data.telephone }
  if (data.portailSource) properties['Portail source'] = { select: { name: data.portailSource } }
  if (data.budgetMax) properties['Budget max (€)'] = { number: data.budgetMax }
  if (data.budgetMin) properties['Budget min (€)'] = { number: data.budgetMin }
  if (data.notes)     properties['Notes']     = { rich_text: [{ text: { content: data.notes } }] }
  if (data.conseillerAssigne) properties['Conseiller assigné'] = { select: { name: data.conseillerAssigne } }
  if (data.datePremierContact) properties['Date premier contact'] = { date: { start: data.datePremierContact } }
  if (data.typeBien?.length) properties['Type de bien'] = { multi_select: data.typeBien.map(n => ({ name: n })) }
  if (data.localisation?.length) properties['Localisation souhaitée'] = { multi_select: data.localisation.map(n => ({ name: n })) }

  return notion.pages.create({ parent: { database_id: DB.acquereurs }, properties })
}

// ── Biens ─────────────────────────────────────────────────────────────────────

export async function getBiens(onlyDisponible = true): Promise<Bien[]> {
  try {
    const res = await (notion as any).databases.query({
      database_id: DB.biens,
      filter: onlyDisponible
        ? { property: 'Statut', select: { equals: '🟢 Disponible' } }
        : undefined,
      sorts: [{ property: 'Prix (€)', direction: 'ascending' }],
    })
    return (res.results.filter((r: any) => r.object === 'page') as PageObjectResponse[]).map(pageToBien)
  } catch (err) {
    console.error('[getBiens] Notion error:', err)
    return []
  }
}

export async function upsertBien(data: Partial<Bien> & { refSextant: string }) {
  // Chercher si le bien existe déjà par réf
  const existing = await (notion as any).databases.query({
    database_id: DB.biens,
    filter: { property: 'Réf Sextant', rich_text: { equals: data.refSextant } },
  })

  const properties: Record<string, any> = {
    'Titre annonce': { title: [{ text: { content: data.titre || data.refSextant } }] },
    'Réf Sextant': { rich_text: [{ text: { content: data.refSextant } }] },
    'Dernière vérification': { date: { start: new Date().toISOString().split('T')[0] } },
  }
  if (data.statut)    properties['Statut']    = { select: { name: data.statut } }
  if (data.prix)      properties['Prix (€)']  = { number: data.prix }
  if (data.surface)   properties['Surface m²'] = { number: data.surface }
  if (data.type)      properties['Type de bien'] = { select: { name: data.type } }
  if (data.localisation) properties['Localisation'] = { select: { name: data.localisation } }
  if (data.lienAnnonce)  properties['Lien annonce'] = { url: data.lienAnnonce }
  if (data.conseiller)   properties['Conseiller'] = { select: { name: data.conseiller } }

  if (existing.results.length > 0) {
    return notion.pages.update({ page_id: existing.results[0].id, properties })
  }
  return notion.pages.create({ parent: { database_id: DB.biens }, properties })
}

// ── Activités ─────────────────────────────────────────────────────────────────

export async function createActivite(data: {
  titre: string
  type: string
  direction?: string
  statut?: string
  resume?: string
  suggestionIA?: string
  prochaineAction?: string
  date?: string
  prochaineRelance?: string
  conseiller?: string
  acquereurId?: string
}) {
  const properties: Record<string, any> = {
    'Titre':  { title: [{ text: { content: data.titre } }] },
    'Type':   { select: { name: data.type } },
    'Statut': { select: { name: data.statut || '⏳ En attente' } },
  }
  if (data.direction)      properties['Direction']        = { select: { name: data.direction } }
  if (data.resume)         properties['Résumé']           = { rich_text: [{ text: { content: data.resume } }] }
  if (data.suggestionIA)   properties['Suggestion IA']    = { rich_text: [{ text: { content: data.suggestionIA.slice(0, 2000) } }] }
  if (data.prochaineAction) properties['Prochaine action'] = { rich_text: [{ text: { content: data.prochaineAction } }] }
  if (data.conseiller)     properties['Conseiller']       = { select: { name: data.conseiller } }
  if (data.date)           properties['Date']             = { date: { start: data.date } }
  if (data.prochaineRelance) properties['Prochaine relance'] = { date: { start: data.prochaineRelance } }

  return notion.pages.create({ parent: { database_id: DB.activites }, properties })
}

export { notion }
