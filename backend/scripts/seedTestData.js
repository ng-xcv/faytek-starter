/**
 * Script de seed : crée un jeu de données réalistes et persistantes pour les
 * tests fonctionnels du starter Faytek QHSE.
 *
 * Idempotent : re-lancer ne duplique pas les données (checks par email / code /
 * référence). Les entités créées portent le préfixe `TEST-` quand pertinent
 * pour pouvoir les distinguer facilement en base.
 *
 * Pré-requis :
 *   node scripts/seedProfils.js
 *   node scripts/seedAdmin.js
 *
 * Usage :
 *   node scripts/seedTestData.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const Profil = require('../models/Profil');
const Process = require('../models/Process');
const NonConformite = require('../models/NonConformite');
const Reclamation = require('../models/Reclamation');
const Instance = require('../models/Instance');
const Action = require('../models/Action');

const TEST_PASSWORD = 'Test2026!';

const hoursFromNow = (h) => new Date(Date.now() + h * 3600 * 1000);

async function upsertUser({ email, nom, prenom, profilNom, telephone }) {
  const profil = await Profil.findOne({ nom: profilNom });
  if (!profil) throw new Error(`Profil "${profilNom}" introuvable — seedProfils.js d'abord`);

  const existing = await User.findOne({ email });
  if (existing) {
    if (String(existing.profil) !== String(profil._id)) {
      existing.profil = profil._id;
      await existing.save();
    }
    return existing;
  }
  return User.create({
    email,
    password: TEST_PASSWORD,
    nom,
    prenom,
    profil: profil._id,
    telephone,
    modules: ['default'],
    actif: true,
  });
}

async function upsertProcess({ code, name, description, owner }) {
  const existing = await Process.findOne({ code });
  if (existing) {
    if (owner && String(existing.owner) !== String(owner)) {
      existing.owner = owner;
      await existing.save();
    }
    return existing;
  }
  return Process.create({ code, name, description, owner, actif: true });
}

// Champs métier qu'on (re)met à jour à chaque seed pour maintenir la cohérence
// status/analyse/actions, même sur des enregistrements déjà créés.
const NC_SYNC_FIELDS = [
  'status', 'processes', 'dispatchedBy', 'dispatchedAt', 'dispatchNote',
  'immediateCorrections', 'causeAnalysis', 'correctiveActions',
  'similarNCDetected', 'systemModificationRequired',
  'treatedBy', 'treatedAt', 'closedBy', 'closedAt', 'closureComment',
  'dueDispatchAt', 'dueTreatmentAt', 'dueClosureAt',
];
const RC_SYNC_FIELDS = [
  'status', 'processes', 'assignedTo', 'dispatchedBy', 'dispatchedAt', 'dispatchNote',
  'clientResponses', 'causeAnalysis', 'correctiveActions',
  'clientFeedback', 'closedBy', 'closedAt', 'closureComment', 'satisfactionSurvey',
  'dueDispatchAt', 'dueResponseAt', 'dueTreatmentAt', 'dueClosureAt', 'dueSurveyAt',
];

async function upsertNC(filter, payload) {
  const existing = await NonConformite.findOne(filter);
  if (!existing) return NonConformite.create(payload);
  for (const f of NC_SYNC_FIELDS) {
    if (payload[f] !== undefined) existing[f] = payload[f];
  }
  await existing.save();
  return existing;
}

async function upsertRC(filter, payload) {
  const existing = await Reclamation.findOne(filter);
  if (!existing) return Reclamation.create(payload);
  for (const f of RC_SYNC_FIELDS) {
    if (payload[f] !== undefined) existing[f] = payload[f];
  }
  await existing.save();
  return existing;
}

async function findOrCreateInstance(libelle, payload) {
  const existing = await Instance.findOne({ libelle });
  if (existing) return existing;
  return Instance.create({ libelle, ...payload });
}

async function findOrCreateAction(filter, payload) {
  const existing = await Action.findOne(filter);
  if (existing) return existing;
  return Action.create(payload);
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB connecté');

  // ─── 1. Utilisateurs (en plus de l'admin déjà seedé) ───────────────────────
  console.log('\n👥 Utilisateurs…');
  const users = {
    rq1: await upsertUser({
      email: 'rq1@test.faytek.local',
      nom: 'Diop',
      prenom: 'Aminata',
      profilNom: 'Responsable Qualité',
      telephone: '+221 77 100 01 01',
    }),
    rq2: await upsertUser({
      email: 'rq2@test.faytek.local',
      nom: 'Ndiaye',
      prenom: 'Moussa',
      profilNom: 'Responsable Qualité',
      telephone: '+221 77 100 01 02',
    }),
    pilote1: await upsertUser({
      email: 'pilote.achats@test.faytek.local',
      nom: 'Sow',
      prenom: 'Fatou',
      profilNom: 'Pilote Processus',
      telephone: '+221 77 100 02 01',
    }),
    pilote2: await upsertUser({
      email: 'pilote.prod@test.faytek.local',
      nom: 'Ba',
      prenom: 'Cheikh',
      profilNom: 'Pilote Processus',
      telephone: '+221 77 100 02 02',
    }),
    declarant1: await upsertUser({
      email: 'declarant1@test.faytek.local',
      nom: 'Fall',
      prenom: 'Awa',
      profilNom: 'Déclarant',
      telephone: '+221 77 100 03 01',
    }),
    declarant2: await upsertUser({
      email: 'declarant2@test.faytek.local',
      nom: 'Gueye',
      prenom: 'Omar',
      profilNom: 'Déclarant',
      telephone: '+221 77 100 03 02',
    }),
    consultant: await upsertUser({
      email: 'consultant@test.faytek.local',
      nom: 'Sarr',
      prenom: 'Khady',
      profilNom: 'Consultant',
      telephone: '+221 77 100 04 01',
    }),
  };
  console.log(`   → ${Object.keys(users).length} users (mot de passe : ${TEST_PASSWORD})`);

  // ─── 2. Processus ──────────────────────────────────────────────────────────
  console.log('\n🏭 Processus…');
  const processes = {
    achats: await upsertProcess({ code: 'ACHATS', name: 'Achats & Approvisionnement', description: 'Gestion des fournisseurs et commandes', owner: users.pilote1._id }),
    prod: await upsertProcess({ code: 'PROD', name: 'Production', description: 'Fabrication et assemblage', owner: users.pilote2._id }),
    qual: await upsertProcess({ code: 'QUAL', name: 'Contrôle Qualité', description: 'Inspection et tests', owner: users.rq1._id }),
    rh: await upsertProcess({ code: 'RH', name: 'Ressources Humaines', description: 'Gestion du personnel', owner: users.rq2._id }),
    comm: await upsertProcess({ code: 'COMM', name: 'Commercial & Relation Client', description: 'Vente et SAV', owner: users.rq2._id }),
  };
  console.log(`   → ${Object.keys(processes).length} processus`);

  // ─── 3. Non-Conformités (couvre tous les statuts) ──────────────────────────
  console.log('\n⚠️  Non-Conformités…');
  const ncSeeds = [
    {
      // submitted — tout neuf
      description: 'Lot de 200 vis réceptionné hors tolérance (diamètre 5.1mm au lieu de 5.0mm ±0.05)',
      consequences: 'Arrêt ligne d\'assemblage, retard de 2 jours sur la commande client #4521',
      productOrService: 'product',
      productServiceName: 'Vis M5 inox',
      productServiceDescription: 'Vis tête hexagonale M5x20 inox 316L',
      declaredBy: users.declarant1._id,
      status: 'submitted',
      dueDispatchAt: hoursFromNow(48),
      dueTreatmentAt: hoursFromNow(48 + 168),
      dueClosureAt: hoursFromNow(48 + 168 + 72),
    },
    {
      // submitted en retard (overdue)
      description: 'Erreur de dosage détectée sur le lot pharmaceutique 2026-A112',
      consequences: 'Lot à isoler, perte estimée 18 000 €',
      productOrService: 'product',
      productServiceName: 'Sirop antitussif 150mL',
      productServiceDescription: 'Formule enfant',
      declaredBy: users.declarant2._id,
      status: 'submitted',
      dueDispatchAt: hoursFromNow(-10), // overdue
      dueTreatmentAt: hoursFromNow(160),
      dueClosureAt: hoursFromNow(230),
    },
    {
      // dispatched — déjà des corrections immédiates en place, analyse à venir
      description: 'Fuite hydraulique sur presse P-07 constatée à la prise de poste',
      consequences: 'Ligne à l\'arrêt, risque de glissade (HSE)',
      productOrService: 'service',
      productServiceName: 'Maintenance presse P-07',
      declaredBy: users.declarant1._id,
      processes: [processes.prod._id, processes.qual._id],
      dispatchedBy: users.rq1._id,
      dispatchedAt: hoursFromNow(-20),
      dispatchNote: 'À traiter en priorité, HSE impliqué',
      status: 'dispatched',
      immediateCorrections: [
        { description: 'Zone balisée, absorbant déposé', appliedBy: users.declarant1._id, appliedAt: hoursFromNow(-19) },
        { description: 'Coupure machine et signalement maintenance', appliedBy: users.pilote2._id, appliedAt: hoursFromNow(-18) },
      ],
      dueDispatchAt: hoursFromNow(-20),
      dueTreatmentAt: hoursFromNow(148),
      dueClosureAt: hoursFromNow(220),
    },
    {
      // in_treatment avec analyse 5M
      description: 'Retour client : emballage produit fini abîmé (20% du lot)',
      consequences: 'Réclamation client AXA-Senegal, perte de confiance',
      productOrService: 'product',
      productServiceName: 'Carton expédition format B',
      declaredBy: users.declarant2._id,
      processes: [processes.achats._id, processes.comm._id],
      dispatchedBy: users.rq1._id,
      dispatchedAt: hoursFromNow(-48),
      dispatchNote: 'Vérifier fournisseur + process emballage',
      status: 'in_treatment',
      treatedBy: users.pilote1._id,
      immediateCorrections: [
        { description: 'Re-conditionnement manuel du stock restant', appliedBy: users.pilote1._id },
      ],
      causeAnalysis: {
        method: '5M',
        data: {
          "Main d'œuvre": ['Équipe emballage sous-effectif ce jour'],
          'Matière': ['Cartons stock B de qualité inférieure chez nouveau fournisseur'],
          'Méthode': ['Pas de contrôle systématique à réception'],
          'Machine': [],
          'Milieu': ['Humidité atelier > 70% en saison des pluies'],
        },
        conclusion: 'Cause principale : qualité carton fournisseur + absence contrôle réception',
      },
      correctiveActions: [
        {
          description: 'Changer de fournisseur carton (retour au fournisseur historique)',
          responsible: users.pilote1._id,
          dueDate: hoursFromNow(72),
          status: 'en_cours',
          evaluationCriteria: [
            { label: 'Contrat signé avec ancien fournisseur', score: null, comment: '' },
            { label: 'Premier lot reçu conforme', score: null, comment: '' },
          ],
        },
        {
          description: 'Mettre en place contrôle systématique à réception des cartons',
          responsible: users.rq1._id,
          dueDate: hoursFromNow(120),
          status: 'planifiee',
          evaluationCriteria: [
            { label: 'Procédure de contrôle réception rédigée', score: null, comment: '' },
            { label: 'Équipe formée', score: null, comment: '' },
          ],
        },
        {
          description: 'Étudier déshumidification atelier saison des pluies',
          responsible: users.pilote2._id,
          dueDate: hoursFromNow(240),
          status: 'planifiee',
          evaluationCriteria: [
            { label: 'Devis reçus (3 minimum)', score: null, comment: '' },
          ],
        },
      ],
      similarNCDetected: true,
      systemModificationRequired: false,
      dueDispatchAt: hoursFromNow(-48),
      dueTreatmentAt: hoursFromNow(120),
      dueClosureAt: hoursFromNow(192),
    },
    {
      // pending_closure — analyse 5Y + actions terminées + corrections immédiates
      description: 'Non-respect de la procédure d\'hygiène au poste 3',
      consequences: 'Risque sanitaire, audit client à venir',
      productOrService: 'service',
      productServiceName: 'Poste de conditionnement 3',
      declaredBy: users.rq2._id,
      processes: [processes.rh._id, processes.qual._id],
      dispatchedBy: users.rq1._id,
      dispatchedAt: hoursFromNow(-72),
      status: 'pending_closure',
      treatedBy: users.rq2._id,
      treatedAt: hoursFromNow(-10),
      immediateCorrections: [
        { description: 'Distributeur de charlottes réapprovisionné le jour même', appliedBy: users.rq2._id, appliedAt: hoursFromNow(-70) },
        { description: 'Rappel verbal à l\'équipe', appliedBy: users.pilote2._id, appliedAt: hoursFromNow(-65) },
      ],
      causeAnalysis: {
        method: '5Y',
        data: {
          problem: 'Opérateur n\'a pas porté la charlotte',
          whys: [
            'Charlottes manquantes au distributeur',
            'Commande non passée cette semaine',
            'Responsable stock en congé non remplacé',
            'Pas de backup désigné',
            'Procédure de backup non documentée',
          ],
        },
        conclusion: 'Absence de procédure de délégation en cas d\'absence',
      },
      correctiveActions: [
        {
          description: 'Rédiger la procédure de délégation responsable stock',
          responsible: users.rq2._id,
          dueDate: hoursFromNow(-12),
          status: 'realisee',
          evaluationCriteria: [
            { label: 'Procédure validée et diffusée', score: 100, comment: 'OK' },
          ],
          effectivenessScore: 100,
        },
        {
          description: 'Mettre en place alerte stock minimum sur consommables HSE',
          responsible: users.pilote1._id,
          dueDate: hoursFromNow(-6),
          status: 'realisee',
          evaluationCriteria: [
            { label: 'Alerte automatique configurée', score: 100, comment: '' },
          ],
          effectivenessScore: 100,
        },
        {
          description: 'Former équipe poste 3 sur la procédure hygiène mise à jour',
          responsible: users.rq2._id,
          dueDate: hoursFromNow(-2),
          status: 'realisee',
          evaluationCriteria: [
            { label: 'Tous les opérateurs formés', score: 90, comment: '1 absent à reprogrammer' },
          ],
          effectivenessScore: 90,
        },
      ],
      systemModificationRequired: true,
      systemModificationJustification: 'Mise à jour procédure backup + ajout alerte stock dans le SI',
      dueDispatchAt: hoursFromNow(-72),
      dueTreatmentAt: hoursFromNow(-10),
      dueClosureAt: hoursFromNow(62),
    },
    {
      // closed — workflow complet avec analyse Ishikawa structurée + actions évaluées
      description: 'Écart de poids net sur lot #2025-Z-003',
      consequences: 'Réétiquetage nécessaire, coût matière supplémentaire',
      productOrService: 'product',
      productServiceName: 'Sachet 500g thé vert',
      declaredBy: users.declarant1._id,
      processes: [processes.prod._id],
      dispatchedBy: users.rq1._id,
      dispatchedAt: hoursFromNow(-200),
      dispatchNote: 'À diagnostiquer rapidement, écart répété',
      status: 'closed',
      treatedBy: users.pilote2._id,
      treatedAt: hoursFromNow(-100),
      closedBy: users.rq1._id,
      closedAt: hoursFromNow(-40),
      closureComment: 'Calibration balance refaite + contrôle hebdomadaire planifié. Efficacité confirmée sur les 3 lots suivants.',
      immediateCorrections: [
        { description: 'Lot #2025-Z-003 réétiqueté avec poids réel', appliedBy: users.pilote2._id, appliedAt: hoursFromNow(-198) },
      ],
      causeAnalysis: {
        method: 'Ishikawa',
        data: {
          "Main d'œuvre": ['Opérateur ligne B nouveau, formation incomplète'],
          'Matière': ['Densité variable selon lot de thé'],
          'Méthode': ['Pas de calibration hebdomadaire formalisée'],
          'Machine': ['Balance dérive après 6 mois sans recal'],
          'Milieu': ['Vibrations atelier voisin'],
        },
        conclusion: 'Cause racine : absence de plan de calibration + balance vieillissante',
      },
      correctiveActions: [
        {
          description: 'Calibration complète balance ligne B par fournisseur',
          responsible: users.pilote2._id,
          dueDate: hoursFromNow(-150),
          status: 'realisee',
          evaluationCriteria: [
            { label: 'Certificat de calibration reçu', score: 100, comment: '' },
            { label: 'Écart < 1g sur 10 mesures test', score: 100, comment: '' },
          ],
          effectivenessScore: 100,
        },
        {
          description: 'Mettre en place plan de calibration hebdomadaire (toutes balances)',
          responsible: users.rq1._id,
          dueDate: hoursFromNow(-80),
          status: 'realisee',
          evaluationCriteria: [
            { label: 'Plan diffusé et appliqué', score: 100, comment: '' },
            { label: 'Suivi des écarts hebdo', score: 95, comment: '1 oubli en semaine 12' },
          ],
          effectivenessScore: 95,
        },
        {
          description: 'Re-former opérateur ligne B sur procédure pesée',
          responsible: users.pilote2._id,
          dueDate: hoursFromNow(-110),
          status: 'realisee',
          evaluationCriteria: [
            { label: 'Test de compétence validé', score: 100, comment: '' },
          ],
          effectivenessScore: 100,
        },
      ],
      systemModificationRequired: false,
      dueDispatchAt: hoursFromNow(-200),
      dueTreatmentAt: hoursFromNow(-50),
      dueClosureAt: hoursFromNow(-10),
    },
  ];

  const createdNCs = [];
  for (const nc of ncSeeds) {
    const created = await upsertNC(
      { description: nc.description },
      nc
    );
    createdNCs.push(created);
  }
  console.log(`   → ${createdNCs.length} NC (références auto : ${createdNCs.map((n) => n.reference).join(', ')})`);

  // ─── 4. Réclamations ───────────────────────────────────────────────────────
  console.log('\n📞 Réclamations…');
  const rcSeeds = [
    {
      source: 'call',
      client: { nom: 'Diouf', prenom: 'Mariama', email: 'm.diouf@example.sn', telephone: '+221 77 555 10 10', societe: 'Diouf & Cie' },
      objet: 'Livraison incomplète commande #8842',
      description: '3 cartons sur 10 manquants, urgent pour ouverture magasin samedi',
      priorite: 'haute',
      declaredBy: users.rq1._id,
      status: 'submitted',
      dueDispatchAt: hoursFromNow(24),
      dueResponseAt: hoursFromNow(48),
    },
    {
      source: 'mail',
      sourceDetail: 'reclamations@faytek.com',
      client: { nom: 'Kane', prenom: 'Ibrahima', email: 'i.kane@entreprise.sn', telephone: '+221 77 555 20 20', societe: 'Kane Distribution' },
      objet: 'Produit reçu abîmé — carton écrasé',
      description: '2 unités sur 5 inutilisables. Demande remboursement ou remplacement.',
      priorite: 'normale',
      declaredBy: users.declarant1._id,
      processes: [processes.comm._id],
      dispatchedBy: users.rq1._id,
      dispatchedAt: hoursFromNow(-5),
      assignedTo: users.pilote1._id,
      clientResponses: [
        { message: 'Bonjour M. Kane, nous prenons en charge votre demande sous 48h.', channel: 'mail', sentBy: users.rq1._id, sentAt: hoursFromNow(-4) },
      ],
      status: 'responded',
      dueDispatchAt: hoursFromNow(-5),
      dueResponseAt: hoursFromNow(43),
      dueTreatmentAt: hoursFromNow(163),
    },
    {
      source: 'whatsapp',
      sourceDetail: '+221 77 888 99 00',
      client: { nom: 'Ndao', prenom: 'Aïcha', email: 'aicha.ndao@gmail.com', telephone: '+221 77 888 99 00' },
      objet: 'Retard de livraison 5 jours',
      description: 'Commande passée il y a 10 jours, toujours rien. Pas de communication.',
      priorite: 'haute',
      declaredBy: users.rq2._id,
      processes: [processes.comm._id, processes.prod._id],
      dispatchedBy: users.rq2._id,
      dispatchedAt: hoursFromNow(-30),
      assignedTo: users.pilote2._id,
      clientResponses: [
        { message: 'Livraison en cours, arrivée prévue demain.', channel: 'whatsapp', sentBy: users.rq2._id, sentAt: hoursFromNow(-28) },
      ],
      causeAnalysis: {
        method: '5M',
        data: {
          "Main d'œuvre": ['Commercial absent en congé, dossier non transféré'],
          'Matière': [],
          'Méthode': ['Pas d\'alerte automatique sur délai > 7j', 'Pas de relance client systématique'],
          'Machine': ['ERP ne déclenche pas d\'alerte'],
          'Milieu': [],
        },
        conclusion: 'Process de suivi défaillant + outil non configuré',
      },
      correctiveActions: [
        {
          description: 'Configurer alerte ERP délai > 7 jours',
          responsible: users.pilote1._id,
          dueDate: hoursFromNow(48),
          status: 'planifiee',
        },
        {
          description: 'Mettre en place procédure de transfert dossiers en cas d\'absence',
          responsible: users.rq2._id,
          dueDate: hoursFromNow(120),
          status: 'planifiee',
        },
      ],
      status: 'in_analysis',
      dueDispatchAt: hoursFromNow(-30),
      dueResponseAt: hoursFromNow(18),
      dueTreatmentAt: hoursFromNow(138),
    },
    {
      source: 'sms',
      client: { nom: 'Seck', prenom: 'Pape', email: '', telephone: '+221 78 111 22 33' },
      objet: 'Facturation erronée',
      description: 'Montant facturé 45000 FCFA au lieu de 38000 FCFA annoncés',
      priorite: 'normale',
      declaredBy: users.rq1._id,
      processes: [processes.comm._id],
      dispatchedBy: users.rq1._id,
      dispatchedAt: hoursFromNow(-100),
      status: 'pending_closure',
      causeAnalysis: {
        method: '5Y',
        data: {
          problem: 'Client facturé 45000 FCFA au lieu de 38000 FCFA',
          whys: [
            'Mauvaise grille tarifaire appliquée',
            'Grille T1 utilisée alors que client en T2',
            'Mise à jour grille non répercutée dans l\'ERP',
            'Process de mise à jour tarifs manuel',
            'Pas de check automatique cohérence devis/facture',
          ],
        },
        conclusion: 'Absence de contrôle automatique tarif devis vs facture',
      },
      correctiveActions: [
        {
          description: 'Avoir de 7000 FCFA émis',
          responsible: users.rq1._id,
          dueDate: hoursFromNow(-50),
          status: 'realisee',
          evaluationCriteria: [{ label: 'Avoir reçu par client', score: 100, comment: 'Confirmé par mail' }],
          effectivenessScore: 100,
        },
        {
          description: 'Automatiser contrôle tarif devis vs facture dans ERP',
          responsible: users.pilote1._id,
          dueDate: hoursFromNow(-30),
          status: 'realisee',
          evaluationCriteria: [
            { label: 'Règle ERP active', score: 100, comment: '' },
            { label: 'Test sur 5 nouvelles factures OK', score: 100, comment: '' },
          ],
          effectivenessScore: 100,
        },
        {
          description: 'Mettre à jour procédure de mise à jour des grilles tarifaires',
          responsible: users.rq2._id,
          dueDate: hoursFromNow(-20),
          status: 'realisee',
          evaluationCriteria: [{ label: 'Procédure validée et diffusée', score: 100, comment: '' }],
          effectivenessScore: 100,
        },
      ],
      clientResponses: [
        { message: 'Cher M. Seck, avoir de 7000 FCFA émis.', channel: 'sms', sentBy: users.rq1._id, sentAt: hoursFromNow(-48) },
      ],
      dueDispatchAt: hoursFromNow(-100),
      dueResponseAt: hoursFromNow(-76),
      dueTreatmentAt: hoursFromNow(28),
      dueClosureAt: hoursFromNow(100),
    },
    {
      source: 'employe',
      sourceDetail: 'Remonté en réunion équipe',
      client: { nom: 'Touré', prenom: 'Salif', email: 's.toure@client.sn', telephone: '+221 77 222 33 44', societe: 'Touré SA' },
      objet: 'Produit conforme mais attente anormale en magasin',
      description: 'Client est resté 45 min en attente à la remise. Service à améliorer.',
      priorite: 'basse',
      declaredBy: users.declarant2._id,
      processes: [processes.comm._id],
      dispatchedBy: users.rq2._id,
      dispatchedAt: hoursFromNow(-300),
      status: 'survey_completed',
      closedBy: users.rq2._id,
      closedAt: hoursFromNow(-150),
      closureComment: 'Formation équipe accueil réalisée, process revu, temps d\'attente moyen ramené à 12 min.',
      causeAnalysis: {
        method: 'Ishikawa',
        data: {
          "Main d'œuvre": ['Équipe accueil sous-effectif samedi', 'Manque de formation gestion file d\'attente'],
          'Matière': [],
          'Méthode': ['Pas de système de tickets', 'Pas de priorisation des clients pros'],
          'Machine': ['Système caisse lent en pic d\'affluence'],
          'Milieu': ['Espace d\'attente exigu'],
        },
        conclusion: 'Pic d\'affluence non anticipé + outils inadaptés',
      },
      correctiveActions: [
        {
          description: 'Formation équipe accueil (gestion files, posture client)',
          responsible: users.rq2._id,
          dueDate: hoursFromNow(-100),
          status: 'realisee',
          evaluationCriteria: [
            { label: 'Tous formés', score: 100, comment: '' },
            { label: 'Évaluation à chaud > 80%', score: 92, comment: '' },
          ],
          effectivenessScore: 92,
        },
        {
          description: 'Mettre en place système de tickets numérique',
          responsible: users.pilote1._id,
          dueDate: hoursFromNow(-80),
          status: 'realisee',
          evaluationCriteria: [
            { label: 'Système opérationnel', score: 100, comment: '' },
            { label: 'Temps d\'attente moyen < 15 min', score: 100, comment: 'Mesuré à 12 min' },
          ],
          effectivenessScore: 100,
        },
        {
          description: 'Renfort équipe samedi (+1 personne)',
          responsible: users.rq2._id,
          dueDate: hoursFromNow(-90),
          status: 'realisee',
          evaluationCriteria: [{ label: 'Planning ajusté', score: 100, comment: '' }],
          effectivenessScore: 100,
        },
      ],
      clientFeedback: { received: true, receivedAt: hoursFromNow(-140), effective: true, rating: 4, comment: 'Satisfait de la réactivité', collectedBy: users.rq2._id },
      satisfactionSurvey: {
        sent: true,
        sentAt: hoursFromNow(-130),
        sentBy: users.rq2._id,
        token: 'test-survey-token-rc-005',
        responded: true,
        respondedAt: hoursFromNow(-125),
        scores: { traitement: 4, delai: 3, communication: 5, resolution: 4 },
        nps: 8,
        comment: 'Bon suivi, à recommander à mon réseau',
      },
      dueDispatchAt: hoursFromNow(-300),
      dueResponseAt: hoursFromNow(-280),
      dueTreatmentAt: hoursFromNow(-155),
      dueClosureAt: hoursFromNow(-100),
      dueSurveyAt: hoursFromNow(-127),
    },
  ];

  const createdRCs = [];
  for (const rc of rcSeeds) {
    const created = await upsertRC(
      { 'client.telephone': rc.client.telephone, objet: rc.objet },
      rc
    );
    createdRCs.push(created);
  }
  console.log(`   → ${createdRCs.length} RC (références : ${createdRCs.map((r) => r.reference).join(', ')})`);

  // ─── 5. Plans d'actions ────────────────────────────────────────────────────
  console.log('\n📋 Plans d\'actions…');
  const inst1 = await findOrCreateInstance('Plan qualité fournisseurs 2026', {
    description: 'Audit et amélioration panel fournisseurs',
    responsable: users.rq1._id,
    lieu: 'Siège',
    type: { valeur: 'Shared' },
  });
  const inst2 = await findOrCreateInstance('Amélioration continue production', {
    description: 'Suivi actions issues des NC production',
    responsable: users.pilote2._id,
    lieu: 'Atelier',
    type: { valeur: 'Shared' },
  });
  const inst3 = await findOrCreateInstance('Actions personnelles Aminata', {
    description: 'Suivi individuel',
    responsable: users.rq1._id,
    type: { valeur: 'Perso', _id: users.rq1._id },
  });
  console.log(`   → 3 instances (${inst1.numero}, ${inst2.numero}, ${inst3.numero})`);

  const actionSeeds = [
    // inst1 — Plan qualité fournisseurs
    { description: 'Audit du fournisseur carton (site + échantillonnage)', responsable: users.pilote1._id, instance: inst1._id, dateDeb: hoursFromNow(-48), dateFin: hoursFromNow(120), priorite: 'Haute' },
    { description: 'Appel d\'offres 3 fournisseurs alternatifs', responsable: users.pilote1._id, instance: inst1._id, dateDeb: hoursFromNow(-24), dateFin: hoursFromNow(240), priorite: 'Moyenne' },
    { description: 'Rédiger grille d\'évaluation fournisseur', responsable: users.rq1._id, instance: inst1._id, dateDeb: hoursFromNow(-72), dateFin: hoursFromNow(-24), priorite: 'Haute', etat: [{ etat: 'Créée' }, { etat: 'Faite', by: users.rq1._id }, { etat: 'Validée', by: users.rq2._id }] },
    { description: 'Présentation comité qualité T2', responsable: users.rq2._id, instance: inst1._id, dateDeb: hoursFromNow(100), dateFin: hoursFromNow(400), priorite: 'Basse' },
    // inst2 — Production
    { description: 'Calibration mensuelle balances ligne B', responsable: users.pilote2._id, instance: inst2._id, dateDeb: hoursFromNow(-200), dateFin: hoursFromNow(-100), priorite: 'Haute', etat: [{ etat: 'Créée' }, { etat: 'Faite', by: users.pilote2._id }, { etat: 'Validée', by: users.rq1._id }] },
    { description: 'Remplacement joint hydraulique presse P-07', responsable: users.pilote2._id, instance: inst2._id, dateDeb: hoursFromNow(-10), dateFin: hoursFromNow(-2), priorite: 'Haute' },
    { description: 'Formation sécurité équipe poste 3', responsable: users.rq2._id, instance: inst2._id, dateDeb: hoursFromNow(24), dateFin: hoursFromNow(-48), priorite: 'Haute' }, // en retard (dateFin < now)
    { description: 'Mise à jour procédure hygiène', responsable: users.rq2._id, instance: inst2._id, dateDeb: hoursFromNow(-100), dateFin: hoursFromNow(-30), priorite: 'Moyenne' }, // en retard
    { description: 'Audit interne HSE trimestriel', responsable: users.rq1._id, instance: inst2._id, dateDeb: hoursFromNow(48), dateFin: hoursFromNow(500), priorite: 'Moyenne' },
    // inst3 — Perso Aminata
    { description: 'Revue hebdomadaire avec pilotes', responsable: users.rq1._id, instance: inst3._id, dateDeb: hoursFromNow(0), dateFin: hoursFromNow(168), priorite: 'Basse' },
    { description: 'Rédiger rapport mensuel QHSE', responsable: users.rq1._id, instance: inst3._id, dateDeb: hoursFromNow(-48), dateFin: hoursFromNow(-12), priorite: 'Moyenne' }, // en retard
    { description: 'Planifier formation ISO 9001 équipe', responsable: users.rq1._id, instance: inst3._id, dateDeb: hoursFromNow(72), dateFin: hoursFromNow(720), priorite: 'Basse' },
  ];

  let actionCount = 0;
  for (const a of actionSeeds) {
    await findOrCreateAction({ description: a.description, instance: a.instance }, a);
    actionCount++;
  }
  console.log(`   → ${actionCount} actions`);

  // ─── Résumé ────────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Seed de test terminé');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Mot de passe commun (tous users de test) : ${TEST_PASSWORD}`);
  console.log('\nComptes de test :');
  Object.entries(users).forEach(([k, u]) => console.log(`  • [${k.padEnd(10)}] ${u.email}`));
  console.log('\nAdmin existant  : fayteksolution@gmail.com / Faytek2026!');
}

seed()
  .catch((err) => {
    console.error('\n❌ Erreur seed :', err.message);
    console.error(err.stack);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    process.exit(process.exitCode || 0);
  });
