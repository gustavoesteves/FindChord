export interface TuningPreset {
  name: string;
  notes: string[];
}

export interface Instrument {
  name: string;
  defaultTuning: string[];
  tuningPresets: TuningPreset[];
}

export const INSTRUMENTS: Instrument[] = [
  {
    name: "Violão",
    defaultTuning: ["E4", "B3", "G3", "D3", "A2", "E2"],
    tuningPresets: [
      { name: "Padrão (Standard)", notes: ["E4", "B3", "G3", "D3", "A2", "E2"] },
      { name: "Drop D", notes: ["E4", "B3", "G3", "D3", "A2", "D2"] },
      { name: "Eb Padrão (Eb Standard)", notes: ["Eb4", "Bb3", "Gb3", "Db3", "Ab2", "Eb2"] },
      { name: "D Padrão (D Standard)", notes: ["D4", "A3", "F3", "C3", "G2", "D2"] },
      { name: "Open G", notes: ["D4", "B3", "G3", "D3", "G2", "D2"] },
      { name: "Open D", notes: ["D4", "A3", "F#3", "D3", "A2", "D2"] }
    ]
  },
  {
    name: "Violão 7 cordas",
    defaultTuning: ["E4", "B3", "G3", "D3", "A2", "E2", "C2"],
    tuningPresets: [
      { name: "Padrão 7 cordas (Baixaria em C)", notes: ["E4", "B3", "G3", "D3", "A2", "E2", "C2"] },
      { name: "Padrão 7 cordas (Baixaria em B)", notes: ["E4", "B3", "G3", "D3", "A2", "E2", "B1"] },
      { name: "Drop A (Sete Cordas)", notes: ["E4", "B3", "G3", "D3", "A2", "E2", "A1"] }
    ]
  },
  {
    name: "Baixo",
    defaultTuning: ["G2", "D2", "A1", "E1"],
    tuningPresets: [
      { name: "Padrão (Bass Standard)", notes: ["G2", "D2", "A1", "E1"] },
      { name: "Drop D Bass", notes: ["G2", "D2", "A1", "D1"] },
      { name: "Meio tom abaixo (Half-Step Down)", notes: ["Gb2", "Db2", "Ab1", "Eb1"] }
    ]
  },
  {
    name: "Baixo 6 cordas",
    defaultTuning: ["C3", "G2", "D2", "A1", "E1", "B0"],
    tuningPresets: [
      { name: "Padrão (Bass 6 Standard)", notes: ["C3", "G2", "D2", "A1", "E1", "B0"] }
    ]
  }
];
