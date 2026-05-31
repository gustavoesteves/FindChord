import { getPitchClass, getNoteAt } from "./musicTheory";

export enum CageShape {
  C = "C",
  A = "A",
  G = "G",
  E = "E",
  D = "D"
}

export interface VoicingShape {
  chordName: string;
  frets: (number | null)[]; // 6 elementos correspondendo a 6ª corda (index 0) até 1ª corda (index 5)
  rootString: number;        // String onde a tônica está (0 a 5)
  cageShape: CageShape;
  positionFret: number;     // Primeiro traste pressionado (para desenhar a região)
  notes: string[];          // Notas em cada corda
}

/**
 * Classifica um voicing dinâmico no formato CAGED
 */
export function classifyCAGED(frets: (number | null)[], rootString: number): CageShape {
  // Mapeamento clássico do CAGED baseado na corda da tônica e formato
  // 6ª corda (index 0): Formato E (se estiver perto do capo) ou G
  // 5ª corda (index 1): Formato A ou C
  // 4ª corda (index 2): Formato D
  if (rootString === 0) { // 6ª corda
    const rootFret = frets[0] || 0;
    const thirdFret = frets[2] || 0; // Normalmente indica o formato
    return thirdFret > rootFret ? CageShape.G : CageShape.E;
  } else if (rootString === 1) { // 5ª corda
    const rootFret = frets[1] || 0;
    const highFret = frets[4] || 0;
    return highFret < rootFret ? CageShape.C : CageShape.A;
  } else if (rootString === 2) { // 4ª corda
    return CageShape.D;
  }
  
  // Default de fallback baseado nas casas pressionadas
  const minFret = Math.min(...(frets.filter(f => f !== null && f > 0) as number[]));
  const shapes = [CageShape.E, CageShape.A, CageShape.C, CageShape.D, CageShape.G];
  return shapes[minFret % 5];
}

/**
 * Algoritmo dinâmico de geração de voicings matematicamente executáveis
 */
