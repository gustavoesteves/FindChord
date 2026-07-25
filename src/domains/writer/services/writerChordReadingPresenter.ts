interface WriterChordReadingInput {
  bass: string;
  inversion: string;
  voicingType: string;
  tensions: string[];
  tensionLevel: number;
  omissions?: string[];
  structuralRoles?: string[];
  voiceRoles?: string[];
  outerVoices?: string[];
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
  const structuralRolesText = chord.structuralRoles?.length ? chord.structuralRoles.join(", ") : null;
  const outerVoicesText = chord.outerVoices?.length ? chord.outerVoices.join(", ") : null;
  const voiceRolesText = chord.voiceRoles?.length ? chord.voiceRoles.join(", ") : null;
  const omissionText = chord.omissions?.length ? chord.omissions.join(", ") : null;
  const fields = [
    { label: "Baixo", value: chord.bass },
    { label: "Inversão", value: chord.inversion },
    { label: "Estrutura", value: chord.voicingType },
    { label: "Tensões", value: tensionText, title: tensionText }
  ];
  if (structuralRolesText) {
    fields.push({ label: "Notas estruturais", value: structuralRolesText, title: structuralRolesText });
  }
  if (outerVoicesText) {
    fields.push({ label: "Vozes externas", value: outerVoicesText, title: outerVoicesText });
  }
  if (voiceRolesText) {
    fields.push({ label: "Papéis por corda", value: voiceRolesText, title: voiceRolesText });
  }
  if (omissionText) {
    fields.push({ label: "Omissões", value: omissionText, title: omissionText });
  }

  return {
    fields,
    tensionLabel: writerTensionReading(chord.tensionLevel),
    tensionPercent: Math.max(0, Math.min(100, chord.tensionLevel * 100))
  };
}
