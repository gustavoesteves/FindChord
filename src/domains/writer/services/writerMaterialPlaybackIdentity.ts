import type { WriterMaterialPlaybackState } from "./writerMaterialPlaybackController";

export interface WriterMaterialPlaybackIdentityInput {
  chordIdentity: string;
  selectedFrets: ReadonlyArray<number | null>;
  tuning: ReadonlyArray<string>;
  routeId: string | null;
  materialName?: string | null;
  moveId?: string | null;
}

export interface VisibleWriterMaterialActiveStepInput {
  activePlaybackIdentity: string | null;
  materialPlaybackIdentity: string;
  playbackState: WriterMaterialPlaybackState;
}

export function writerMaterialPlaybackIdentity(input: WriterMaterialPlaybackIdentityInput): string {
  return [
    input.chordIdentity,
    input.selectedFrets.map(fret => fret ?? "x").join(","),
    input.tuning.join(","),
    input.routeId || "rota-automatica",
    input.materialName || "material-automatico",
    input.moveId || "gesto-automatico"
  ].join("|");
}

export function visibleWriterMaterialActiveStepIndex(
  input: VisibleWriterMaterialActiveStepInput
): number | null {
  if (input.playbackState.status !== "playing") return null;
  return input.activePlaybackIdentity === input.materialPlaybackIdentity
    ? input.playbackState.stepIndex
    : null;
}
