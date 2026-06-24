export type DiagnosticSeverity = "info" | "warning" | "critical" | "suggestion";

export type DiagnosticSource =
  | "ADI"
  | "CFS"
  | "ISS"
  | "TAS"
  | "TFI"
  | "MIG"
  | "VOICE_LEADING"
  | "CADENCE";

export interface InspectorDiagnostic {
  id: string;
  severity: DiagnosticSeverity;
  category: "voice-leading" | "harmonic-fragility" | "cadence" | "theoretical-conflict" | "structural";
  subcategory?: "physical" | "harmonic";
  source: DiagnosticSource;
  confidence: number; // Intervalo de 0.0 a 1.0 para priorização e ordenação
  title: string;
  description: string;
  affectedMeasures: number[]; // Compassos afetados (1-based index)
  evidence?: string[];
  cadenceType?: "AUTHENTIC" | "PLAGAL" | "HALF" | "PHRYGIAN" | "DECEPTIVE" | "EVADED" | "DELAYED" | "INTERRUPTED";
  telemetry?: {
    adi?: number;
    cfs?: number;
    tas?: number;
    iss?: number;
    tfi?: number;
  };
}
