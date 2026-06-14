import type { CanonicalProgressionEvent } from "../../models/CanonicalProgressionEvent";
import type { CanonicalChordEvent } from "../../models/CanonicalChordEvent";
import type { InspectorDiagnostic } from "../../models/InspectorDiagnostic";
import type { VoicingShape } from "../../../models/VoicingShape";
import { buildAnalyzedVoicing } from "../../voicingAnalyzer";
import { ParallelFifthsRule } from "../../../voiceLeading/rules/ParallelFifthsRule";
import { ParallelOctavesRule } from "../../../voiceLeading/rules/ParallelOctavesRule";
import { calculateVoiceLeadingCost } from "../../../voiceLeading/voiceLeading";
import { getAbsolutePitch } from "../../../core/midi";
import { getNoteAt } from "../../../core/notes";

const parallelFifthsRule = new ParallelFifthsRule();
const parallelOctavesRule = new ParallelOctavesRule();

function eventToVoicingShape(event: CanonicalChordEvent): VoicingShape {
  const frets = event.voicing.frets || Array(event.tuning.strings.length).fill(null);
  const notes: string[] = [];
  frets.forEach((fret: number | null, stringIdx: number) => {
    if (fret !== null) {
      notes.push(getNoteAt(event.tuning.strings[stringIdx], fret));
    }
  });

  return {
    chordName: event.symbol,
    frets,
    rootString: 0,
    cageShape: "E",
    positionFret: 0,
    notes
  };
}

export function runVoiceLeadingDiagnostics(
  progression: CanonicalProgressionEvent
): InspectorDiagnostic[] {
  const diagnostics: InspectorDiagnostic[] = [];

  for (let i = 0; i < progression.chordEvents.length - 1; i++) {
    const currentEvent = progression.chordEvents[i];
    const nextEvent = progression.chordEvents[i + 1];

    const tuning = currentEvent.tuning.strings;

    const voicingA = buildAnalyzedVoicing(eventToVoicingShape(currentEvent), tuning);
    const voicingB = buildAnalyzedVoicing(eventToVoicingShape(nextEvent), tuning);

    // 1. Parallel Octaves Check (Harmonic Voice Leading)
    const hasParallelOctaves = parallelOctavesRule.evaluate(voicingA, voicingB, tuning);
    if (hasParallelOctaves > 0) {
      diagnostics.push({
        id: `vl-parallel-octaves-${i}`,
        severity: "critical",
        category: "voice-leading",
        subcategory: "harmonic",
        source: "VOICE_LEADING",
        confidence: 0.95,
        title: "Oitavas Paralelas Detectadas",
        description: `Movimento paralelo de oitavas detectado na transição entre o acorde ${currentEvent.symbol} (Compasso ${i + 1}) e ${nextEvent.symbol} (Compasso ${i + 2}). Isso é desencorajado no contraponto tradicional.`,
        affectedMeasures: [i + 1, i + 2],
        evidence: ["Duas vozes se movem na mesma direção mantendo um intervalo de oitava (12 semitônios) entre si."]
      });
    }

    // 2. Parallel Fifths Check (Harmonic Voice Leading)
    const hasParallelFifths = parallelFifthsRule.evaluate(voicingA, voicingB, tuning);
    if (hasParallelFifths > 0) {
      diagnostics.push({
        id: `vl-parallel-fifths-${i}`,
        severity: "critical",
        category: "voice-leading",
        subcategory: "harmonic",
        source: "VOICE_LEADING",
        confidence: 0.95,
        title: "Quintas Paralelas Detectadas",
        description: `Movimento paralelo de quintas detectado na transição entre o acorde ${currentEvent.symbol} (Compasso ${i + 1}) e ${nextEvent.symbol} (Compasso ${i + 2}).`,
        affectedMeasures: [i + 1, i + 2],
        evidence: ["Duas vozes se movem na mesma direção mantendo um intervalo de quinta justa (7 semitônios) entre si."]
      });
    }

    // 3. Excessive Leaps Check (Physical Voice Leading)
    const fretsA = voicingA.shape.frets;
    const fretsB = voicingB.shape.frets;
    const leaps: string[] = [];
    let maxLeap = 0;

    for (let stringIdx = 0; stringIdx < tuning.length; stringIdx++) {
      const baseNote = tuning[stringIdx];
      const fretA = fretsA[stringIdx];
      const fretB = fretsB[stringIdx];
      const pitchA = getAbsolutePitch(fretA, baseNote);
      const pitchB = getAbsolutePitch(fretB, baseNote);

      if (fretA !== null && fretB !== null && pitchA !== null && pitchB !== null) {
        const diff = Math.abs(pitchB - pitchA);
        const isBass = stringIdx === 0 || (stringIdx === 1 && fretsA[0] === null);
        if (diff > 8 && !isBass) {
          if (diff > maxLeap) maxLeap = diff;
          leaps.push(`Corda ${stringIdx + 1} saltou ${diff} semitônios (${getNoteAt(baseNote, fretA)} → ${getNoteAt(baseNote, fretB)})`);
        }
      }
    }

    if (leaps.length > 0) {
      // Confidence is higher for larger leaps
      const leapConfidence = Math.min(1.0, 0.5 + (maxLeap - 8) * 0.1);
      diagnostics.push({
        id: `vl-excessive-leaps-${i}`,
        severity: "warning",
        category: "voice-leading",
        subcategory: "physical",
        source: "VOICE_LEADING",
        confidence: Number(leapConfidence.toFixed(4)),
        title: "Salto Vocal Excessivo",
        description: `Uma ou mais vozes superiores apresentam saltos intervalares excessivos (> 8 semitônios) na transição para o acorde ${nextEvent.symbol} (Compasso ${i + 2}).`,
        affectedMeasures: [i + 1, i + 2],
        evidence: leaps
      });
    }

    // 4. Overall Voice Leading Movement Cost (Physical Voice Leading)
    const costAnalysis = calculateVoiceLeadingCost(voicingA, voicingB, tuning);
    if (costAnalysis.totalCost > 45) {
      // Confidence escalates with cost
      const costConfidence = Math.min(1.0, 0.6 + (costAnalysis.totalCost - 45) * 0.015);
      diagnostics.push({
        id: `vl-non-optimized-${i}`,
        severity: "warning",
        category: "voice-leading",
        subcategory: "physical",
        source: "VOICE_LEADING",
        confidence: Number(costConfidence.toFixed(4)),
        title: "Condução Harmônica Distante (Custo Elevado)",
        description: `A transição para o acorde ${nextEvent.symbol} (Compasso ${i + 2}) exige uma movimentação física muito alta no braço do instrumento (Custo: ${costAnalysis.totalCost.toFixed(1)}).`,
        affectedMeasures: [i + 1, i + 2],
        evidence: [
          `Custo de transição física acumulado: ${costAnalysis.totalCost.toFixed(2)}`,
          `Considere formatos mais próximos para garantir uma condução de vozes (voice leading) mais fluida e suave.`
        ]
      });
    }
  }

  return diagnostics;
}
