import type { GenerationConstraints } from "../models/GenerationConstraints";
import type { HarmonyDecision } from "../models/HarmonyDecision";
import type { ResolvedProgression } from "../models/ResolvedProgression";
import type { VoiceLeadingMetrics } from "../models/VoiceLeadingMetrics";
import type { HarmonyRequest } from "../models/HarmonyRequest";
import type { AnalyzedVoicing } from "../models/AnalyzedVoicing";
import type { VoicingShape } from "../models/VoicingShape";
import type { MidiRenderOptions, MidiExportResult } from "../models/MidiExport";
import { exportMidiFromVoiced } from "../midi/midiExporter";
import type { VoicingLayout } from "../realization/models/VoicingLayout";
import type { VoicingTransform } from "../realization/models/VoicingTransform";
import type { VoicedProgression } from "../realization/models/VoicedProgression";
import { progressionRealizer } from "../realization/ProgressionRealizer";
import { findAutoVoicingsAdvanced } from "../voiceLeading/voiceLeading";

// Runtime Musical (Sprint 4.5)
import type { RuntimePattern } from "../runtime/models/RuntimePattern";
import type { PerformanceEvent } from "../runtime/models/PerformanceEvent";
import type { PerformanceMetrics } from "../runtime/models/PerformanceMetrics";
import type { PerformanceTimeline } from "../runtime/models/PerformanceTimeline";
import { harmonyRuntime } from "../runtime/HarmonyRuntime";

// MusicXML Exporter
import { exportMusicXml } from "../musicxml/musicxmlExporter";

export type {
  RuntimePattern,
  PerformanceEvent,
  PerformanceMetrics,
  PerformanceTimeline
};
export { harmonyRuntime, exportMusicXml };



import { parseChord } from "../theory/chordParser";
import { getPitchClass } from "../core/pitch";
import { generateVoicings } from "../generation/voicingGenerator";
import { buildAnalyzedVoicing } from "../analysis/voicingAnalyzer";

// Regras modulares para cálculo de métricas puras
import { ParallelFifthsRule } from "../voiceLeading/rules/ParallelFifthsRule";
import { ParallelOctavesRule } from "../voiceLeading/rules/ParallelOctavesRule";
import { ContraryMotionRule } from "../voiceLeading/rules/ContraryMotionRule";
import { CommonToneRetentionRule } from "../voiceLeading/rules/CommonToneRetentionRule";
import { FunctionalResolutionRule } from "../voiceLeading/rules/FunctionalResolutionRule";

const parallelFifthsRule = new ParallelFifthsRule();
const parallelOctavesRule = new ParallelOctavesRule();
const contraryMotionRule = new ContraryMotionRule();
const commonToneRetentionRule = new CommonToneRetentionRule();
const functionalResolutionRule = new FunctionalResolutionRule();

// Removido SolveOptions para usar o DTO formal HarmonyRequest

export function filterCandidatesWithConstraints(
  candidates: AnalyzedVoicing[],
  constraints: GenerationConstraints
): AnalyzedVoicing[] {
  return candidates.filter(av => {
    // 1. voiceCount
    if (constraints.voiceCount !== undefined && constraints.voiceCount !== "any") {
      const activeCount = av.shape.frets.filter(f => f !== null).length;
      if (activeCount !== constraints.voiceCount) return false;
    }

    // 2. structure
    if (constraints.structure !== undefined && constraints.structure !== "any") {
      const family = (av.shape.shapeFamily || "").toLowerCase();
      if (constraints.structure === "drop2" && !family.includes("drop 2")) return false;
      if (constraints.structure === "drop3" && !family.includes("drop 3")) return false;
      if (constraints.structure === "shell" && !family.includes("shell")) return false;
    }

    // 3. omitRoot
    if (constraints.omitRoot) {
      const upperVoicesHaveRoot = av.roles.voices.some(
        v => v.info?.role === "root" && v.stringIndex < 4
      );
      if (upperVoicesHaveRoot) return false;
    }

    // 4. requireGuideTones
    if (constraints.requireGuideTones) {
      const hasThird = av.roles.voices.some(v => v.info?.role === "third");
      const hasSeventh = av.roles.voices.some(v => v.info?.role === "seventh");
      if (!hasThird || !hasSeventh) return false;
    }

    // 5. positionRange
    if (constraints.positionRange && constraints.positionRange !== "all") {
      const pos = av.shape.positionFret;
      if (constraints.positionRange === "0-5" && (pos < 0 || pos > 5)) return false;
      if (constraints.positionRange === "5-9" && (pos < 5 || pos > 9)) return false;
      if (constraints.positionRange === "9-12" && (pos < 9 || pos > 12)) return false;
      if (constraints.positionRange === "12+" && pos < 12) return false;
    }

    return true;
  });
}

