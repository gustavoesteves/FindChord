import type { LocalChordMaterialReading } from "../../../utils/music/theory/localChordMaterials";
import type { ContextualMaterialIntent } from "../../../utils/music/theory/contextualMaterialTypes";
import { materialIntentPresentation } from "../../../utils/music/theory/materialIntentPresentation";
import type { MaterialSourceMap } from "../../../utils/music/theory/musicTheory";

export type WriterMaterialIntentLabel = "Dentro" | "Funcional" | "Cor" | "Tensão" | "Fora";
export type WriterMaterialActionLabel =
  | "Apoiar o acorde"
  | "Colorir sem sair"
  | "Explorar cor"
  | "Preparar resolução"
  | "Sair e voltar";

const ACTION_LABEL_BY_INTENT_LABEL: Record<WriterMaterialIntentLabel, WriterMaterialActionLabel> = {
  Dentro: "Apoiar o acorde",
  Funcional: "Colorir sem sair",
  Cor: "Explorar cor",
  Tensão: "Preparar resolução",
  Fora: "Sair e voltar"
};

export interface WriterMaterialPaletteItem {
  source: MaterialSourceMap;
  title: string;
  subtitle: string;
  cells: string[];
  extraMaterialCount: number;
  intent?: ContextualMaterialIntent;
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
  return intent ? materialIntentPresentation(intent).writerLabel as WriterMaterialIntentLabel : "Cor";
}

function subtitleFor(reading: LocalChordMaterialReading): string {
  if (reading.primaryMaterial?.practiceHint) return reading.primaryMaterial.practiceHint;
  if (reading.candidate?.practiceHint) return reading.candidate.practiceHint;
  return "Use como conjunto de notas, cores e células possíveis para este acorde.";
}

export function actionLabelForWriterMaterialIntent(
  intentLabel: WriterMaterialIntentLabel,
  intent?: ContextualMaterialIntent
): WriterMaterialActionLabel {
  if (intent) return materialIntentPresentation(intent).writerActionLabel as WriterMaterialActionLabel;
  return ACTION_LABEL_BY_INTENT_LABEL[intentLabel];
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
      intent: reading.candidate?.intent,
      intentLabel,
      actionLabel: actionLabelForWriterMaterialIntent(intentLabel, reading.candidate?.intent)
    };
  });
}
