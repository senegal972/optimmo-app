// ── Types Optimmo Dom ──────────────────────────────────────────────────────

export type PipelineStage =
  | '🆕 Lead' | '✅ Qualifié' | '🔥 Actif'
  | '🏠 En visite' | '📝 Offre' | '📋 Compromis'
  | '🎉 Acte signé' | '💤 Inactif' | '❌ Perdu'

export type Priority = '🔴 Haute' | '🟡 Moyenne' | '⬜ Basse'

export type BienType = 'Appartement'|'Maison'|'Villa'|'Terrain'|'Studio'|'Prestige'|'Commerce'
export type Localisation =
  | 'Fort-de-France' | 'Trois-Îlets' | 'Anse-à-l-Âne'
  | 'Rivière-Salée'  | 'Morne-Rouge' | 'Le Robert'
  | 'Le Lamentin'    | 'Martinique entière' | 'Guadeloupe' | 'Guyane'

export interface Acquereur {
  id: string            // Notion page ID
  acqId?: string        // ACQ-001 auto-increment
  nom: string
  email?: string
  telephone?: string
  statut: PipelineStage
  score: number         // 0-100 calculé par IA
  priorite: Priority
  portailSource?: string
  typeBien?: BienType[]
  localisation?: Localisation[]
  budgetMin?: number
  budgetMax?: number
  delaiAcquisition?: string
  financement?: string
  nbVisites?: number
  nbBiensPropoases?: number
  conseillerAssigne?: string
  datePremierContact?: string
  derniereActivite?: string
  qualiteContact?: string
  succession?: boolean
  notes?: string
  derniereSuggestionIA?: string
  creeLe?: string
  modifieLe?: string
}

export interface Bien {
  id: string
  titre: string
  refSextant?: string
  statut: '🟢 Disponible'|'🟡 Sous offre'|'🔴 Vendu'|'⏸️ Suspendu'
  type?: BienType
  localisation?: string
  prix?: number
  surface?: number
  nbPieces?: number
  lienAnnonce?: string
  conseiller?: string
  exclusivite?: boolean
  scoreMatching?: number
  dateMiseEnLigne?: string
  derniereVerification?: string
}

export interface Activite {
  id: string
  titre: string
  type: string
  direction: string
  statut: string
  resume?: string
  suggestionIA?: string
  prochaineAction?: string
  date?: string
  prochaineRelance?: string
  conseiller?: string
}

// ── Scoring ─────────────────────────────────────────────────────────────────

export interface ScoreDetails {
  total: number
  budget: number       // max 20
  delai: number        // max 20
  typeBien: number     // max 15
  contact: number      // max 15
  activite: number     // max 20
  visites: number      // max 10
}

export interface MatchResult {
  acquereurId: string
  bienId: string
  score: number         // 0-100
  raisons: string[]
  suggestionEmail?: string
}
