#!/usr/bin/env ts-node
// scripts/import-leads.ts
// Usage : NOTION_API_KEY=xxx ts-node scripts/import-leads.ts

import { createAcquereur } from '../lib/notion'
import { calculerScore, getPrioriteFromScore } from '../lib/scoring'
import type { Acquereur } from '../lib/types'

// Les 89 leads extraits de Gmail - à adapter selon le fichier Excel final
const LEADS: Partial<Acquereur>[] = [
  // 2026
  { nom: 'Mosiah Arthus',       email: 'arthus.m@hotmail.fr',           portailSource: 'Leboncoin', typeBien: ['Maison'],      localisation: ['Morne-Rouge'],     budgetMax: 150000, datePremierContact: '2026-04-19', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Wayne Lockhart',      email: 'lockhart.wayne@gmail.com',       portailSource: 'Leboncoin', typeBien: ['Appartement'], localisation: ['Fort-de-France'],   budgetMax: 195000, datePremierContact: '2026-04-18', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Naveena Kamalakaran', email: 'naveena.kamalakaran@gmail.com',  portailSource: 'BienIci',   typeBien: ['Appartement'], localisation: ['Fort-de-France'],   datePremierContact: '2026-04-03', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Mandyne Julien',      email: 'mandyne.julien@gmail.com',       portailSource: 'Leboncoin', typeBien: ['Villa'],       localisation: ['Anse-à-l-Âne'],    budgetMax: 279000, datePremierContact: '2026-04-14', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Dorryhee Vimla',      email: 'dorryhee.vimla@gmail.com',       portailSource: 'Direct',    typeBien: ['Maison'],      localisation: ['Fort-de-France'],   budgetMax: 150000, datePremierContact: '2026-03-31', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Corinne Victorin',    email: 'corinevic3@gmail.com',           telephone: '+596696063541', portailSource: 'SeLoger',  typeBien: ['Appartement'], localisation: ['Trois-Îlets'], budgetMax: 160000, delaiAcquisition: '⚡ Urgent < 3 mois', datePremierContact: '2026-03-25', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Clarisse Bellina',    email: 'frz.clarisse@gmail.com',         telephone: '+33781314610',  portailSource: 'SeLoger',  typeBien: ['Maison'],      datePremierContact: '2026-03-06', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Claudine Sejean',     email: 'claudine.sejean@gmail.com',      portailSource: 'Leboncoin', typeBien: ['Maison'],      localisation: ['Morne-Rouge'],     budgetMax: 150000, datePremierContact: '2026-03-16', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Sophia Joubert',      email: 'joubert24700@gmail.com',         portailSource: 'Leboncoin', typeBien: ['Maison'],      localisation: ['Morne-Rouge'],     budgetMax: 150000, datePremierContact: '2026-03-14', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Roy [?]',             email: 'micka_r@hotmail.fr',             telephone: '0671427672',    portailSource: 'portail-immo.fr', typeBien: ['Appartement'], localisation: ['Fort-de-France'], budgetMax: 195000, datePremierContact: '2026-02-26', conseillerAssigne: 'Franck Fidi' },
  { nom: 'A. Alcim',            email: 'a.alcim@hotmail.fr',             telephone: '0696617290',    portailSource: 'sextantfrance.fr', typeBien: ['Appartement'], localisation: ['Fort-de-France'], budgetMax: 195000, datePremierContact: '2026-02-05', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Christophe [Chalon]', email: 'christophe.fpchalon@gmail.com',  portailSource: 'BienIci',   typeBien: ['Maison'],      localisation: ['Trois-Îlets'],     datePremierContact: '2026-02-22', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Roger Pais',          email: 'roger.pais@hotmail.fr',          portailSource: 'Leboncoin', typeBien: ['Terrain'],     localisation: ['Le Lamentin'],     datePremierContact: '2026-03-21', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Benoît Paupe',        email: 'paupe.benoit@gmail.com',         portailSource: 'Leboncoin', typeBien: ['Villa'],       localisation: ['Anse-à-l-Âne'],   budgetMax: 279000, datePremierContact: '2026-02-07', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Yorick Blanchet',     email: 'yorickblanchet@hotmail.fr',      portailSource: 'Leboncoin', typeBien: ['Villa'],       localisation: ['Anse-à-l-Âne'],   budgetMax: 279000, datePremierContact: '2026-02-04', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Sébastien Souraya',   email: 'sebastien.souraya@gmail.com',    portailSource: 'Direct',    typeBien: ['Appartement'], localisation: ['Fort-de-France'],   budgetMax: 195000, datePremierContact: '2026-01-25', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Raoul Chassol',       email: 'leonchassol@gmail.com',          telephone: '0696272777',    portailSource: 'Figaro Immo', typeBien: ['Terrain'], localisation: ['Rivière-Salée'], budgetMax: 93800, datePremierContact: '2026-01-24', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Valérie Pourtales',   email: 'vpourtales@orange.fr',           portailSource: 'BienIci',   typeBien: ['Terrain'],     localisation: ['Rivière-Salée'],   budgetMax: 93800,  datePremierContact: '2026-01-15', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Kathleen Melan',      email: 'kathleen.melan@gmail.com',       portailSource: 'Direct',    typeBien: ['Villa'],       localisation: ['Trois-Îlets'],     budgetMax: 450000, datePremierContact: '2026-01-12', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Jonathan Sillam',     email: 'jsillam.pro@gmail.com',          portailSource: 'Direct',    typeBien: ['Villa','Prestige'], localisation: ['Trois-Îlets'], budgetMax: 800000, delaiAcquisition: '⚡ Urgent < 3 mois', datePremierContact: '2025-12-10', conseillerAssigne: 'Franck Fidi' },
  // 2025
  { nom: 'Yann Nabat',          email: 'nabat.yann72@orange.fr',         telephone: '0688281331',    portailSource: 'Leboncoin', typeBien: ['Villa'], localisation: ['Trois-Îlets'], budgetMax: 450000, datePremierContact: '2025-09-29', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Laurence Ciserane',   email: 'ciseranemaryon@gmail.com',       telephone: '0613270985',    portailSource: 'sextantfrance.fr', typeBien: ['Appartement'], localisation: ['Fort-de-France'], datePremierContact: '2025-10-19', notes: 'Couple fonctionnaires antillais métropole – sans travaux', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Valérie Permal',      email: 'valeriepermal52@gmail.com',      telephone: '0696085303',    portailSource: 'BienIci',   typeBien: ['Appartement'], localisation: ['Fort-de-France'], budgetMax: 215000, datePremierContact: '2025-09-15', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Marie-Pierre Martin', email: 'loriotmartin@hotmail.fr',        telephone: '0659418104',    portailSource: 'BienIci',   typeBien: ['Maison'], localisation: ['Trois-Îlets'], budgetMax: 840000, datePremierContact: '2025-09-16', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Ramona Césaire',      email: 'ramona@orange.fr',               telephone: '0696263880',    portailSource: 'BienIci',   typeBien: ['Terrain'], localisation: ['Rivière-Salée'], budgetMax: 93800, datePremierContact: '2025-09-01', notes: 'A aussi un bien à vendre', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Charlène Suric',      email: 'charlene.suric@gmail.com',       portailSource: 'SeLoger',   typeBien: ['Maison'],      localisation: ['Trois-Îlets'],     datePremierContact: '2025-08-22', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Olivia Hauteville',   email: 'olivia.hauteville@wanadoo.fr',   portailSource: 'Leboncoin', typeBien: ['Terrain'],     localisation: ['Rivière-Salée'],   budgetMax: 93800,  datePremierContact: '2025-08-15', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Jean-Paul Jacques-Sébastien', email: 'jeanpaul.jacquessebastien@gmail.com', telephone: '0696411798', portailSource: 'BienIci', typeBien: ['Studio','Appartement'], localisation: ['Le Robert'], budgetMax: 79400, datePremierContact: '2025-07-11', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Stefan Bennett',      email: 'bennettstefan085@gmail.com',     telephone: '0618616915',    portailSource: 'BienIci',   typeBien: ['Studio'],      localisation: ['Le Robert'],   budgetMax: 79400,  datePremierContact: '2025-05-26', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Andrea Gros-Dubois',  email: 'immo.andreagrosdubois@gmail.com', portailSource: 'BienIci',  typeBien: ['Terrain'],     localisation: ['Rivière-Salée'],   budgetMax: 93800,  datePremierContact: '2025-06-16', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Laina Colombe',       email: 'colombe.laina@gmail.com',        portailSource: 'Leboncoin', typeBien: ['Villa'],       localisation: ['Martinique entière'], budgetMax: 450000, datePremierContact: '2025-10-30', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Mathilde Pizon',      email: 'mathilde.soline1991@gmail.com',  portailSource: 'Leboncoin', typeBien: ['Villa'],       localisation: ['Anse-à-l-Âne'],   budgetMax: 279000, datePremierContact: '2025-10-04', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Guillaume Rollin',    email: 'rollin.guillaume@gmail.com',     portailSource: 'Direct',    typeBien: ['Villa','Prestige'], localisation: ['Trois-Îlets'], budgetMax: 839000, datePremierContact: '2025-12-15', conseillerAssigne: 'Franck Fidi' },
  // 2024
  { nom: 'Claudine Hamony',     email: 'claudinehamony@yahoo.com',       portailSource: 'Leboncoin', typeBien: ['Terrain'],     localisation: ['Rivière-Salée'],   budgetMax: 94000,  datePremierContact: '2024-08-20', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Claire-Marie Dufour', email: 'clairemariedufour@gmail.com',    portailSource: 'Leboncoin', typeBien: ['Terrain'],     localisation: ['Rivière-Salée'],   budgetMax: 93800,  datePremierContact: '2024-12-26', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Rosine Jenny',        email: 'jennyrose2211@gmail.com',        telephone: '0696601329',    portailSource: 'SeLoger',   typeBien: ['Terrain'],     localisation: ['Rivière-Salée'],   budgetMax: 93990, datePremierContact: '2024-12-07', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Georges-Edwing Flam', email: 'benchargeuse@gmail.com',         portailSource: 'Leboncoin', typeBien: ['Studio'],      localisation: ['Le Robert'],       budgetMax: 79500,  datePremierContact: '2024-07-17', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Jeannine Darbonnel',  email: 'jeannine.darbonnel@gmail.com',   portailSource: 'BienIci',   typeBien: ['Appartement'], localisation: ['Le Robert'],       datePremierContact: '2024-03-16', conseillerAssigne: 'Franck Fidi' },
  // 2023
  { nom: 'Andrea Resin',        email: 'resin.andrea@gmail.com',         telephone: '0696318995',    portailSource: 'SeLoger',  typeBien: ['Terrain'],     localisation: ['Fort-de-France'],  datePremierContact: '2023-03-23', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Stephen Masson',      email: 's.masson972@gmail.com',          portailSource: 'Leboncoin', typeBien: ['Appartement','Studio'], localisation: ['Le Robert'], budgetMax: 85000, datePremierContact: '2023-05-19', conseillerAssigne: 'Franck Fidi' },
  { nom: 'Mélissandre Boinot',  email: 'melissandreboinot@gmail.com',    portailSource: 'BienIci',   typeBien: ['Appartement'], localisation: ['Le Robert'],       datePremierContact: '2023-11-18', conseillerAssigne: 'Franck Fidi' },
]

async function main() {
  console.log(`🚀 Import de ${LEADS.length} leads vers Notion...`)
  let ok = 0, err = 0

  for (const lead of LEADS) {
    try {
      const details = calculerScore(lead as Acquereur)
      const score = details.total
      const priorite = getPrioriteFromScore(score)

      await createAcquereur({
        ...lead,
        score,
        priorite,
        statut: '🆕 Lead',
        qualiteContact: lead.email && lead.telephone
          ? '⭐⭐⭐ Très qualifié'
          : lead.email ? '⭐⭐ Qualifié' : '⭐ À qualifier',
      })
      console.log(`  ✅ ${lead.nom} (score: ${score})`)
      ok++
    } catch (e) {
      console.error(`  ❌ ${lead.nom}:`, e)
      err++
    }

    // Délai pour éviter le rate limiting Notion
    await new Promise(r => setTimeout(r, 350))
  }

  console.log(`\n✅ Import terminé : ${ok} succès, ${err} erreurs`)
}

main().catch(console.error)
