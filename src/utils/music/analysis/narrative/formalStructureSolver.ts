import type { Phrase, PhraseGroup } from '../models/FunctionalAnalysis';

/**
 * Analisa as frases segmentadas da progressão e identifica relações formais de período
 * (Antecedente / Consequente) com base na força e resolução de suas cadências finais.
 * 
 * @param phrases - Lista de frases estruturais geradas na segmentação.
 * @returns Lista de grupos de frases (PhraseGroup) detectados.
 */
export function analyzeFormalStructure(phrases: Phrase[]): PhraseGroup[] {
  const phraseGroups: PhraseGroup[] = [];
  const N = phrases.length;

  // Inicializa todas as frases com papel padrão
  phrases.forEach(p => {
    p.formalRole = 'STANDALONE';
    p.phraseGroupId = undefined;
  });

  if (N < 2) {
    return phraseGroups;
  }

  let i = 0;
  let groupIndex = 0;

  while (i < N - 1) {
    const p1 = phrases[i];
    const p2 = phrases[i + 1];

    const c1 = p1.terminatingCadence;
    const c2 = p2.terminatingCadence;

    // Definição de Cadência Fraca / Suspensa (Antecedente)
    // - Meia-Cadência (HALF)
    // - Ou status não resolvido (DECEPTIVE, EVADED, INTERRUPTED, etc.)
    // - Ou sem cadência formal (que é inerentemente inconclusivo)
    const isWeak1 = !c1 || c1.type === 'HALF' || c1.resolution.status !== 'RESOLVED';

    // Definição de Cadência Forte / Resolvida (Consequente)
    // - Autêntica ou Plagal resolvida com convicção razoável
    const isStrong2 = c2 && 
                      c2.resolution.status === 'RESOLVED' && 
                      (c2.type === 'AUTHENTIC' || c2.type === 'PLAGAL') && 
                      c2.cadentialWeight >= 0.6;

    if (isWeak1 && isStrong2) {
      // Pareamento de Período confirmado!
      const w1 = c1?.cadentialWeight ?? 0.5;
      const w2 = c2.cadentialWeight;
      const confidence = Number(((w1 + w2) / 2).toFixed(2));

      // Nomeação pedagógica do Período
      let periodName = 'Período Harmônico';
      if (c2.type === 'AUTHENTIC') {
        if (c1 && c1.resolution.status === 'DECEPTIVE') {
          periodName = 'Período Deceptivo';
        } else {
          periodName = 'Período Autêntico';
        }
      } else if (c2.type === 'PLAGAL') {
        periodName = 'Período Plagal';
      }

      p1.formalRole = 'ANTECEDENT';
      p1.phraseGroupId = groupIndex;

      p2.formalRole = 'CONSEQUENT';
      p2.phraseGroupId = groupIndex;

      let sectionLabel: string | undefined;
      if (p1.sectionLabel && p1.sectionLabel === p2.sectionLabel) {
        sectionLabel = p1.sectionLabel;
      }

      phraseGroups.push({
        index: groupIndex,
        type: 'PERIOD',
        phraseIndices: [i, i + 1],
        confidence,
        name: periodName,
        sectionLabel
      });

      groupIndex++;
      i += 2; // Salta as duas frases agrupadas
    } else {
      p1.formalRole = 'STANDALONE';
      i += 1;
    }
  }

  // Garante papel da última frase se sobrar avulsa
  if (i === N - 1) {
    phrases[i].formalRole = 'STANDALONE';
  }

  return phraseGroups;
}
