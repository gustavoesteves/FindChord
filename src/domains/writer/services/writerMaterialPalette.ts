import type { LocalChordMaterialReading } from "../../../utils/music/theory/localChordMaterials";
import type { ScaleInfo } from "../../../utils/music/theory/musicTheory";

export type WriterMaterialIntentLabel = "Dentro" | "Funcional" | "Cor" | "Tensão" | "Fora";
export type WriterMaterialActionLabel =
  | "Apoiar o acorde"
  | "Colorir sem sair"
  | "Explorar cor"
  | "Preparar resolução"
  | "Tensionar por fora";

const ACTION_LABEL_BY_INTENT: Record<WriterMaterialIntentLabel, WriterMaterialActionLabel> = {
  Dentro: "Apoiar o acorde",
  Funcional: "Colorir sem sair",
  Cor: "Explorar cor",
  Tensão: "Preparar resolução",
  Fora: "Tensionar por fora"
};

export interface WriterMaterialPaletteItem {
  source: ScaleInfo;
  title: string;
  subtitle: string;
  cells: string[];
  extraMaterialCount: number;
  intentLabel: WriterMaterialIntentLabel;
  actionLabel: WriterMaterialActionLabel;
}

export function shortHintForWriterMaterialCard(text: string): string {
  const [firstSentence] = text.split(/(?<=[.!?])\s+/);
  const hint = firstSentence || text;
  if (hint.length <= 72) return hint;

  const trimmed = hint.slice(0, 69).trim();
  const lastSpace = trimmed.lastIndexOf(" ");
  const safeTrimmed = lastSpace > 40 ? trimmed.slice(0, lastSpace) : trimmed;
  return `${safeTrimmed}...`;
}

function intentLabelFor(reading: LocalChordMaterialReading): WriterMaterialIntentLabel {
  const intent = reading.candidate?.intent;
  if (intent === "inside") return "Dentro";
  if (intent === "functional") return "Funcional";
  if (intent === "tension") return "Tensão";
  if (intent === "outside") return "Fora";
  return "Cor";
}

function subtitleFor(reading: LocalChordMaterialReading): string {
  if (reading.primaryMaterial?.practiceHint) return reading.primaryMaterial.practiceHint;
  if (reading.candidate?.practiceHint) return reading.candidate.practiceHint;
  return "Use como conjunto de notas, cores e células possíveis para este acorde.";
}

export function actionLabelForWriterMaterialIntent(
  intentLabel: WriterMaterialIntentLabel
): WriterMaterialActionLabel {
  return ACTION_LABEL_BY_INTENT[intentLabel];
}

export function buildWriterMaterialPalette(readings: LocalChordMaterialReading[]): WriterMaterialPaletteItem[] {
  return readings.map(reading => {
    const subtitle = subtitleFor(reading);
    const intentLabel = intentLabelFor(reading);

    return {
      source: reading.source,
      title: reading.primaryMaterial?.label || reading.source.name,
      subtitle,
      cells: reading.primaryMaterial?.cells.slice(0, 3) || reading.source.notes.slice(0, 4),
      extraMaterialCount: reading.extraMaterialCount,
      intentLabel,
      actionLabel: actionLabelForWriterMaterialIntent(intentLabel)
    };
  });
}
