import type {
  FunctionalChord,
  TonalCenter,
  CadenceInfo,
  CadenceType,
  CadenceResolutionStatus,
  CadentialStrength,
  ModalMode
} from './models/FunctionalAnalysis';
import { parseChord } from '../theory/chordParser';
import { getPitchClass } from '../core/pitch';
import { isDominantType, isMinorType } from './helpers/qualityHelpers';

function getExplanation(
  type: CadenceType,
  status: CadenceResolutionStatus,
  strength: CadentialStrength,
  chords: FunctionalChord[],
  idxs: number[]
): string[] {
  const explanation: string[] = [];
  const cLast = chords[idxs[idxs.length - 1]];
  
  if (type === 'AUTHENTIC') {
    explanation.push(`Gesto harmônico dominante direcionado à tônica ou alvo secundário.`);
    if (status === 'RESOLVED') {
      explanation.push(`Resolução direta e estável sobre o centro esperado (${cLast.chordSymbol}).`);
    } else if (status === 'DECEPTIVE') {
      explanation.push(`Resolução deceptiva desviada para o sexto grau relativo (${cLast.chordSymbol}).`);
    } else if (status === 'EVADED') {
      explanation.push(`Resolução evitada/desviada para um acorde inesperado (${cLast.chordSymbol}).`);
    } else if (status === 'DELAYED') {
      explanation.push(`Resolução atrasada por suspensão ou acorde intermediário.`);
    }
  } else if (type === 'PLAGAL') {
    explanation.push(`Gesto harmônico plagal (subdominante -> tônica).`);
    explanation.push(`Resolução suave sem tensão de trítono sobre o centro esperado (${cLast.chordSymbol}).`);
  } else if (type === 'HALF') {
    explanation.push(`Cadência suspensa (meia cadência) estacionando sobre a dominante (${cLast.chordSymbol}).`);
    explanation.push(`Gesto estruturalmente suspenso/não resolvido.`);
  } else if (type === 'PHRYGIAN') {
    explanation.push(`Cadência suspensa frígia com movimento de meio-tom no baixo resolvendo na dominante.`);
    explanation.push(`Gesto com forte atração melódica mas desfecho suspenso.`);
  }

  explanation.push(`Cadência classificada com força estrutural ${strength}.`);
  return explanation;
}