export function generateVoicings(
  chordName: string,
  chordRoot: string,
  targetPitchClasses: number[], // ex: [0, 4, 7, 11] para Cmaj7
  tuning: string[]              // ex: ["E2", "A2", "D3", "G3", "B3", "E4"]
): VoicingShape[] {
  if (targetPitchClasses.length === 0) return [];

  const rootPC = getPitchClass(chordRoot);
  const results: VoicingShape[] = [];

  // Mapear todas as notas válidas para cada uma das 6 cordas
  const notesOnStrings: { fret: number; pitchClass: number; noteName: string }[][] = [];

  for (let stringIdx = 0; stringIdx < 6; stringIdx++) {
    const baseNote = tuning[stringIdx];
    const stringNotes: { fret: number; pitchClass: number; noteName: string }[] = [];

    // Considerar do traste 0 (solta) ao 18 (suficiente para a maioria dos voicings)
    for (let fret = 0; fret <= 18; fret++) {
      const noteName = getNoteAt(baseNote, fret);
      const pc = getPitchClass(noteName);
      
      if (targetPitchClasses.includes(pc)) {
        stringNotes.push({ fret, pitchClass: pc, noteName });
      }
    }
    notesOnStrings.push(stringNotes);
  }

  // Encontrar combinações de notas nas 6 cordas usando busca por força bruta com podagem ergonômica
  // Usamos uma busca recursiva para testar as combinações
  const currentFretting: (number | null)[] = Array(6).fill(null);
  const currentNotes: string[] = Array(6).fill("");

  function search(stringIdx: number) {
    if (stringIdx === 6) {
      // Validar a combinação completa de trastes
      const activeFrets = currentFretting.filter(f => f !== null) as number[];
      if (activeFrets.length < 3) return; // Mínimo 3 notas para formar acordes reais

      // 1. Verificar se todas as notas essenciais (pitch classes) do acorde estão cobertas
      const coveredPCs = new Set<number>();
      currentFretting.forEach((fret, idx) => {
        if (fret !== null) {
          const baseNote = tuning[idx];
          const noteName = getNoteAt(baseNote, fret);
          coveredPCs.add(getPitchClass(noteName));
        }
      });

      // Se não contiver pelo menos a tônica e a terça, descartamos
      if (!coveredPCs.has(rootPC)) return;
      
      // Permitimos omitir quintas, mas não o resto (a menos que seja especificado incompleto)
      let missingCount = 0;
      targetPitchClasses.forEach(pc => {
        if (!coveredPCs.has(pc)) missingCount++;
      });
      if (missingCount > 1) return;

      // 2. Filtros Ergonômicos (Tocabilidade)
      const frettedNotes = currentFretting.filter(f => f !== null && f > 0) as number[];
      
      // A. Limite de stretch (máximo 4 casas de distância entre o maior e menor traste pressionado)
      if (frettedNotes.length > 0) {
        const minFret = Math.min(...frettedNotes);
        const maxFret = Math.max(...frettedNotes);
        const stretch = maxFret - minFret;
        
        if (stretch > 4) return; // Limite de 4 casas (descartar formatos impossíveis de abrir a mão)
      }

      // B. Limite físico de dedos (máximo 4 notas pressionadas simultaneamente, excluindo soltas)
      if (frettedNotes.length > 4) return;

      // C. Mutar cordas adjacentes: Evitar voicings cheios de buracos (ex: tocando 6ª corda e 1ª corda, com todas as outras mutadas)
      let firstPlayed = -1;
      let lastPlayed = -1;
      currentFretting.forEach((f, idx) => {
        if (f !== null) {
          if (firstPlayed === -1) firstPlayed = idx;
          lastPlayed = idx;
        }
      });

      let mutedGapCount = 0;
      for (let i = firstPlayed; i <= lastPlayed; i++) {
        if (currentFretting[i] === null) {
          mutedGapCount++;
        }
      }
      if (mutedGapCount > 2) return; // Máximo 2 cordas mutadas no meio do voicing

      // Identificar corda da tônica
      let rootStringIdx = -1;
      currentFretting.forEach((fret, idx) => {
        if (fret !== null && rootStringIdx === -1) {
          const baseNote = tuning[idx];
          const noteName = getNoteAt(baseNote, fret);
          if (getPitchClass(noteName) === rootPC) {
            rootStringIdx = idx;
          }
        }
      });

      if (rootStringIdx === -1) rootStringIdx = firstPlayed;

      // Encontrou um voicing válido!
      const positionFret = frettedNotes.length > 0 ? Math.min(...frettedNotes) : 0;
      const cageShape = classifyCAGED(currentFretting, rootStringIdx);

      // Evitar duplicatas idênticas
      const isDuplicate = results.some(r => r.frets.every((val, index) => val === currentFretting[index]));
      
      if (!isDuplicate) {
        results.push({
          chordName,
          frets: [...currentFretting],
          rootString: rootStringIdx,
          cageShape,
          positionFret,
          notes: [...currentNotes]
        });
      }
      return;
    }

    // Opção 1: Mutar a corda atual (null)
    currentFretting[stringIdx] = null;
    currentNotes[stringIdx] = "x";
    search(stringIdx + 1);

    // Opção 2: Tentar cada nota candidata nessa corda
    const candidates = notesOnStrings[stringIdx];
    for (const c of candidates) {
      currentFretting[stringIdx] = c.fret;
      currentNotes[stringIdx] = c.noteName;
      search(stringIdx + 1);
    }
  }

  // Iniciar a busca a partir da 6ª corda (índice 0)
  search(0);

  // Ordenar voicings por ergonomia/casas mais baixas e limitar a 30 resultados para não sobrecarregar a UI
  return results
    .sort((a, b) => {
      // 1. Prioriza menor casa física inicial
      if (a.positionFret !== b.positionFret) return a.positionFret - b.positionFret;
      // 2. Prioriza voicings com mais notas tocadas
      const aCount = a.frets.filter(f => f !== null).length;
      const bCount = b.frets.filter(f => f !== null).length;
      return bCount - aCount;
    })
    .slice(0, 30);
}
