import type { HarmonyDecision } from "../../models/HarmonyDecision";
import type { VoicedProgression } from "../../realization/models/VoicedProgression";
import type { PerformanceTimeline } from "../../runtime/models/PerformanceTimeline";

export interface SessionBundle {
  bundleType: "HarmonySessionBundle";
  version: "1.0.0";
  engineVersion: string;
  createdAtUtc: string;
  harmonyDecision: HarmonyDecision;
  voicedProgression: VoicedProgression;
  performanceTimeline: PerformanceTimeline;
  midiBase64: string;
  midiChecksum: string;
  
  // Configuração global de tempo e andamento (Sprint 5B)
  bpm: number;
  timeSignature: {
    numerator: number;
    denominator: number;
  };
  
  // Metadados opcionais para fluxo de trabalho DAW
  sessionName?: string;
  notes?: string;
  tags?: string[];
}
