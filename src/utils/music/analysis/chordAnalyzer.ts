import { Note as TonalNote, Interval as TonalInterval } from "tonal";
import { getPitchClass, simplifyNote } from "../core/pitch";
import type { ChordCandidate, HarmonicInterpretation } from "../models/ChordCandidate";
import type { FretPosition } from "../models/FretPosition";
import type { ChordQuality } from "../constants/chordRegistry";
import { CHORD_REGISTRY } from "../constants/chordRegistry";
import { getIntervalSymbol, getFriendlyInterval } from "../theory/chordParser";
import { formatChordName } from "../theory/enharmonics";

// Penalidade por Reconstrução Exótica para favorabilidade de acordes canônicos e simples (Canonical Preference)
function getQualityExoticPenalty(quality: ChordQuality): number {
  const penalties: Record<ChordQuality, number> = {
    major: 0,
    minor: 0,
    diminished: 1,
    augmented: 1,
    power: 0,
    sus4: 1,
    sus2: 1,
    major6th: 2,
    minor6th: 2,
    dominant7th: 2,
    major7th: 2,
    minor7th: 2,
    halfDiminished: 3,
    diminished7th: 3,
    minorMajor7th: 4,
    dominant7sus4: 3,
    add9: 3,
    minorAdd9: 3,
    "69": 4,
    dominant9th: 4,
    major9th: 4,
    minor9th: 4,
    dominant11th: 5,
    minor11th: 5,
    dominant13th: 6,
    major13th: 6,
    minor13th: 6,
    dominant7b9: 6,
    "dominant7#9": 6,
    "dominant7#11": 7,
    dominant7b13: 7,
    "major7#11": 7
  };
  return penalties[quality] !== undefined ? penalties[quality] : 3;
}

function getLowestNote(positions: FretPosition[]): FretPosition | null {
  if (positions.length === 0) return null;
  return [...positions].reduce((lowest, current) => {
    const currentFreq = current.octave * 12 + current.pitchClass;
    const lowestFreq = lowest.octave * 12 + lowest.pitchClass;
    return currentFreq < lowestFreq ? current : lowest;
  });
}