export function calculateMetrics(
  progression: ResolvedProgression,
  tuning: string[]
): VoiceLeadingMetrics {
  const path = progression.bestPath.filter((v): v is AnalyzedVoicing => v !== null);
  let totalDistance = 0;
  let contraryMotions = 0;
  let retainedCommonTones = 0;
  let parallelFifths = 0;
  let parallelOctaves = 0;
  let functionalResolutions = 0;

  for (let i = 1; i < path.length; i++) {
    const vA = path[i - 1];
    const vB = path[i];

    for (let sIdx = 0; sIdx < 6; sIdx++) {
      const fA = vA.shape.frets[sIdx];
      const fB = vB.shape.frets[sIdx];
      if (fA !== null && fB !== null) {
        totalDistance += Math.abs(fB - fA);
      }
    }

    contraryMotions += contraryMotionRule.evaluate(vA, vB, tuning);
    retainedCommonTones += commonToneRetentionRule.evaluate(vA, vB, tuning);
    parallelFifths += parallelFifthsRule.evaluate(vA, vB, tuning);
    parallelOctaves += parallelOctavesRule.evaluate(vA, vB, tuning);
    
    const bonus = functionalResolutionRule.evaluate(vA, vB, tuning);
    if (bonus < 0) {
      functionalResolutions += Math.round(Math.abs(bonus) / 5);
    }
  }

  return {
    totalDistance,
    contraryMotions,
    retainedCommonTones,
    parallelFifths,
    parallelOctaves,
    functionalResolutions
  };
}

export const harmonyEngine = {
  /**
   * Resolve uma timeline/progressão contrapontística gerando uma HarmonyDecision.
   */
  solve(request: HarmonyRequest): HarmonyDecision {
    const progression = request.progression;
    const constraints = request.constraints || {};
    const tuning = request.tuning || ["E4", "B3", "G3", "D3", "A2", "E2"];
    const includeAlternatives = request.includeAlternatives ?? false;

    // 1. Gerar e filtrar candidatos com restrições
    const filteredCandidatesOverride: AnalyzedVoicing[][] = progression.map(chordName => {
      const chordInfo = parseChord(chordName);
      if (chordInfo.empty) return [];
      const root = chordInfo.root || "C";
      const targetPCs = chordInfo.notes.map(n => getPitchClass(n));
      const bassPC = chordInfo.bass ? getPitchClass(chordInfo.bass) : null;
      const generatedShapes = generateVoicings(chordName, root, targetPCs, tuning, chordInfo.quality, bassPC);
      
      const analyzedCandidates = generatedShapes.map(shape => buildAnalyzedVoicing(shape, tuning));
      return filterCandidatesWithConstraints(analyzedCandidates, constraints);
    });

    // 2. Invocar Viterbi com candidatos filtrados
    const viterbiResult = findAutoVoicingsAdvanced(
      progression,
      tuning,
      includeAlternatives,
      filteredCandidatesOverride
    );

    // 3. Computar métricas de domínio
    const metrics = calculateMetrics(viterbiResult.solution, tuning);

    const decision: HarmonyDecision = {
      solution: viterbiResult.solution,
      metrics
    };

    if (includeAlternatives && viterbiResult.alternatives) {
      decision.alternatives = viterbiResult.alternatives;
    }

    return decision;
  },

  /**
   * Reorganiza e materializa uma HarmonyDecision abstrata em uma VoicedProgression estilizada.
   */
  realize(
    decision: HarmonyDecision,
    layout: VoicingLayout,
    transform: VoicingTransform,
    tuning?: string[]
  ): VoicedProgression {
    return progressionRealizer.realize(decision, layout, transform, tuning);
  },

  /**
   * Converte uma VoicedProgression estática em uma PerformanceTimeline temporizada rítmica.
   */
  perform(
    voiced: VoicedProgression,
    pattern: RuntimePattern,
    options?: { chordDurationBeats?: number; velocity?: number }
  ): PerformanceTimeline {
    return harmonyRuntime.perform(voiced, pattern, options);
  },

  /**
   * Resolve a progressão ativa ou renderiza uma VoicedProgression direta em uma trilha MIDI.
   */
  generateMidi(
    requestOrVoiced: HarmonyRequest | VoicedProgression,
    options: MidiRenderOptions
  ): MidiExportResult {
    if ("voicings" in requestOrVoiced && "layout" in requestOrVoiced && "transform" in requestOrVoiced) {
      // VoicedProgression materializada direta
      return exportMidiFromVoiced(requestOrVoiced, options);
    } else {
      // HarmonyRequest padrão
      const request = requestOrVoiced as HarmonyRequest;
      const decision = this.solve(request);
      const tuning = request.tuning || ["E4", "B3", "G3", "D3", "A2", "E2"];
      const voiced = this.realize(decision, "guitar", "none", tuning);
      return exportMidiFromVoiced(voiced, options);
    }
  },

  /**
   * Converte a progressão ativa em um arquivo estruturado de notação MusicXML 4.0.
   */
  exportMusicXml(chords: string[], voicings: (VoicingShape | null)[], bpm: number): string {
    return exportMusicXml(chords, voicings, bpm);
  }
};
