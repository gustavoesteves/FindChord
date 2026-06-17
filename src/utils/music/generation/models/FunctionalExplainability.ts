export interface ExplanationReport {
  summary: string;
  preservationDetails: string[];
  mutationDetails: string[];
  musicalInterpretation: string[];
  driftDiagnosis: string;
  verdict: string;
  
  confidence: number;
  explanationTokens: string[];
  
  fullText: string;
}