// Motor de Análise Harmônica 100% Proprietário
export function analyzeChords(positions: FretPosition[]): ChordCandidate[] {
  if (positions.length === 0) return [];

  // 1. Obter Pitch Classes e nomes de notas ÚNICAS (removendo duplicações de oitava)
  const uniquePitchClasses = Array.from(new Set(positions.map(p => p.pitchClass)));
  const uniqueNoteNames = Array.from(new Set(positions.map(p => simplifyNote(p.noteName).replace(/\d/, ""))));

  // 2. Localizar Baixo Físico
  const bassFret = getLowestNote(positions);
  const bassNote = bassFret ? simplifyNote(bassFret.noteName).replace(/\d/, "") : "";

  const candidates: ChordCandidate[] = [];

  // 3. Testar CADA Pitch Class ativa como possível tônica
  uniquePitchClasses.forEach(rootPC => {
    // Transpor para o nome da nota da tônica
    const rootFretPosition = positions.find(p => p.pitchClass === rootPC);
    const chordRoot = rootFretPosition ? simplifyNote(rootFretPosition.noteName).replace(/\d/, "") : "";
    if (!chordRoot) return;

    // 4. Testar todas as qualidades oficiais da DSL do CHORD_REGISTRY
    (Object.keys(CHORD_REGISTRY) as ChordQuality[]).forEach(quality => {
      const def = CHORD_REGISTRY[quality];
      
      // Notas absolutas da hipótese teórica
      const formulaPitchClasses = def.semitones.map(s => (rootPC + s) % 12);
      
      let score = 0;
      const omissions: string[] = [];
      const additions: string[] = [];

      // --- ALGORITMO DE SCORING PROFISSIONAL ---

      // A. TÔNICA PRESENTE (Peso: +20 ou -25)
      const rootPresent = uniquePitchClasses.includes(rootPC);
      if (rootPresent) {
        score += 20;
      } else {
        score -= 25; // Rootless voicing
        omissions.push("1");
      }

      // B. TERÇA PRESENTE (Peso: +15 ou -15)
      const hasThird = def.semitones.some(s => s % 12 === 3 || s % 12 === 4);
      if (hasThird) {
        const thirdPCIndex = def.semitones.findIndex(s => s % 12 === 3 || s % 12 === 4);
        const thirdPC = formulaPitchClasses[thirdPCIndex];
        if (uniquePitchClasses.includes(thirdPC)) {
          score += 15;
        } else {
          score -= 15; // Perde definição modal
          omissions.push(def.semitones[thirdPCIndex] === 3 ? "b3" : "3");
        }
      }

      // C. SÉTIMA OU SEXTA PRESENTE (Peso: +10 ou -5)
      const hasSeventhOrSixth = def.semitones.some(s => s % 12 === 9 || s % 12 === 10 || s % 12 === 11);
      if (hasSeventhOrSixth) {
        const charPCIndex = def.semitones.findIndex(s => s % 12 === 9 || s % 12 === 10 || s % 12 === 11);
        const charPC = formulaPitchClasses[charPCIndex];
        if (uniquePitchClasses.includes(charPC)) {
          score += 10;
        } else {
          score -= 5;
          const sem = def.semitones[charPCIndex];
          omissions.push(sem === 9 ? "6" : sem === 10 ? "b7" : "7");
        }
      }

      // D. QUINTA PRESENTE (Peso: +0 ou -1)
      const hasFifth = def.semitones.some(s => s % 12 === 6 || s % 12 === 7 || s % 12 === 8);
      if (hasFifth) {
        const fifthPCIndex = def.semitones.findIndex(s => s % 12 === 6 || s % 12 === 7 || s % 12 === 8);
        const fifthPC = formulaPitchClasses[fifthPCIndex];
        if (uniquePitchClasses.includes(fifthPC)) {
          // Presente
        } else {
          score -= 1; // Quinta omitida tem penalidade insignificante na guitarra
          const sem = def.semitones[fifthPCIndex];
          omissions.push(sem === 6 ? "b5" : sem === 7 ? "5" : "#5");
        }
      }

      // E. BAIXO (Bass Note) (Peso: +20, +5 ou -10)
      const bassIsRoot = bassNote === chordRoot;
      if (bassIsRoot) {
        score += 20; // Posição fundamental tem preferência canônica forte
      } else {
        const bassPC = getPitchClass(bassNote);
        if (formulaPitchClasses.includes(bassPC)) {
          score += 5; // Inversão legítima (Slash chord)
        } else {
          score -= 10; // Baixo incoerente fora do acorde
        }
      }

      // F. PENALIDADE DE OUTRAS OMISSÕES DE FÓRMULA (Extensões: 9ª, 11ª, 13ª, 6ª)
      def.semitones.forEach((s, idx) => {
        const modS = s % 12;
        const isCoreNote = modS === 0 || modS === 3 || modS === 4 || modS === 6 || modS === 7 || modS === 8 || modS === 9 || modS === 10 || modS === 11;
        if (!isCoreNote) {
          const extPC = formulaPitchClasses[idx];
          if (!uniquePitchClasses.includes(extPC)) {
            score -= 2; // Leve penalidade para extensão da fórmula não tocada
            omissions.push(getFriendlyInterval(getIntervalSymbol(s)));
          }
        }
      });

      // G. PENALIDADE DE NOTAS ÓRFÃS (Notas completamente fora da fórmula) (Peso: -20 por nota)
      uniquePitchClasses.forEach(pc => {
        if (!formulaPitchClasses.includes(pc)) {
          score -= 20; // Penalidade estrita mais rigorosa
          const noteName = uniqueNoteNames[uniquePitchClasses.indexOf(pc)];
          additions.push(noteName);
        }
      });

      // G2. BÔNUS DE CASAMENTO DE FÓRMULA (Métrica de Preferência Canônica com Omissões Opcionais Inteligentes)
      let essentialOmissionsCount = 0;
      const isFifthAltered = quality === "halfDiminished" || quality === "diminished7th" || quality === "augmented";
      
      omissions.forEach(om => {
        const isFifth = om === "5" || om === "b5" || om === "#5" || om.includes("5");
        const isNinth = om === "9" || om.includes("9") || om.includes("Nona") || om.includes("Segunda");
        const isEleventh = om === "11" || om.includes("11") || om.includes("Quarta");
        
        const isOptionalForThisChord = 
          (isFifth && !isFifthAltered) ||
          (isNinth && (quality.includes("11") || quality.includes("13"))) ||
          (isEleventh && quality.includes("13"));
          
        if (!isOptionalForThisChord) {
          essentialOmissionsCount++;
        }
      });

      const hasNoOrphans = additions.length === 0;
      const hasNoEssentialOmissions = essentialOmissionsCount === 0;
      const onlyFifthOmitted = omissions.length === 1 && (omissions.includes("5") || omissions.includes("b5") || omissions.includes("#5"));

      if (hasNoOrphans) {
        if (hasNoEssentialOmissions) {
          score += 15; // Bônus especial para dedilhado limpo e completo em termos essenciais!
        } else if (onlyFifthOmitted) {
          score += 10; // Bônus de compatibilidade
        }
      }

      // H. PENALIDADE DE COMPLEXIDADE / RECONSTRUÇÃO EXÓTICA
      const complexityPenalty = getQualityExoticPenalty(quality);
      score -= complexityPenalty;

      // Ignorar ruídos absolutos
      if (score < -10) return;

      const isIncomplete = omissions.includes("3") || omissions.includes("b3") || (omissions.includes("1") && uniquePitchClasses.length < 3);

      // Calcular o Baixo / Barra se for invertido
      const bassValue = bassIsRoot ? undefined : bassNote;

      const formulaNotes = def.semitones.map(s => {
        return simplifyNote(TonalNote.transpose(chordRoot, TonalInterval.fromSemitones(s))).replace(/\d/, "");
      });

      candidates.push({
        root: chordRoot,
        quality: quality,
        intervals: def.semitones.map(s => getFriendlyInterval(getIntervalSymbol(s))),
        notes: formulaNotes,
        drawnNotes: uniqueNoteNames,
        omissions,
        additions,
        bass: bassValue,
        score,
        confidence: 0, // Definido na normalização
        notationInternational: formatChordName(chordRoot, quality, omissions, bassValue, "International", additions),
        notationBrazilian: formatChordName(chordRoot, quality, omissions, bassValue, "Brazilian", additions),
        notationAcademic: formatChordName(chordRoot, quality, omissions, bassValue, "Academic", additions),
        isIncomplete
      });
    });
  });

  if (candidates.length === 0) return [];

  // Ordenação avançada baseada em canonicidade e preferência por fundamental
  candidates.sort((a, b) => {
    if (Math.abs(a.score - b.score) > 0.01) {
      return b.score - a.score;
    }
    const aIsFund = a.bass === undefined;
    const bIsFund = b.bass === undefined;
    if (aIsFund !== bIsFund) {
      return aIsFund ? -1 : 1;
    }
    if (a.additions.length !== b.additions.length) {
      return a.additions.length - b.additions.length;
    }
    if (a.omissions.length !== b.omissions.length) {
      return a.omissions.length - b.omissions.length;
    }
    return getQualityExoticPenalty(a.quality) - getQualityExoticPenalty(b.quality);
  });

  // Normalização do Confidence Score (UX)
  const bestScore = candidates[0].score;
  const maxConfidence = 96;

  const mappedCandidates = candidates.map(c => {
    let conf = Math.round((c.score / (bestScore || 1)) * maxConfidence);
    if (c.isIncomplete) conf = Math.max(5, conf - 15);
    conf = Math.max(5, Math.min(98, conf));
    return {
      ...c,
      confidence: conf
    };
  });

  // Remover duplicatas de nomes na cifragem internacional ativa
  const seenNames = new Set<string>();
  const filteredCandidates = mappedCandidates.filter(c => {
    if (seenNames.has(c.notationInternational)) return false;
    seenNames.add(c.notationInternational);
    return true;
  }).slice(0, 8);

  // Popular equivalências harmônicas classificadas para cada candidato
  return filteredCandidates.map(c => {
    const equivalents: HarmonicInterpretation[] = filteredCandidates
      .filter(other => other.notationInternational !== c.notationInternational)
      .map(other => {
        const category: "literal" | "inversao" = other.bass ? "inversao" : "literal";
        
        return {
          notationInternational: other.notationInternational,
          notationBrazilian: other.notationBrazilian,
          notationAcademic: other.notationAcademic,
          score: other.score,
          confidence: other.confidence,
          category
        };
      });

    return {
      ...c,
      equivalentInterpretations: equivalents
    };
  });
}
