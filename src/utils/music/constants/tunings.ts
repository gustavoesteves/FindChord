export interface TuningPreset {
  name: string;
  notes: string[]; // 0 (1ª corda) a 5 (6ª corda)
}

export const TUNING_PRESETS: TuningPreset[] = [
  { name: "Padrão (Standard)", notes: ["E4", "B3", "G3", "D3", "A2", "E2"] },
  { name: "Drop D", notes: ["E4", "B3", "G3", "D3", "A2", "D2"] },
  { name: "Eb Padrão (Eb Standard)", notes: ["Eb4", "Bb3", "Gb3", "Db3", "Ab2", "Eb2"] },
  { name: "D Padrão (D Standard)", notes: ["D4", "A3", "F3", "C3", "G2", "D2"] },
  { name: "Open G", notes: ["D4", "B3", "G3", "D3", "G2", "D2"] },
  { name: "Open D", notes: ["D4", "A3", "F#3", "D3", "A2", "D2"] }
];
