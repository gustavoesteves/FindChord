interface WriterChordReadingInput {
  bass: string;
  inversion: string;
  voicingType: string;
  tensions: string[];
  tensionLevel: number;
}

export interface WriterChordReadingField {
  label: string;
  value: string;
  title?: string;
}

export interface WriterChordReadingPresentation {
  fields: WriterChordReadingField[];
  tensionLabel: string;
  tensionPercent: number;
}

export function writerTensionReading(level: number): string {
  if (level >= 0.72) return "Tensão alta";
  if (level >= 0.42) return "Tensão moderada";
  return "Tensão baixa";
}

export function presentWriterChordReading(chord: WriterChordReadingInput): WriterChordReadingPresentation {
  const tensionText = chord.tensions.join(", ") || "Nenhuma";
  return {
    fields: [
      { label: "Baixo", value: chord.bass },
      { label: "Inversão", value: chord.inversion },
      { label: "Estrutura", value: chord.voicingType },
      { label: "Tensões", value: tensionText, title: tensionText }
    ],
    tensionLabel: writerTensionReading(chord.tensionLevel),
    tensionPercent: Math.max(0, Math.min(100, chord.tensionLevel * 100))
  };
}
