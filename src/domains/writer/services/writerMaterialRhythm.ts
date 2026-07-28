import type {
  ContextualMaterialIntent,
  ContextualMaterialRhythmArchetype
} from "../../../utils/music/theory/contextualMaterialTypes";
import type { WriterMaterialGestureRole } from "./writerMaterialCellRealization";

export type WriterMaterialRhythmId = ContextualMaterialRhythmArchetype;

export interface WriterMaterialRhythmTiming {
  onsetMs: number;
  durationMs: number;
  accent: boolean;
}

export interface WriterMaterialRhythmPlan {
  id: WriterMaterialRhythmId;
  label: string;
  description: string;
  timings: WriterMaterialRhythmTiming[];
  cycleDurationMs: number;
}

export interface WriterMaterialRhythmInput {
  stepCount: number;
  intent?: ContextualMaterialIntent;
  preferredArchetype?: ContextualMaterialRhythmArchetype;
  roles?: Array<WriterMaterialGestureRole | undefined>;
}

function rhythmIdForInput(input: WriterMaterialRhythmInput): WriterMaterialRhythmId {
  if (input.preferredArchetype) return input.preferredArchetype;
  if (input.intent === "outside") return "space-response";
  if (input.intent === "functional" || input.intent === "tension") return "syncopated";
  return "straight";
}

function straightTimings(stepCount: number): WriterMaterialRhythmTiming[] {
  return Array.from({ length: stepCount }, (_, index) => ({
    onsetMs: index * 220,
    durationMs: index === stepCount - 1 ? 560 : 320,
    accent: index === 0 || index === stepCount - 1
  }));
}

function syncopatedTimings(stepCount: number): WriterMaterialRhythmTiming[] {
  const gaps = [160, 280, 140, 240];
  let onsetMs = 0;

  return Array.from({ length: stepCount }, (_, index) => {
    if (index > 0) onsetMs += gaps[(index - 1) % gaps.length];
    return {
      onsetMs,
      durationMs: index === stepCount - 1 ? 560 : index % 2 === 0 ? 260 : 190,
      accent: index === 0 || index === stepCount - 1 || index % 3 === 2
    };
  });
}

function spaceResponseTimings(
  stepCount: number,
  roles: Array<WriterMaterialGestureRole | undefined>
): WriterMaterialRhythmTiming[] {
  const landingIndex = roles.findIndex(role => role === "return");
  const responseIndex = landingIndex > 0 ? landingIndex : Math.max(1, Math.ceil(stepCount / 2));
  let onsetMs = 0;

  return Array.from({ length: stepCount }, (_, index) => {
    if (index > 0) onsetMs += index === responseIndex ? 420 : 180;
    return {
      onsetMs,
      durationMs: index === stepCount - 1
        ? 620
        : index === responseIndex - 1 ? 170 : 280,
      accent: index === 0 || index === responseIndex || index === stepCount - 1
    };
  });
}

export function buildWriterMaterialRhythm(input: WriterMaterialRhythmInput): WriterMaterialRhythmPlan {
  const id = rhythmIdForInput(input);
  const roles = input.roles || [];
  const timings = id === "syncopated"
    ? syncopatedTimings(input.stepCount)
    : id === "space-response"
      ? spaceResponseTimings(input.stepCount, roles)
      : straightTimings(input.stepCount);
  const lastTiming = timings.at(-1);

  return {
    id,
    label: id === "syncopated"
      ? "Síncope curta"
      : id === "space-response" ? "Espaço e resposta" : "Pulso reto",
    description: id === "syncopated"
      ? "Ataques deslocados criam impulso sem alterar a ordem da célula."
      : id === "space-response"
        ? "Uma pausa separa a tensão da chegada para tornar o retorno audível."
        : "Pulso regular para ouvir com clareza o desenho e a função de cada nota.",
    timings,
    cycleDurationMs: lastTiming
      ? lastTiming.onsetMs + lastTiming.durationMs + 260
      : 0
  };
}
