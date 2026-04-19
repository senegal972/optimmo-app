# 🏝️ Optimmo Dom — CRM Pipeline

Application web de suivi acquéreurs avec IA, construite sur **Next.js 14 + Notion + Claude API**, hébergée sur **Vercel**.

## Stack technique

| Couche | Technologie |
|--------|------------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Base de données | Notion API |
| IA | Anthropic Claude API (claude-sonnet-4) |
| Hébergement | Vercel (avec Cron Jobs) |
| Emails | Resend |

## Fonctionnalités

- **Pipeline Kanban** — 9 stades, glisser-déposer visuel
- **Scoring IA automatique** — 0-100 pts, recalculé chaque lundi
- **Matching acquéreur ↔ bien** — Claude analyse la compatibilité
- **Suggestions de relance** — Email personnalisé par Claude pour chaque inactif
- **Scraping hebdo** — Pages Sextant des 3 conseillers
- **Rapport pipeline** — Brief IA chaque lundi matin

## Démarrage rapide

### 1. Variables d'environnement

Copier `.env.local.example` en `.env.local` et remplir :

```bash
cp .env.local.example .env.local
```

Valeurs requises :
- `NOTION_API_KEY` — [Créer une intégration](https://www.notion.so/my-integrations)
- `NOTION_ACQUEREURS_DB` — `11b1edbd9fd04319ba3a708cdb0db6c4`
- `NOTION_BIENS_DB` — `d7b1ec4b954b45a4a252d5e9ee564d92`
- `NOTION_ACTIVITES_DB` — `cf732b46fb634d949ad22b8a5d692688`
- `ANTHROPIC_API_KEY` — [console.anthropic.com](https://console.anthropic.com)
- `CRON_SECRET` — Générer : `openssl rand -base64 32`

### 2. Partager les bases Notion avec l'intégration

Dans chaque base Notion → `...` → `Connexions` → ajouter votre intégration.

### 3. Installer et lancer

```bash
npm install
npm run dev
```

App disponible sur [http://localhost:3000](http://localhost:3000)

### 4. Importer les 89 leads Gmail

```bash
NOTION_API_KEY=secret_xxx npx ts-node scripts/import-leads.ts
```

### 5. Déploiement Vercel

```bash
npm install -g vercel
vercel --prod
```

Puis dans le dashboard Vercel :
- Ajouter toutes les variables d'environnement
- Le cron job s'exécutera automatiquement chaque lundi à 7h (heure Martinique)

## Structure du projet

```
optimmo-app/
├── app/
│   ├── page.tsx              # Dashboard principal
│   ├── pipeline/page.tsx     # Kanban pipeline
│   ├── leads/
│   │   ├── page.tsx          # Liste leads avec filtres
│   │   └── [id]/page.tsx     # Fiche individuelle + IA
│   ├── biens/page.tsx        # Catalogue biens
│   └── api/
│       ├── score/recalculate/  # Recalcul scores
│       ├── match/run/          # Matching IA
│       └── cron/weekly/        # Cron hebdomadaire
├── lib/
│   ├── notion.ts             # Client Notion (CRUD)
│   ├── scoring.ts            # Algorithme de scoring
│   ├── ai.ts                 # Intégration Claude API
│   ├── scraper.ts            # Scraping Sextant
│   └── types.ts              # Types TypeScript
├── scripts/
│   └── import-leads.ts       # Import initial 89 leads
└── vercel.json               # Config crons Vercel
```

## Scoring (0-100)

| Critère | Pts max |
|---------|---------|
| Budget défini (min + max) | 20 |
| Délai urgent (< 3 mois) | 20 |
| Activité récente (< 7j) | 20 |
| Type de bien précisé | 15 |
| Email + téléphone confirmés | 15 |
| Visites réalisées | 10 |

- **Score ≥ 60** → 🔴 Haute priorité
- **Score 30-59** → 🟡 Moyenne priorité
- **Score < 30** → ⬜ Basse priorité

## Cron hebdomadaire (lundi 7h martinique)

1. Scraping des annonces Sextant (3 conseillers)
2. Recalcul des scores de tous les acquéreurs actifs
3. Génération rapport pipeline par Claude
4. Suggestions de relance pour inactifs > 14 jours

## Prochaines étapes (Sprint 4)

- [ ] Envoi automatique des emails de relance (Resend)
- [ ] Formulaire d'ajout/édition de leads dans l'app
- [ ] Notifications Slack/email du rapport hebdo
- [ ] Tableau de bord Vercel Analytics