export function detectCadences(
  chords: FunctionalChord[],
  tonalCenter: TonalCenter,
  modalMode?: ModalMode
): CadenceInfo[] {
  const N = chords.length;
  const cadences: CadenceInfo[] = [];
  if (N < 2) return cadences;

  const isMajorKey = tonalCenter.mode === 'MAJOR';
  const isModalActive = modalMode && modalMode !== 'IONIAN' && modalMode !== 'AEOLIAN';

  const getQuality = (c: FunctionalChord) => {
    const parsed = parseChord(c.chordSymbol);
    return parsed.empty ? '' : parsed.quality;
  };

  const getRootChroma = (c: FunctionalChord) => {
    const parsed = parseChord(c.chordSymbol);
    return parsed.empty ? -1 : getPitchClass(parsed.root);
  };

  const hasSecondaryDomTarget = (c: FunctionalChord, target: string | string[]): boolean => {
    const targets = Array.isArray(target) ? target : [target];
    if (c.secondary?.contextualFunction === 'SECONDARY_DOMINANT') {
      return c.secondary.secondaryTarget ? targets.includes(c.secondary.secondaryTarget) : false;
    }
    return c.debug?.functionalHypotheses?.some(h => 
      h.contextualFunction === 'SECONDARY_DOMINANT' && h.secondaryTarget && targets.includes(h.secondaryTarget)
    ) ?? false;
  };

  const hasSecondaryTarget = (c: FunctionalChord, target: string): boolean => {
    if (c.secondary?.secondaryTarget === target) return true;
    return c.debug?.functionalHypotheses?.some(h => 
      (h.contextualFunction === 'SECONDARY_DOMINANT' || 
       h.contextualFunction === 'TRITONE_SUBSTITUTION' || 
       h.contextualFunction === 'SECONDARY_LEADING_TONE') && 
      h.secondaryTarget === target
    ) ?? false;
  };

  const hasDominantHypothesis = (c: FunctionalChord): boolean => {
    if (c.scaleDegree === 'V' || c.romanNumeral.startsWith('V') || isDominantType(getQuality(c))) {
      return true;
    }
    if (c.secondary?.contextualFunction === 'SECONDARY_DOMINANT' || 
        c.secondary?.contextualFunction === 'TRITONE_SUBSTITUTION' || 
        c.secondary?.contextualFunction === 'SECONDARY_LEADING_TONE') {
      return true;
    }
    return c.debug?.functionalHypotheses?.some(h => 
      h.contextualFunction === 'SECONDARY_DOMINANT' || 
      h.contextualFunction === 'TRITONE_SUBSTITUTION' || 
      h.contextualFunction === 'SECONDARY_LEADING_TONE'
    ) ?? false;
  };

  const addCadence = (cad: CadenceInfo, isTonalCadence = true) => {
    if (isTonalCadence && isModalActive) {
      cadences.push({
        ...cad,
        suppressed: true,
        suppressionReason: 'MODAL_REGION'
      });
    } else {
      cadences.push(cad);
    }
  };

  const resolvedDominantIndices = new Set<number>();

  // 1. ii - V - I checks (length 3)
  if (N >= 3) {
    for (let i = 0; i < N - 2; i++) {
      const idxs = [i, i + 1, i + 2];
      const c = idxs.map(idx => chords[idx]);
      const q0 = getQuality(c[0]);
      const q1 = getQuality(c[1]);

      // 1.1 Diatonic Perfect Cadence (ii - V - I or ii° - V - i)
      const isC0ii = isMajorKey ? c[0].scaleDegree === 'ii' : c[0].scaleDegree === 'ii°';
      const isC1V = c[1].scaleDegree === 'V' || (c[1].scaleDegree === 'v' && isDominantType(q1));
      const isC2I = isMajorKey ? c[2].scaleDegree === 'I' : c[2].scaleDegree === 'i';

      if (isC0ii && isC1V && isC2I) {
        let weight = 0.95;
        if (isDominantType(q1)) weight += 0.03; // extra boost for V7
        if (c[2].chordSymbol.includes('/')) weight -= 0.15; // penalty for inverted resolution
        if (c[1].chordSymbol.includes('/')) weight -= 0.05; // penalty for inverted dominant
        weight = Math.max(0.0, Math.min(1.0, weight));

        const strength: CadentialStrength = weight >= 0.80 ? 'STRONG' : (weight >= 0.55 ? 'MODERATE' : 'WEAK');

        addCadence({
          name: `ii - V - I (${tonalCenter.root} ${isMajorKey ? 'Maior' : 'Menor'})`,
          type: 'AUTHENTIC',
          startIndex: idxs[0],
          endIndex: idxs[2],
          chordIndexes: idxs,
          confidence: 0.98,
          strength,
          cadentialWeight: weight,
          resolution: {
            status: 'RESOLVED',
            targetChordIndex: idxs[2],
            explanation: getExplanation('AUTHENTIC', 'RESOLVED', strength, chords, idxs)
          }
        });

        resolvedDominantIndices.add(idxs[1]);
        continue;
      }

      // 1.2 Secondary Perfect Cadence (ii/target - V/target - target)
      if (hasSecondaryDomTarget(c[1], c[2].scaleDegree)) {
        const root0 = getRootChroma(c[0]);
        const root1 = getRootChroma(c[1]);
        if (root0 !== -1 && root1 !== -1) {
          const distance = (root1 - root0 + 12) % 12;
          if (distance === 5 && isMinorType(q0)) {
            let weight = 0.85;
            if (isDominantType(q1)) weight += 0.05;
            if (c[2].chordSymbol.includes('/')) weight -= 0.15;
            weight = Math.max(0.0, Math.min(1.0, weight));

            const strength: CadentialStrength = weight >= 0.80 ? 'STRONG' : (weight >= 0.55 ? 'MODERATE' : 'WEAK');

            addCadence({
              name: `ii - V - I Secundário de ${c[2].scaleDegree}`,
              type: 'AUTHENTIC',
              startIndex: idxs[0],
              endIndex: idxs[2],
              chordIndexes: idxs,
              confidence: 0.85,
              strength,
              cadentialWeight: weight,
              resolution: {
                status: 'RESOLVED',
                targetChordIndex: idxs[2],
                explanation: getExplanation('AUTHENTIC', 'RESOLVED', strength, chords, idxs)
              }
            });

            resolvedDominantIndices.add(idxs[1]);
            continue;
          }
        }
      }
    }
  }

  // 2. Length 2 checks: Authentic, Deceptive, Plagal, Half, Phrygian
  for (let i = 0; i < N - 1; i++) {
    const idxs = [i, i + 1];
    const c = idxs.map(idx => chords[idx]);
    const q0 = getQuality(c[0]);
    const root0 = getRootChroma(c[0]);
    const root1 = getRootChroma(c[1]);

    const isC1I = isMajorKey ? c[1].scaleDegree === 'I' : c[1].scaleDegree === 'i';

    // 2.1 Modal Approach Cadences
    if (isModalActive && modalMode) {
      const isC1Tonic = c[1].scaleDegree === 'I' || c[1].scaleDegree === 'i' || c[1].scaleDegree === 'i°';

      if (isC1Tonic) {
        let modalCadenceName = '';
        let cadenceType: CadenceType = 'PLAGAL';
        const weight = 0.75;

        if (modalMode === 'MIXOLYDIAN' && c[0].scaleDegree === 'bVII') {
          modalCadenceName = `Aproximação Mixolídia (bVII - I)`;
          cadenceType = 'AUTHENTIC';
        } else if (modalMode === 'DORIAN' && (c[0].scaleDegree === 'IV' || c[0].scaleDegree === 'bVII')) {
          modalCadenceName = `Aproximação Dórica (${c[0].scaleDegree} - i)`;
          cadenceType = c[0].scaleDegree === 'bVII' ? 'AUTHENTIC' : 'PLAGAL';
        } else if (modalMode === 'PHRYGIAN' && (c[0].scaleDegree === 'bII' || c[0].scaleDegree === 'bvii')) {
          modalCadenceName = `Aproximação Frígia (${c[0].scaleDegree} - i)`;
          cadenceType = c[0].scaleDegree === 'bII' ? 'PHRYGIAN' : 'AUTHENTIC';
        } else if (modalMode === 'LYDIAN' && c[0].scaleDegree === 'II') {
          modalCadenceName = `Aproximação Lídia (II - I)`;
          cadenceType = 'AUTHENTIC';
        } else if (modalMode === 'LOCRIAN' && (c[0].scaleDegree === 'bII' || c[0].scaleDegree === 'bV')) {
          modalCadenceName = `Aproximação Lócria (${c[0].scaleDegree} - i°)`;
          cadenceType = c[0].scaleDegree === 'bII' ? 'PHRYGIAN' : 'PLAGAL';
        }

        if (modalCadenceName) {
          const strength: CadentialStrength = weight >= 0.80 ? 'STRONG' : (weight >= 0.55 ? 'MODERATE' : 'WEAK');
          addCadence({
            name: modalCadenceName,
            type: cadenceType,
            startIndex: idxs[0],
            endIndex: idxs[1],
            chordIndexes: idxs,
            confidence: 0.85,
            strength,
            cadentialWeight: weight,
            resolution: {
              status: 'RESOLVED',
              targetChordIndex: idxs[1],
              explanation: getExplanation(cadenceType, 'RESOLVED', strength, chords, idxs)
            }
          }, false); // false = not a tonal cadence, do not suppress!
          continue;
        }
      }
    }

    // 2.2 Authentic Cadence Resolving (including Deceptive and Evaded)
    const isC0Dominant = hasDominantHypothesis(c[0]);

    const isBackdoor = isDominantType(q0) && isC1I && (!c[0].isDiatonic || c[0].harmonicFunction === 'SUBDOMINANT') && root0 !== -1 && root1 !== -1 && (root1 - root0 + 12) % 12 === 2;

    if ((isC0Dominant || isBackdoor) && !resolvedDominantIndices.has(idxs[0])) {
      // Determine resolution target
      let status: CadenceResolutionStatus;
      let weight = isBackdoor ? 0.75 : (isDominantType(q0) ? 0.85 : 0.70);

      const isC1DeceptiveTarget = isMajorKey ? c[1].scaleDegree === 'vi' : c[1].scaleDegree === 'bVI';
      const isExpectedTonic = isC1I || hasSecondaryTarget(c[0], c[1].scaleDegree);

      if (isExpectedTonic) {
        status = 'RESOLVED';
      } else if (isC1DeceptiveTarget) {
        status = 'DECEPTIVE';
        weight *= 0.75;
      } else {
        status = 'EVADED';
        weight *= 0.40;
      }

      if (c[1].chordSymbol.includes('/')) weight -= 0.15;
      weight = Math.max(0.0, Math.min(1.0, weight));

      const strength: CadentialStrength = weight >= 0.80 ? 'STRONG' : (weight >= 0.55 ? 'MODERATE' : 'WEAK');

      addCadence({
        name: status === 'DECEPTIVE' 
          ? `Resolução Deceptiva (V7 - ${c[1].scaleDegree})` 
          : (isBackdoor ? `Backdoor Cadence (bVII7 - ${c[1].scaleDegree})` : `Authentic Cadence (${c[0].chordSymbol} - ${c[1].chordSymbol})`),
        type: 'AUTHENTIC',
        startIndex: idxs[0],
        endIndex: idxs[1],
        chordIndexes: idxs,
        confidence: isBackdoor ? 0.80 : 0.85,
        strength,
        cadentialWeight: weight,
        resolution: {
          status,
          targetChordIndex: idxs[1],
          explanation: getExplanation('AUTHENTIC', status, strength, chords, idxs)
        }
      });
      continue;
    }

    // 2.3 Plagal Cadence (IV - I or iv - i)
    const isC0IV = isMajorKey ? c[0].scaleDegree === 'IV' : c[0].scaleDegree === 'iv';
    if (isC0IV && isC1I) {
      let weight = isMinorType(q0) ? 0.70 : 0.60;
      if (c[1].chordSymbol.includes('/')) weight -= 0.15;
      weight = Math.max(0.0, Math.min(1.0, weight));

      const strength: CadentialStrength = weight >= 0.80 ? 'STRONG' : (weight >= 0.55 ? 'MODERATE' : 'WEAK');

      addCadence({
        name: `Cadência Plagal (IV - ${c[1].scaleDegree})`,
        type: 'PLAGAL',
        startIndex: idxs[0],
        endIndex: idxs[1],
        chordIndexes: idxs,
        confidence: 0.70,
        strength,
        cadentialWeight: weight,
        resolution: {
          status: 'RESOLVED',
          targetChordIndex: idxs[1],
          explanation: getExplanation('PLAGAL', 'RESOLVED', strength, chords, idxs)
        }
      });
      continue;
    }

    // 2.4 Half / Phrygian Cadence ending on V
    const isC0PreDom = c[0].scaleDegree === 'I' || c[0].scaleDegree === 'i' || 
                       c[0].scaleDegree === 'ii' || c[0].scaleDegree === 'ii°' || 
                       c[0].scaleDegree === 'IV' || c[0].scaleDegree === 'iv' || 
                       c[0].scaleDegree === 'vi' || c[0].scaleDegree === 'bVI';
    const isC1V = c[1].scaleDegree === 'V' || c[1].scaleDegree === 'V7';

    // Verify it doesn't resolve to a tonic in the next index (interrupted gesture)
    const isInterrupted = (i + 2 >= N) || (chords[i + 2].scaleDegree !== 'I' && chords[i + 2].scaleDegree !== 'i');

    if (isC0PreDom && isC1V && isInterrupted) {
      const isPhrygianHalf = !isMajorKey && c[0].scaleDegree === 'iv' && isC1V; // iv -> V in minor (phrygian cadence)
      const type: CadenceType = isPhrygianHalf ? 'PHRYGIAN' : 'HALF';
      
      let weight = 0.55;
      if (isPhrygianHalf) weight = 0.65;
      weight = Math.max(0.0, Math.min(1.0, weight));

      const strength: CadentialStrength = weight >= 0.80 ? 'STRONG' : (weight >= 0.55 ? 'MODERATE' : 'WEAK');

      addCadence({
        name: isPhrygianHalf ? 'Cadência Frígia (iv - V)' : `Meia Cadência (grau ${c[0].scaleDegree} - V)`,
        type,
        startIndex: idxs[0],
        endIndex: idxs[1],
        chordIndexes: idxs,
        confidence: 0.75,
        strength,
        cadentialWeight: weight,
        resolution: {
          status: 'INTERRUPTED',
          targetChordIndex: idxs[1],
          explanation: getExplanation(type, 'INTERRUPTED', strength, chords, idxs)
        }
      });
    }
  }

  // 3. Delayed resolution checks V7 -> [passing/cadential 6/4] -> V7 -> I (lookahead distance 2)
  if (N >= 3) {
    for (let i = 0; i < N - 2; i++) {
      const idxs = [i, i + 1, i + 2];
      const c = idxs.map(idx => chords[idx]);
      const q0 = getQuality(c[0]);

      const isC0V = c[0].scaleDegree === 'V' || c[0].romanNumeral.startsWith('V') || isDominantType(q0);
      const isC2I = isMajorKey ? c[2].scaleDegree === 'I' : c[2].scaleDegree === 'i';

      if (isC0V && isC2I && !resolvedDominantIndices.has(idxs[0])) {
        // If c1 is an intermediate passing chord (often cadential 6/4 or neighbor/passing), we have a delayed resolution
        let weight = 0.80;
        if (c[2].chordSymbol.includes('/')) weight -= 0.15;
        weight = Math.max(0.0, Math.min(1.0, weight));

        const strength: CadentialStrength = weight >= 0.80 ? 'STRONG' : (weight >= 0.55 ? 'MODERATE' : 'WEAK');

        addCadence({
          name: `Cadência Autêntica Atrasada (${c[0].chordSymbol} - ${c[1].chordSymbol} - ${c[2].chordSymbol})`,
          type: 'AUTHENTIC',
          startIndex: idxs[0],
          endIndex: idxs[2],
          chordIndexes: idxs,
          confidence: 0.80,
          strength,
          cadentialWeight: weight,
          resolution: {
            status: 'DELAYED',
            targetChordIndex: idxs[2],
            explanation: getExplanation('AUTHENTIC', 'DELAYED', strength, chords, idxs)
          }
        });

        resolvedDominantIndices.add(idxs[0]);
      }
    }
  }

  return cadences;
}
