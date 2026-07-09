import { Note } from "tonal";
import type {
  ReharmonizationBassLineProfile,
  ReharmonizationMeasure,
  ReharmonizationProposal
} from "../models/ReharmonizationProposal";
import { diagnostic, type HarmonicDiagnostic } from "../models/HarmonicDiagnostic";
import { chordRoot } from "../../theory/ChordSymbolResolver";

function chordSymbol(chord: string): string {
  return chord.replace(/\/[A-G](?:#|b)?$/, "");
}

function bassForChord(chord: string): string {
  const slashBass = chord.match(/\/([A-G](?:#|b)?)$/)?.[1];
  if (slashBass) return Note.pitchClass(slashBass) || slashBass;
  const symbol = chordSymbol(chord);
  return chordRoot(symbol) || symbol.match(/^[A-G](?:#|b)?/)?.[0] || symbol;
}

function bassLineFromMeasures(measures: ReharmonizationMeasure[]): string[] {
  return measures.flatMap(measure => measure.chords.map(bassForChord));
}

export type BassMotionKind =
  | "repeated"
  | "stepwise"
  | "chromatic"
  | "functional"
  | "leap";

interface BassMotion {
  from: string;
  to: string;
  semitones: number;
  kind: BassMotionKind;
}

export interface BassLineProfileReport {
  profile: ReharmonizationBassLineProfile;
  bassLine: string[];
  motions: BassMotion[];
  evidence: string[];
  diagnostic?: HarmonicDiagnostic;
}

function chromaticDistance(from: string, to: string): number | null {
  const fromChroma = Note.chroma(from);
  const toChroma = Note.chroma(to);
  if (fromChroma === undefined || toChroma === undefined) return null;

  const ascending = (toChroma - fromChroma + 12) % 12;
  const descending = (fromChroma - toChroma + 12) % 12;
  return Math.min(ascending, descending);
}

function motionKind(semitones: number): BassMotionKind {
  if (semitones === 0) return "repeated";
  if (semitones === 1) return "chromatic";
  if (semitones === 2) return "stepwise";
  if (semitones === 5 || semitones === 7) return "functional";
  return "leap";
}

function bassMotions(bassLine: string[]): BassMotion[] {
  return bassLine
    .slice(1)
    .map((to, index) => {
      const from = bassLine[index];
      const semitones = chromaticDistance(from, to);
      if (semitones === null) return null;
      return {
        from,
        to,
        semitones,
        kind: motionKind(semitones)
      };
    })
    .filter((motion): motion is BassMotion => motion !== null);
}

function countKind(motions: BassMotion[], kind: BassMotionKind): number {
  return motions.filter(motion => motion.kind === kind).length;
}

function dominantProfile(motions: BassMotion[]): ReharmonizationBassLineProfile {
  if (motions.length === 0) return "mixed";

  const repeated = countKind(motions, "repeated");
  const chromatic = countKind(motions, "chromatic");
  const stepwise = countKind(motions, "stepwise");
  const functional = countKind(motions, "functional");
  const leap = countKind(motions, "leap");

  if (leap > 0 && leap >= stepwise + chromatic + functional) return "leaping";
  if (repeated >= Math.ceil(motions.length * 0.6)) return "pedal";
  if (chromatic >= 2) return "chromatic";
  if (stepwise + chromatic >= Math.ceil(motions.length * 0.6)) return "stepwise";
  if (functional >= Math.ceil(motions.length * 0.5)) return "functional";
  return "mixed";
}

function evidenceForProfile(profile: ReharmonizationBassLineProfile): string[] {
  if (profile === "stepwise") return ["Linha de baixo: predomina movimento por grau conjunto"];
  if (profile === "chromatic") return ["Linha de baixo: usa aproximação cromática recorrente"];
  if (profile === "pedal") return ["Linha de baixo: preserva pedal ou repetição estrutural"];
  if (profile === "functional") return ["Linha de baixo: sustenta movimento funcional por quarta/quinta"];
  if (profile === "leaping") return ["Linha de baixo: saltos estruturais reduzem a continuidade"];
  return ["Linha de baixo: combina movimentos funcionais e locais"];
}

function diagnosticForProfile(
  proposal: ReharmonizationProposal,
  profile: ReharmonizationBassLineProfile
): HarmonicDiagnostic | undefined {
  if (profile === "leaping") {
    return diagnostic(
      `proposal-${proposal.id}-bass-line-leaping`,
      "generation",
      "compatibility",
      "Linha de baixo saltada: há saltos estruturais que reduzem a continuidade da progressão.",
      ["balanced", "exploratory"]
    );
  }

  if (profile === "stepwise" || profile === "chromatic") {
    return diagnostic(
      `proposal-${proposal.id}-bass-line-continuity`,
      "generation",
      "compatibility",
      profile === "chromatic"
        ? "Linha de baixo cromática: o baixo aproxima acordes por semitom com boa continuidade."
        : "Linha de baixo caminhante: o baixo conecta acordes por grau conjunto.",
      ["balanced", "exploratory"]
    );
  }

  if (profile === "pedal") {
    return diagnostic(
      `proposal-${proposal.id}-bass-line-pedal`,
      "generation",
      "compatibility",
      "Linha de baixo em pedal: a repetição sustenta a região harmônica.",
      ["exploratory"]
    );
  }

  return undefined;
}

function rankBonusForProfile(profile: ReharmonizationBassLineProfile): number {
  if (profile === "stepwise") return 0.12;
  if (profile === "chromatic") return 0.1;
  if (profile === "functional") return 0.04;
  if (profile === "pedal") return 0.02;
  if (profile === "leaping") return -0.12;
  return 0;
}

export function analyzeBassLineProfile(
  proposal: ReharmonizationProposal
): BassLineProfileReport {
  const bassLine = bassLineFromMeasures(proposal.measures);
  const motions = bassMotions(bassLine);
  const profile = dominantProfile(motions);

  return {
    profile,
    bassLine,
    motions,
    evidence: evidenceForProfile(profile),
    diagnostic: diagnosticForProfile(proposal, profile)
  };
}

export function annotateBassLineProfile(
  proposal: ReharmonizationProposal
): ReharmonizationProposal {
  const report = analyzeBassLineProfile(proposal);
  const diagnostics = report.diagnostic && !proposal.diagnostics?.some(item => item.id === report.diagnostic?.id)
    ? [...(proposal.diagnostics || []), report.diagnostic]
    : proposal.diagnostics;

  return {
    ...proposal,
    bassLine: report.bassLine,
    bassLineProfile: report.profile,
    bassLineEvidence: report.evidence,
    bassLineRankBonus: rankBonusForProfile(report.profile),
    diagnostics,
    explanation: report.evidence.length > 0
      ? [...proposal.explanation, ...report.evidence.filter(item => !proposal.explanation.includes(item))]
      : proposal.explanation
  };
}
