# BUGS.md — Rapport de recette Faytek Starter

> Rapport maintenu par l'agent `qhse-tester` (voir `.claude/agents/qhse-tester.md`).
> Re-générer : invoquer l'agent via l'outil Agent avec `subagent_type: "qhse-tester"`.

---

## Dernier audit

- **Date** : _non audité_
- **Commit** : _n/a_
- **Environnement** : _n/a_
- **Seed de test** : _non lancé_

### Résumé
- P0 (bloquants)  : —
- P1 (majeurs)    : —
- P2 (mineurs)    : —
- P3 (cosmétique) : —

### Tests passés
_(à remplir après le premier audit)_

---

## Bugs ouverts

_(Vide — pas encore audité)_

---

## Bugs résolus

### [P0] MODELS-001 — Hooks Mongoose incompatibles avec Mongoose 9
**Module** : Backend (modèles)
**Fichiers** : [backend/models/Instance.js:21](backend/models/Instance.js#L21), [backend/models/Action.js:76](backend/models/Action.js#L76)
**Symptôme** : `TypeError: next is not a function` à la première sauvegarde d'une Instance ou d'une Action. Blocage complet des modules PA et Diagnostic (qui crée des Actions).
**Cause** : `pre('save', async function(next) { ... next(); })` — Mongoose 9 n'appelle plus `next` sur les hooks async (signature async-only). `next` vaut `undefined`.
**Fix** : retirer le paramètre `next` et les appels `next()` — le `await`/`return` du hook suffit. Appliqué le 2026-04-15.
**Détecté par** : première exécution de `seedTestData.js`.

---

## Runbook — Lancer un audit complet

```bash
# 1. Backend up ?
curl -sS http://localhost:5001/

# 2. Seed (idempotent)
cd backend
node scripts/seedProfils.js
node scripts/seedAdmin.js
node scripts/seedTestData.js

# 3. Invoquer l'agent testeur (depuis Claude Code)
#    Agent(subagent_type="qhse-tester", prompt="Audit complet post-merge")
```

Comptes de test créés par `seedTestData.js` (mot de passe commun : `Test2026!`) :

| Rôle                | Email                              |
| ------------------- | ---------------------------------- |
| Admin               | fayteksolution@gmail.com (Faytek2026!) |
| Responsable Qualité | rq1@test.faytek.local              |
| Responsable Qualité | rq2@test.faytek.local              |
| Pilote Achats       | pilote.achats@test.faytek.local    |
| Pilote Production   | pilote.prod@test.faytek.local      |
| Déclarant           | declarant1@test.faytek.local       |
| Déclarant           | declarant2@test.faytek.local       |
| Consultant          | consultant@test.faytek.local       |

Données seedées :
- 5 processus (ACHATS, PROD, QUAL, RH, COMM)
- 6 NC couvrant tous les statuts (submitted, dispatched, in_treatment, pending_closure, closed)
- 5 RC couvrant toutes les sources (employe, call, mail, sms, whatsapp)
- 3 instances PA + 12 actions (dont plusieurs en retard)
