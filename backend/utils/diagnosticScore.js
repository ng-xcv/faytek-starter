// Logique de scoring portée depuis l'app HTML source (build_html.py:242).
// Score d'une norme = moyenne arithmétique des cotations numériques (NA exclu).

const NUMERIC = { '0': 0, '0.33': 0.33, '0.66': 0.66, '1': 1 };

function scoreReponses(reponses) {
  let sum = 0;
  let n = 0;
  let nc = 0;
  let ai = 0;
  let acc = 0;
  let ok = 0;
  let na = 0;
  for (const r of reponses) {
    if (r.cotation === 'NA') {
      na++;
      continue;
    }
    const v = NUMERIC[r.cotation];
    if (v == null) continue;
    sum += v;
    n++;
    if (r.cotation === '0') nc++;
    else if (r.cotation === '0.33') ai++;
    else if (r.cotation === '0.66') acc++;
    else if (r.cotation === '1') ok++;
  }
  return {
    pct: n > 0 ? sum / n : null,
    answered: n + na,
    nc,
    ai,
    acc,
    ok,
    na,
    n,
  };
}

// Calcul des scores complets d'un diagnostic à partir des réponses + référentiels.
// referentiels : Map<code, DiagnosticReferentiel>
// reponses : DiagnosticReponse[] (toutes normes confondues)
function computeScores(reponses, referentiels, normesActivees) {
  const scoresParNorme = [];
  const scoresParChapitre = [];
  let totalSum = 0;
  let totalN = 0;

  for (const code of normesActivees) {
    const ref = referentiels.get(code);
    if (!ref) continue;
    const reps = reponses.filter((r) => r.referentiel === code);
    const total = ref.questions.length;
    const s = scoreReponses(reps);

    scoresParNorme.push({
      code,
      pct: s.pct,
      answered: s.answered,
      total,
      nc: s.nc,
      ai: s.ai,
      acc: s.acc,
      ok: s.ok,
      na: s.na,
    });

    if (s.n > 0) {
      // moyenne globale = moyenne des moyennes par norme (parité avec l'app source)
      totalSum += s.pct;
      totalN++;
    }

    // Score par chapitre
    const chapSet = new Set(ref.questions.map((q) => q.chap));
    for (const chap of chapSet) {
      const idxs = new Set();
      ref.questions.forEach((q, i) => {
        if (q.chap === chap) idxs.add(i);
      });
      const repsChap = reps.filter((r) => idxs.has(r.questionIdx));
      const sc = scoreReponses(repsChap);
      scoresParChapitre.push({
        code,
        chap,
        pct: sc.pct,
        answered: sc.answered,
        total: idxs.size,
      });
    }
  }

  const scoreGlobal = totalN > 0 ? totalSum / totalN : null;
  return { scoreGlobal, scoresParNorme, scoresParChapitre };
}

module.exports = { computeScores, scoreReponses, NUMERIC };
