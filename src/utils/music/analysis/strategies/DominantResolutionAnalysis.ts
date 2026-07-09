import { Note } from "tonal";
import { chordRoot, resolveChordSymbol } from "../../theory/ChordSymbolResolver";
import { analyzeDominantTension } from "./DominantTensionAnalysis";

export type DominantResolutionKind =
  | "non-dominant"
  | "immediate"
  | "subv-immediate"
  | "delayed"
  | "subv-delayed"
  | "prolonged"
  | "same-root-color-release"
  | "dominant-reentry"
  | "terminal-dominant"
  | "deceptive"
  | "unresolved";

export interface DominantResolutionAnalysis {
  chord: string;
  kind: DominantResolutionKind;
  targetRoot: string | null;
  resolvedAtOffset: number | null;
  evidence: string[];
}

export function analyzeDominantResolution(
  chords: string[],
  index: number,
  lookahead = 2
): DominantResolutionAnalysis {
  const chord = chords[index];
  const tension = analyzeDominantTension(chord || "");
  if (!chord || !tension.isDominant || !tension.root) {
    return {
      chord: chord || "",
      kind: "non-dominant",
      targetRoot: null,
      resolvedAtOffset: null,
      evidence: ["não é dominante funcional"]
    };
  }

  const dominantTarget = transposePitch(tension.root, "4P");
  const subVTarget = transposePitch(tension.root, "-2m");
  const nextChord = chords[index + 1];
  const nextRoot = normalizedRoot(nextChord);

  if (!nextChord) {
    return {
      chord,
      kind: "terminal-dominant",
      targetRoot: dominantTarget,
      resolvedAtOffset: null,
      evidence: ["dominante alterada em borda de frase ou fim da janela"]
    };
  }

  if (nextRoot && dominantTarget && samePitch(nextRoot, dominantTarget)) {
    return resolved(chord, "immediate", dominantTarget, 1, "resolve por quarta ascendente no acorde seguinte");
  }

  if (nextRoot && subVTarget && samePitch(nextRoot, subVTarget)) {
    return resolved(chord, "subv-immediate", subVTarget, 1, "resolve por semitom descendente como SubV");
  }

  if (nextRoot && dominantTarget && isDeceptiveRoot(nextRoot, dominantTarget)) {
    return resolved(chord, "deceptive", dominantTarget, 1, "desvia para região deceptiva próxima do alvo esperado");
  }

  const prolonged = nextChord && dominantTarget && hasSameDominantTarget(nextChord, dominantTarget);
  for (let offset = 2; offset <= lookahead + 1; offset++) {
    const candidateRoot = normalizedRoot(chords[index + offset]);
    if (!candidateRoot) continue;
    if (dominantTarget && samePitch(candidateRoot, dominantTarget)) {
      return resolved(
        chord,
        prolonged ? "prolonged" : "delayed",
        dominantTarget,
        offset,
        prolonged
          ? "prolonga a dominante antes da resolução"
          : "resolve depois de acorde intermediário"
      );
    }
    if (subVTarget && samePitch(candidateRoot, subVTarget)) {
      return resolved(chord, "subv-delayed", subVTarget, offset, "SubV resolve depois de acorde intermediário");
    }
  }

  if (nextChord && nextRoot && samePitch(nextRoot, tension.root) && releasesDominantColor(chord, nextChord)) {
    return resolved(chord, "same-root-color-release", dominantTarget || tension.root, 1, "alivia a tensão mantendo a mesma raiz");
  }

  const reentryOffset = findSameRootDominantReentry(chords, index, tension.root, lookahead + 2);
  if (reentryOffset) {
    return resolved(chord, "dominant-reentry", dominantTarget || tension.root, reentryOffset, "retoma a dominante da mesma raiz");
  }

  return {
    chord,
    kind: "unresolved",
    targetRoot: dominantTarget,
    resolvedAtOffset: null,
    evidence: ["sem alvo local na janela analisada"]
  };
}

export function isDominantResolutionSupported(kind: DominantResolutionKind): boolean {
  return [
    "immediate",
    "subv-immediate",
    "delayed",
    "subv-delayed",
    "prolonged",
    "same-root-color-release",
    "dominant-reentry",
    "terminal-dominant",
    "deceptive"
  ].includes(kind);
}

function resolved(
  chord: string,
  kind: DominantResolutionKind,
  targetRoot: string,
  resolvedAtOffset: number,
  evidence: string
): DominantResolutionAnalysis {
  return {
    chord,
    kind,
    targetRoot,
    resolvedAtOffset,
    evidence: [evidence]
  };
}

function normalizedRoot(chord: string | undefined): string | null {
  if (!chord) return null;
  const root = chordRoot(chord);
  return root ? Note.pitchClass(root) || root : null;
}

function transposePitch(root: string, interval: string): string | null {
  return Note.pitchClass(Note.transpose(`${root}4`, interval)) || null;
}

function samePitch(a: string, b: string): boolean {
  const aChroma = Note.chroma(a);
  const bChroma = Note.chroma(b);
  return aChroma !== undefined && bChroma !== undefined && aChroma === bChroma;
}

function isDeceptiveRoot(root: string, targetRoot: string): boolean {
  const rootChroma = Note.chroma(root);
  const targetChroma = Note.chroma(targetRoot);
  if (rootChroma === undefined || targetChroma === undefined) return false;
  const distanceFromTarget = (rootChroma - targetChroma + 12) % 12;
  return [3, 4, 8, 9].includes(distanceFromTarget);
}

function hasSameDominantTarget(chord: string, targetRoot: string): boolean {
  const analysis = analyzeDominantTension(chord);
  if (!analysis.isDominant || !analysis.root) return false;
  const nextTarget = transposePitch(analysis.root, "4P");
  if (nextTarget && samePitch(nextTarget, targetRoot)) return true;

  const root = normalizedRoot(chord);
  const quality = resolveChordSymbol(chord).quality;
  return !!root && samePitch(root, targetRoot) && /sus/.test(quality);
}

function releasesDominantColor(chord: string, nextChord: string): boolean {
  const current = analyzeDominantTension(chord);
  const next = analyzeDominantTension(nextChord);
  if (next.isDominant) return next.score < current.score || next.level === "color";
  return true;
}

function findSameRootDominantReentry(
  chords: string[],
  index: number,
  root: string,
  maxOffset: number
): number | null {
  for (let offset = 2; offset <= maxOffset; offset++) {
    const candidate = chords[index + offset];
    if (!candidate) continue;
    const candidateRoot = normalizedRoot(candidate);
    if (!candidateRoot || !samePitch(candidateRoot, root)) continue;
    const analysis = analyzeDominantTension(candidate);
    if (analysis.isDominant) return offset;
  }
  return null;
}
