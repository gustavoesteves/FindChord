import { Note } from "tonal";
import { simplifyNote } from "../core/pitch";
import {
  materialNoteRoleFor,
  type MaterialChordIdentity,
  type MaterialDegreeRole
} from "../theory/materialChordIdentity";

export type MelodicCellIntent = "inside" | "functional" | "tension" | "outside";
export type MelodicCellHarmonicRole = "support" | "color" | "tension" | "outside";
export type MelodicCellGestureRole = "cell" | "return";
export type MelodicCellDirection = "ascending" | "descending" | "mixed" | "static";
export type MelodicCellContour = "original" | "ascending" | "descending" | "arch";
export type MelodicCellResolutionScope = "none" | "local-return";
export type MelodicCellRhythmArchetype = "straight" | "syncopated" | "space-response";

export interface MelodicCellEvent {
  note: string;
  intervalDegree: string;
  harmonicRole: MelodicCellHarmonicRole;
  gestureRole: MelodicCellGestureRole;
}

export interface BaseMelodicCell {
  id: string;
  notation: string;
  events: MelodicCellEvent[];
  intent: MelodicCellIntent;
  direction: MelodicCellDirection;
  contour: MelodicCellContour;
  resolutionScope: MelodicCellResolutionScope;
  localReturnDegrees: string[];
  preferredRhythmArchetype?: MelodicCellRhythmArchetype;
}

export interface ContextualCellSelection {
  cell: BaseMelodicCell;
  resolutionScope: "contextual-arrival";
  targetEventId: string;
  targetDegrees: string[];
}

export function stableMelodicCellToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/#/g, "sharp")
    .replace(/♭/g, "flat")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "cell";
}

export function notesInMelodicCellNotation(notation: string): string[] {
  const separator = notation.includes("->") ? "->" : "-";
  return notation
    .split(separator)
    .map(note => simplifyNote(note.trim()))
    .filter(Boolean);
}

function noteChroma(note: string): number | null {
  const chroma = Note.chroma(note);
  return chroma === null ? null : chroma;
}

function directedSemitoneDistance(from: string, to: string): number | null {
  const fromChroma = noteChroma(from);
  const toChroma = noteChroma(to);
  if (fromChroma === null || toChroma === null) return null;
  const distance = (toChroma - fromChroma + 12) % 12;
  return distance > 6 ? distance - 12 : distance;
}

export function melodicCellDirection(notes: string[]): MelodicCellDirection {
  const movements = notes.slice(1)
    .map((note, index) => directedSemitoneDistance(notes[index], note))
    .filter((distance): distance is number => distance !== null && distance !== 0);
  if (movements.length === 0) return "static";
  const hasAscending = movements.some(distance => distance > 0);
  const hasDescending = movements.some(distance => distance < 0);
  if (hasAscending && hasDescending) return "mixed";
  return hasAscending ? "ascending" : "descending";
}

function contourForDirection(direction: MelodicCellDirection): MelodicCellContour {
  if (direction === "ascending") return "ascending";
  if (direction === "descending") return "descending";
  return "original";
}

function harmonicRoleForDegreeRole(
  role: MaterialDegreeRole,
  intent: MelodicCellIntent
): MelodicCellHarmonicRole {
  if (role === "written-tension" || role === "voicing-alteration") return "tension";
  if (role === "passing") return "color";
  if (role === "structural-support") return "support";
  return intent === "outside" ? "outside" : "color";
}

function fallbackDegreeFor(note: string): string {
  return simplifyNote(Note.pitchClass(note) || note);
}

export function baseMelodicCellFromNotation(input: {
  materialId: string;
  notation: string;
  intent: MelodicCellIntent;
  materialIdentity?: MaterialChordIdentity;
  resolutionTargets?: string[];
  preferredRhythmArchetype?: MelodicCellRhythmArchetype;
}): BaseMelodicCell {
  const notes = notesInMelodicCellNotation(input.notation);
  const hasLocalReturn = input.notation.includes("->");
  const resolutionTargetChromas = new Set((input.resolutionTargets || []).map(noteChroma).filter((value): value is number => value !== null));
  const events = notes.map((note, index): MelodicCellEvent => {
    const role = input.materialIdentity
      ? materialNoteRoleFor(input.materialIdentity, note)
      : { degree: fallbackDegreeFor(note), role: "available-color" as const };
    const noteIsReturnTarget = hasLocalReturn
      && index === notes.length - 1
      && resolutionTargetChromas.has(noteChroma(note) ?? -1);

    return {
      note,
      intervalDegree: role.degree,
      harmonicRole: harmonicRoleForDegreeRole(role.role, input.intent),
      gestureRole: noteIsReturnTarget ? "return" : "cell"
    };
  });
  const direction = melodicCellDirection(notes);
  const localReturnDegrees = events
    .filter(event => event.gestureRole === "return")
    .map(event => event.intervalDegree);

  return {
    id: `${stableMelodicCellToken(input.materialId)}:${stableMelodicCellToken(input.notation)}`,
    notation: input.notation,
    events,
    intent: input.intent,
    direction,
    contour: contourForDirection(direction),
    resolutionScope: localReturnDegrees.length > 0 ? "local-return" : "none",
    localReturnDegrees,
    preferredRhythmArchetype: input.preferredRhythmArchetype
  };
}
