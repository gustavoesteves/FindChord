import { getPitchClass, getOctave, getNoteAt } from "./musicTheory";
import { VoicingShape } from "./voicingGenerator";

export interface VoiceLeadingPath {
  stringIndex: number;
  fromNote: string;
  toNote: string;
  fromPitch: number;
  toPitch: number;
  semitoneDiff: number;
  direction: "up" | "down" | "stay" | "muted" | "unmuted";
}

export interface VoiceLeadingResult {
  voicingB: VoicingShape;
  totalCost: number;
  paths: VoiceLeadingPath[];
}

/**
 * Retorna o pitch absoluto (MIDI) de uma nota baseado nos trastes e afinação base.
 */
function getAbsolutePitch(fret: number | null, baseNote: string): number | null {
  if (fret === null) return null;
  const noteName = getNoteAt(baseNote, fret);
  const pc = getPitchClass(noteName);
  const oct = getOctave(noteName);
  return oct * 12 + pc;
}

/**
 * Calcula o Custo Harmônico e Físico de transição entre dois voicings.
 */
export function calculateVoiceLeadingCost(
  fretsA: (number | null)[],
  fretsB: (number | null)[],
  tuning: string[]
): { totalCost: number; paths: VoiceLeadingPath[] } {
  let cost = 0;
  const paths: VoiceLeadingPath[] = [];

  // Mapear direções para identificar movimento contrário ou paralelo
  const activeMovements: { stringIdx: number; direction: number; intervalStart: number | null }[] = [];

  // 1. Calcular deslocamentos individuais nas cordas
  for (let stringIdx = 0; stringIdx < 6; stringIdx++) {
    const baseNote = tuning[stringIdx];
    const fretA = fretsA[stringIdx];
    const fretB = fretsB[stringIdx];

    const pitchA = getAbsolutePitch(fretA, baseNote);
    const pitchB = getAbsolutePitch(fretB, baseNote);

    const noteAName = fretA !== null ? getNoteAt(baseNote, fretA) : "x";
    const noteBName = fretB !== null ? getNoteAt(baseNote, fretB) : "x";

    if (pitchA !== null && pitchB !== null) {
      // Ambos estão ativos
      const diff = pitchB - pitchA;
      const absDiff = Math.abs(diff);
      let cellCost = 0;

      let direction: "up" | "down" | "stay" = "stay";
      if (diff > 0) {
        direction = "up";
        activeMovements.push({ stringIdx, direction: 1, intervalStart: pitchA });
      } else if (diff < 0) {
        direction = "down";
        activeMovements.push({ stringIdx, direction: -1, intervalStart: pitchA });
      } else {
        activeMovements.push({ stringIdx, direction: 0, intervalStart: pitchA });
      }

      // Aplica regras de custo harmônico
      if (absDiff === 0) {
        cellCost = 0; // Nota comum (ideal)
      } else if (absDiff === 1) {
        cellCost = 1; // Passo cromático (excelente condução)
      } else if (absDiff === 2) {
        cellCost = 2; // Passo por tom inteiro (muito bom)
      } else if (absDiff > 7) {
        cellCost = 10; // Salto largo (penalidade alta)
      } else {
        cellCost = absDiff; // Custo proporcional ao salto
      }

      cost += cellCost;
      
      paths.push({
        stringIndex: stringIdx,
        fromNote: noteAName,
        toNote: noteBName,
        fromPitch: pitchA,
        toPitch: pitchB,
        semitoneDiff: diff,
        direction
      });
    } else if (pitchA !== null && pitchB === null) {
      // Corda abafada (migrou para mutada)
      cost += 5; // Pequeno custo físico por soltar a corda
      paths.push({
        stringIndex: stringIdx,
        fromNote: noteAName,
        toNote: "x",
        fromPitch: pitchA,
        toPitch: 0,
        semitoneDiff: 0,
        direction: "muted"
      });
    } else if (pitchA === null && pitchB !== null) {
      // Corda ativada (migrou de mutada)
      cost += 5; // Custo físico para posicionar o dedo em nova corda
      paths.push({
        stringIndex: stringIdx,
        fromNote: "x",
        toNote: noteBName,
        fromPitch: 0,
        toPitch: pitchB,
        semitoneDiff: 0,
        direction: "unmuted"
      });
    } else {
      // Ambos mutados
      paths.push({
        stringIndex: stringIdx,
        fromNote: "x",
        toNote: "x",
        fromPitch: 0,
        toPitch: 0,
        semitoneDiff: 0,
        direction: "muted"
      });
    }
  }

  // 2. Análise de Contraposição Harmônica (Movimento Contrário vs Paralelo)
  if (activeMovements.length >= 2) {
    let contraryMotionCount = 0;
    let parallelFifthOctaveError = false;

    for (let i = 0; i < activeMovements.length; i++) {
      for (let j = i + 1; j < activeMovements.length; j++) {
        const m1 = activeMovements[i];
        const m2 = activeMovements[j];

        // A. Movimento Contrário (um sobe, outro desce) -> Ganha bônus de suavidade sonora
        if ((m1.direction > 0 && m2.direction < 0) || (m1.direction < 0 && m2.direction > 0)) {
          contraryMotionCount++;
        }

        // B. Movimento Paralelo Perigoso (Quintas ou Oitavas paralelas consecutivas)
        if (m1.direction === m2.direction && m1.direction !== 0 && m1.intervalStart !== null && m2.intervalStart !== null) {
          const pitchA1 = m1.intervalStart;
          const pitchA2 = m2.intervalStart;
          const pitchB1 = pitchA1 + m1.direction; // Simulação simplificada de destino
          const pitchB2 = pitchA2 + m2.direction;

          const intervalA = Math.abs(pitchA1 - pitchA2) % 12;
          const intervalB = Math.abs(pitchB1 - pitchB2) % 12;

          // Se começou em 5ª (7 semitons) ou 8ª (12/0 semitons) e se moveu em paralelo mantendo o mesmo intervalo
          if ((intervalA === 7 && intervalB === 7) || (intervalA === 0 && intervalB === 0)) {
            parallelFifthOctaveError = true;
          }
        }
      }
    }

    // Aplicar bônus por movimento contrário
    if (contraryMotionCount > 0) {
      cost = Math.max(0, cost - 3 * contraryMotionCount); // Bônus musical
    }

    // Aplicar penalidade grave por quintas/oitavas paralelas consecutivas
    if (parallelFifthOctaveError) {
      cost += 15;
    }
  }

  // 3. Adicionar custo de movimento da mão no braço (mudança física da posição geral da pestana/capo)
  const fretsANonNull = fretsA.filter(f => f !== null && f > 0) as number[];
  const fretsBNonNull = fretsB.filter(f => f !== null && f > 0) as number[];

  if (fretsANonNull.length > 0 && fretsBNonNull.length > 0) {
    const minFretA = Math.min(...fretsANonNull);
    const minFretB = Math.min(...fretsBNonNull);
    const positionShift = Math.abs(minFretB - minFretA);
    cost += positionShift * 2; // Custo físico de deslocamento da mão
  }

  return {
    totalCost: cost,
    paths
  };
}

/**
 * Dado um voicing A de origem, encontra e ordena os melhores voicings do acorde B pelo menor custo de voice leading.
 */
export function findBestVoiceLeading(
  voicingA: (number | null)[],
  candidatesB: VoicingShape[],
  tuning: string[]
): VoiceLeadingResult[] {
  const results: VoiceLeadingResult[] = candidatesB.map(voicingB => {
    const { totalCost, paths } = calculateVoiceLeadingCost(voicingA, voicingB.frets, tuning);
    return {
      voicingB,
      totalCost,
      paths
    };
  });

  // Ordena por menor custo de condução
  return results.sort((a, b) => a.totalCost - b.totalCost).slice(0, 5); // Sugere as 5 melhores transições
}
