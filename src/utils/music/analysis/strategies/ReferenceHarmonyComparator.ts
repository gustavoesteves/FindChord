import { Note } from "tonal";
import type { ScoreHarmonyEvent } from "../models/ScoreSnapshot";
import type { ReharmonizationProposal } from "../models/ReharmonizationProposal";
import { analyzeApparentFunction, type ApparentFunctionAnalysis, type ApparentFunctionRole } from "./ApparentFunctionAnalysis";
import { analyzeReferenceHarmony } from "./ReferenceHarmonyAnalysis";
import {
  classifyFunctionInMode,
  normalizeChordRoot,
  type FunctionalClassificationMode,
  type StrategyFunctionId
} from "./HarmonicStrategyValidator";

export type ReferenceComparisonStatus =
  | "no-reference"
  | "aligned"
  | "partially-aligned"
  | "divergent";

export type ReferenceComparisonCause =
  | "function-preserved-root-changed"
  | "center-mismatch"
  | "local-center-mismatch"
  | "global-center-mismatch"
  | "local-center-aligned-global-mismatch"
  | "global-center-aligned-local-mismatch"
  | "reference-cadence-not-matched"
  | "reference-idiom-context"
  | "apparent-function-preserved"
  | "root-drift";

export interface ReferenceHarmonyComparisonPoint {
  measureIndex: number;
  proposalChord: string;
  referenceChord: string;
  proposalFunction: StrategyFunctionId;
  referenceFunction: StrategyFunctionId;
  rootRelation: "same-root" | "different-root";
  functionRelation: "same-function" | "different-function";
  proposalApparentRole?: ApparentFunctionRole;
  referenceApparentRole?: ApparentFunctionRole;
  proposalImpliedChordSymbols: string[];
  referenceImpliedChordSymbols: string[];
}

export interface ReferenceHarmonyComparison {
  status: ReferenceComparisonStatus;
  comparedMeasures: number;
  matchingFunctionCount: number;
  matchingRootCount: number;
  functionAgreement: number;
  rootAgreement: number;
  proposalCenter?: string;
  referenceCenter?: string;
  referenceCenterMode?: "major" | "minor";
  referenceCenterConfidence?: "weak" | "medium" | "strong";
  globalReferenceCenter?: string;
  globalReferenceCenterMode?: "major" | "minor";
  globalReferenceCenterConfidence?: "weak" | "medium" | "strong";
  localReferenceCenter?: string;
  localReferenceCenterMode?: "major" | "minor";
  localReferenceCenterConfidence?: "weak" | "medium" | "strong";
  referenceIdiom?: string;
  causes: ReferenceComparisonCause[];
  evidence: string[];
  points: ReferenceHarmonyComparisonPoint[];
}

interface OrderedComparisonChord {
  measureIndex: number;
  chordIndex: number;
  chord: string;
}

function proposalChordsByMeasure(proposal: ReharmonizationProposal): Map<number, string[]> {
  return new Map(proposal.measures.map(measure => [measure.measureIndex, measure.chords]));
}

function referenceChordsByMeasure(harmonies: ScoreHarmonyEvent[]): Map<number, string[]> {
  const ordered = [...harmonies].sort((a, b) => a.measure - b.measure || a.tickStart - b.tickStart);
  const byMeasure = new Map<number, string[]>();
  for (const harmony of ordered) {
    const chords = byMeasure.get(harmony.measure) || [];
    chords.push(harmony.harmony);
    byMeasure.set(harmony.measure, chords);
  }
  return byMeasure;
}

function normalizedRoot(chord: string): string {
  return Note.pitchClass(normalizeChordRoot(chord)) || normalizeChordRoot(chord);
}

function sameRoot(a: string, b: string): boolean {
  return normalizedRoot(a) === normalizedRoot(b);
}

function explicitBass(chord: string): string | undefined {
  const bass = chord.match(/\/([A-G](?:#|b)?)$/)?.[1];
  return bass ? Note.pitchClass(bass) || bass : undefined;
}

function sameRootOrBass(a: string, b: string): boolean {
  if (sameRoot(a, b)) return true;
  const aBass = explicitBass(a);
  const bBass = explicitBass(b);
  const aRoot = normalizedRoot(a);
  const bRoot = normalizedRoot(b);
  return aBass === bRoot || bBass === aRoot || (!!aBass && !!bBass && aBass === bBass);
}

function bassMatchesRoot(chord: string, referenceChord: string): boolean {
  return explicitBass(chord) === normalizedRoot(referenceChord);
}

function isConcreteFunction(fn: string): fn is StrategyFunctionId {
  return fn === "T" || fn === "PD" || fn === "D" || fn === "OTHER";
}

function comparisonFunction(
  chord: string,
  center: string,
  mode: FunctionalClassificationMode,
  context: { previousChord?: string; nextChord?: string },
  apparent: ApparentFunctionAnalysis | null = analyzeApparentFunction(chord, { center, ...context })
): StrategyFunctionId {
  const basicFunction = classifyFunctionInMode(chord, center, mode);

  if (
    apparent
    && !apparent.shouldCountAsFunctionalEscape
    && isConcreteFunction(apparent.apparentFunction)
    && apparent.apparentFunction !== "OTHER"
    && (
      basicFunction === "OTHER"
      || apparent.apparentType === "SUS"
      || apparent.apparentType === "DIMINISHED"
      || apparent.apparentType === "SHARP_IV_M7B5"
    )
  ) {
    return apparent.apparentFunction;
  }

  return basicFunction;
}

function comparisonFunctionWithReferenceBass(
  chord: string,
  referenceChord: string,
  center: string,
  mode: FunctionalClassificationMode,
  referenceFunction: StrategyFunctionId,
  context: { previousChord?: string; nextChord?: string },
  apparent: ApparentFunctionAnalysis | null
): StrategyFunctionId {
  const baseFunction = comparisonFunction(chord, center, mode, context, apparent);
  const bass = explicitBass(chord);
  if (baseFunction === referenceFunction || !bass || !bassMatchesRoot(chord, referenceChord)) {
    return baseFunction;
  }

  const bassFunction = classifyFunctionInMode(bass, center, mode);
  return bassFunction === referenceFunction ? bassFunction : baseFunction;
}

function orderedProposalChords(chordsByMeasure: Map<number, string[]>): OrderedComparisonChord[] {
  return [...chordsByMeasure.entries()]
    .sort((a, b) => a[0] - b[0])
    .flatMap(([measureIndex, chords]) => (
      chords.map((chord, chordIndex) => ({
        measureIndex,
        chordIndex,
        chord
      }))
    ));
}

function orderedReferenceChords(chordsByMeasure: Map<number, string[]>): OrderedComparisonChord[] {
  return [...chordsByMeasure.entries()]
    .sort((a, b) => a[0] - b[0])
    .flatMap(([measureIndex, chords]) => (
      chords.map((chord, chordIndex) => ({
        measureIndex,
        chordIndex,
        chord
      }))
    ));
}

function chordContext(
  chords: OrderedComparisonChord[],
  target: Pick<OrderedComparisonChord, "measureIndex" | "chordIndex">
): { previousChord?: string; nextChord?: string } {
  const index = chords.findIndex(chord => (
    chord.measureIndex === target.measureIndex
    && chord.chordIndex === target.chordIndex
  ));
  return {
    previousChord: index > 0 ? chords[index - 1].chord : undefined,
    nextChord: index >= 0 && index < chords.length - 1 ? chords[index + 1].chord : undefined
  };
}

function classificationModeForReference(
  referenceBoundary: ReturnType<typeof analyzeReferenceHarmony>["minorModalBoundary"]
): FunctionalClassificationMode {
  return referenceBoundary?.boundary === "minor-functional-cadential" ? "minor-functional" : "major-functional";
}

function statusFor(
  functionAgreement: number,
  comparedMeasures: number,
  rootAgreement = 0,
  referenceIdiom?: string
): ReferenceComparisonStatus {
  if (comparedMeasures === 0) return "no-reference";
  if (referenceIdiom && referenceIdiom !== "major-functional" && rootAgreement >= 0.75) return "aligned";
  if (functionAgreement >= 0.75) return "aligned";
  if (functionAgreement >= 0.4) return "partially-aligned";
  return "divergent";
}

function ratio(count: number, total: number): number {
  return total === 0 ? 0 : Number((count / total).toFixed(2));
}

function samePitchClass(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  return Note.pitchClass(a) === Note.pitchClass(b);
}

function comparisonPointScore(point: ReferenceHarmonyComparisonPoint): number {
  const rootScore = point.rootRelation === "same-root" ? 4 : 0;
  const functionScore = point.functionRelation === "same-function" ? 3 : 0;
  const apparentScore = point.proposalImpliedChordSymbols.length > 0 || point.referenceImpliedChordSymbols.length > 0 ? 1 : 0;
  return rootScore + functionScore + apparentScore;
}

function buildComparisonPoint(input: {
  measureIndex: number;
  proposalChord: string;
  referenceChord: string;
  proposalContext: { previousChord?: string; nextChord?: string };
  referenceContext: { previousChord?: string; nextChord?: string };
  center: string;
  referenceCenter: string;
  mode: FunctionalClassificationMode;
}): ReferenceHarmonyComparisonPoint {
  const proposalApparent = analyzeApparentFunction(input.proposalChord, {
    center: input.center,
    ...input.proposalContext
  });
  const referenceApparent = analyzeApparentFunction(input.referenceChord, {
    center: input.referenceCenter,
    ...input.referenceContext
  });

  const referenceFunction = comparisonFunction(
    input.referenceChord,
    input.referenceCenter,
    input.mode,
    input.referenceContext,
    referenceApparent
  );
  const proposalFunction = comparisonFunctionWithReferenceBass(
    input.proposalChord,
    input.referenceChord,
    input.center,
    input.mode,
    referenceFunction,
    input.proposalContext,
    proposalApparent
  );
  const rootRelation = sameRootOrBass(input.proposalChord, input.referenceChord) ? "same-root" : "different-root";
  const functionRelation = proposalFunction === referenceFunction ? "same-function" : "different-function";

  return {
    measureIndex: input.measureIndex,
    proposalChord: input.proposalChord,
    referenceChord: input.referenceChord,
    proposalFunction,
    referenceFunction,
    rootRelation,
    functionRelation,
    proposalApparentRole: proposalApparent?.shouldCountAsFunctionalEscape ? undefined : proposalApparent?.apparentRole,
    referenceApparentRole: referenceApparent?.shouldCountAsFunctionalEscape ? undefined : referenceApparent?.apparentRole,
    proposalImpliedChordSymbols: proposalApparent && !proposalApparent.shouldCountAsFunctionalEscape
      ? proposalApparent.impliedChordSymbols
      : [],
    referenceImpliedChordSymbols: referenceApparent && !referenceApparent.shouldCountAsFunctionalEscape
      ? referenceApparent.impliedChordSymbols
      : []
  };
}

function comparisonCauses(input: {
  status: ReferenceComparisonStatus;
  functionAgreement: number;
  rootAgreement: number;
  proposalCenter: string;
  referenceCenter?: string;
  localReferenceCenter?: string;
  globalReferenceCenter?: string;
  referenceIdiom?: string;
  localCadences: string[];
  points: ReferenceHarmonyComparisonPoint[];
}): ReferenceComparisonCause[] {
  if (input.status === "no-reference") return [];

  const causes = new Set<ReferenceComparisonCause>();
  const sameFunctionDifferentRootCount = input.points.filter(point => (
    point.functionRelation === "same-function"
    && point.rootRelation === "different-root"
  )).length;
  const apparentFunctionPreservedCount = input.points.filter(point => (
    point.functionRelation === "same-function"
    && (
      point.proposalImpliedChordSymbols.length > 0
      || point.referenceImpliedChordSymbols.length > 0
    )
  )).length;

  if (sameFunctionDifferentRootCount > 0) causes.add("function-preserved-root-changed");
  if (apparentFunctionPreservedCount > 0) causes.add("apparent-function-preserved");
  const matchesLocal = samePitchClass(input.proposalCenter, input.localReferenceCenter);
  const matchesGlobal = samePitchClass(input.proposalCenter, input.globalReferenceCenter);
  const hasLocal = !!input.localReferenceCenter;
  const hasGlobal = !!input.globalReferenceCenter;

  if (input.status !== "aligned") {
    if (hasLocal && !matchesLocal) causes.add("local-center-mismatch");
    if (hasGlobal && !matchesGlobal) causes.add("global-center-mismatch");
    if (!hasLocal && !hasGlobal && !samePitchClass(input.proposalCenter, input.referenceCenter)) causes.add("center-mismatch");
  }

  if (matchesLocal && hasGlobal && !matchesGlobal) causes.add("local-center-aligned-global-mismatch");
  if (matchesGlobal && hasLocal && !matchesLocal) causes.add("global-center-aligned-local-mismatch");
  if (input.localCadences.length > 0 && input.functionAgreement < 0.75) causes.add("reference-cadence-not-matched");
  if (input.referenceIdiom && input.referenceIdiom !== "major-functional" && input.status !== "aligned") causes.add("reference-idiom-context");
  if (input.rootAgreement < 0.4 && input.points.length > 0) causes.add("root-drift");

  return Array.from(causes);
}

function evidenceFor(input: {
  status: ReferenceComparisonStatus;
  comparedMeasures: number;
  matchingFunctionCount: number;
  matchingRootCount: number;
  causes: ReferenceComparisonCause[];
  referenceIdiom?: string;
  localCadences: string[];
  hasMinorFunctionalBoundary: boolean;
  points: ReferenceHarmonyComparisonPoint[];
}): string[] {
  if (input.status === "no-reference") {
    return ["Sem cifras de referência suficientes para comparação direta."];
  }

  const evidence = [
    `${input.matchingFunctionCount}/${input.comparedMeasures} compassos preservam a função aparente da referência.`,
    `${input.matchingRootCount}/${input.comparedMeasures} compassos mantêm a mesma raiz da referência.`
  ];

  if (input.status === "aligned" && input.referenceIdiom && input.referenceIdiom !== "major-functional") {
    evidence.push("A proposta converge com a harmonia de referência dentro do idioma indicado.");
  } else if (input.status === "aligned") {
    evidence.push("A proposta converge funcionalmente com a harmonia de referência.");
  } else if (input.status === "partially-aligned") {
    evidence.push("A proposta preserva parte da função, mas se afasta da referência em pontos importantes.");
  } else {
    evidence.push("A proposta diverge funcionalmente da harmonia de referência na maior parte da janela.");
  }

  if (input.referenceIdiom && input.referenceIdiom !== "major-functional") {
    evidence.push(`A referência sugere idioma ${input.referenceIdiom}; divergências devem ser escutadas nesse contexto.`);
  }

  if (input.localCadences.length > 0) {
    evidence.push(`A referência contém ${input.localCadences.slice(0, 2).join("; ")}.`);
  }

  if (input.hasMinorFunctionalBoundary) {
    evidence.push("A referência confirma menor funcional por cadência local.");
  }

  if (input.causes.includes("function-preserved-root-changed")) {
    evidence.push("Há troca de raiz preservando função aparente; pode ser substituição ou simplificação aceitável.");
  }

  if (input.causes.includes("apparent-function-preserved")) {
    const apparentDetails = input.points
      .filter(point => (
        point.functionRelation === "same-function"
        && (
          point.proposalImpliedChordSymbols.length > 0
          || point.referenceImpliedChordSymbols.length > 0
        )
      ))
      .slice(0, 2)
      .map(point => {
        const proposal = point.proposalImpliedChordSymbols.length > 0
          ? `${point.proposalChord} implica ${point.proposalImpliedChordSymbols.join(" ou ")}`
          : null;
        const reference = point.referenceImpliedChordSymbols.length > 0
          ? `${point.referenceChord} implica ${point.referenceImpliedChordSymbols.join(" ou ")}`
          : null;
        return [proposal, reference].filter(Boolean).join("; ");
      });
    evidence.push(`Função aparente reconhecida na comparação: ${apparentDetails.join("; ")}.`);
  }

  if (input.causes.includes("center-mismatch")) {
    evidence.push("O centro da proposta não coincide com o centro inferido da referência.");
  }

  if (input.causes.includes("local-center-mismatch")) {
    evidence.push("O centro da proposta não coincide com o centro local da janela de referência.");
  }

  if (input.causes.includes("global-center-mismatch")) {
    evidence.push("O centro da proposta não coincide com o centro global da referência.");
  }

  if (input.causes.includes("local-center-aligned-global-mismatch")) {
    evidence.push("A proposta acompanha o centro local da janela, embora se afaste do centro global da referência.");
  }

  if (input.causes.includes("global-center-aligned-local-mismatch")) {
    evidence.push("A proposta acompanha o centro global da referência, mas ignora o centro local da janela.");
  }

  if (input.causes.includes("reference-cadence-not-matched")) {
    evidence.push("A referência contém cadência local que a proposta não acompanhou funcionalmente.");
  }

  if (input.causes.includes("root-drift")) {
    evidence.push("A proposta troca a raiz da maioria dos acordes comparáveis.");
  }

  return evidence;
}

export function compareProposalToReferenceHarmony(
  proposal: ReharmonizationProposal | undefined,
  referenceHarmonies: ScoreHarmonyEvent[],
  center: string
): ReferenceHarmonyComparison {
  if (!proposal || referenceHarmonies.length === 0) {
    return {
      status: "no-reference",
      comparedMeasures: 0,
      matchingFunctionCount: 0,
      matchingRootCount: 0,
      functionAgreement: 0,
      rootAgreement: 0,
      causes: [],
      evidence: ["Sem cifras de referência suficientes para comparação direta."],
      points: []
    };
  }

  const proposalByMeasure = proposalChordsByMeasure(proposal);
  const referenceByMeasure = referenceChordsByMeasure(referenceHarmonies);
  const orderedProposal = orderedProposalChords(proposalByMeasure);
  const orderedReference = orderedReferenceChords(referenceByMeasure);
  const overlappingReferenceHarmonies = referenceHarmonies.filter(harmony => (
    proposalByMeasure.has(harmony.measure)
  ));
  const spanReferenceHarmonies = referenceHarmoniesInProposalSpan(referenceHarmonies, proposalByMeasure);
  const referenceAnalysis = analyzeReferenceHarmony(referenceHarmonies);
  const localReferenceAnalysis = spanReferenceHarmonies.length > 0
    ? analyzeReferenceHarmony(spanReferenceHarmonies)
    : overlappingReferenceHarmonies.length > 0
      ? analyzeReferenceHarmony(overlappingReferenceHarmonies)
      : referenceAnalysis;
  const referenceCenter = localReferenceAnalysis.referenceCenter?.tonic
    || referenceAnalysis.referenceCenter?.tonic
    || center;
  const mode = classificationModeForReference(
    localReferenceAnalysis.minorModalBoundary || referenceAnalysis.minorModalBoundary
  );
  const points: ReferenceHarmonyComparisonPoint[] = [];

  for (const [measureIndex, proposalChords] of proposalByMeasure.entries()) {
    const referenceChords = referenceByMeasure.get(measureIndex);
    if (!referenceChords || referenceChords.length === 0) continue;

    if (referenceChords.length === 1) {
      const referenceChord = referenceChords[0];
      const referenceContext = chordContext(orderedReference, { measureIndex, chordIndex: 0 });
      const candidatePoints = proposalChords.map((proposalChord, chordIndex) => (
        buildComparisonPoint({
          measureIndex,
          proposalChord,
          referenceChord,
          proposalContext: chordContext(orderedProposal, { measureIndex, chordIndex }),
          referenceContext,
          center,
          referenceCenter,
          mode
        })
      ));
      const bestPoint = candidatePoints.sort((a, b) => comparisonPointScore(b) - comparisonPointScore(a))[0];
      if (bestPoint) points.push(bestPoint);
      continue;
    }

    for (const [referenceChordIndex, referenceChord] of referenceChords.entries()) {
      const proposalChord = proposalChords[referenceChordIndex] || "N.C.";
      points.push(buildComparisonPoint({
        measureIndex,
        proposalChord,
        referenceChord,
        proposalContext: chordContext(orderedProposal, { measureIndex, chordIndex: referenceChordIndex }),
        referenceContext: chordContext(orderedReference, { measureIndex, chordIndex: referenceChordIndex }),
        center,
        referenceCenter,
        mode
      }));
    }
  }

  const comparedMeasures = points.length;
  const matchingFunctionCount = points.filter(point => point.functionRelation === "same-function").length;
  const matchingRootCount = points.filter(point => point.rootRelation === "same-root").length;
  const functionAgreement = ratio(matchingFunctionCount, comparedMeasures);
  const rootAgreement = ratio(matchingRootCount, comparedMeasures);
  const referenceIdiom = localReferenceAnalysis.idiom?.idiom || referenceAnalysis.idiom?.idiom;
  const status = statusFor(functionAgreement, comparedMeasures, rootAgreement, referenceIdiom);
  const causes = comparisonCauses({
    status,
    functionAgreement,
    rootAgreement,
    proposalCenter: center,
    referenceCenter,
    localReferenceCenter: localReferenceAnalysis.referenceCenter?.tonic,
    globalReferenceCenter: referenceAnalysis.referenceCenter?.tonic,
    referenceIdiom,
    localCadences: localReferenceAnalysis.localCadences,
    points
  });

  return {
    status,
    comparedMeasures,
    matchingFunctionCount,
    matchingRootCount,
    functionAgreement,
    rootAgreement,
    proposalCenter: center,
    referenceCenter,
    referenceCenterMode: localReferenceAnalysis.referenceCenter?.mode || referenceAnalysis.referenceCenter?.mode,
    referenceCenterConfidence: localReferenceAnalysis.referenceCenter?.confidence || referenceAnalysis.referenceCenter?.confidence,
    globalReferenceCenter: referenceAnalysis.referenceCenter?.tonic,
    globalReferenceCenterMode: referenceAnalysis.referenceCenter?.mode,
    globalReferenceCenterConfidence: referenceAnalysis.referenceCenter?.confidence,
    localReferenceCenter: localReferenceAnalysis.referenceCenter?.tonic,
    localReferenceCenterMode: localReferenceAnalysis.referenceCenter?.mode,
    localReferenceCenterConfidence: localReferenceAnalysis.referenceCenter?.confidence,
    referenceIdiom,
    causes,
    evidence: evidenceFor({
      status,
      comparedMeasures,
      matchingFunctionCount,
      matchingRootCount,
      causes,
      referenceIdiom,
      localCadences: localReferenceAnalysis.localCadences,
      hasMinorFunctionalBoundary: (
        localReferenceAnalysis.minorModalBoundary?.boundary === "minor-functional-cadential"
        || referenceAnalysis.minorModalBoundary?.boundary === "minor-functional-cadential"
      ),
      points
    }),
    points
  };
}

function referenceHarmoniesInProposalSpan(
  referenceHarmonies: ScoreHarmonyEvent[],
  proposalByMeasure: Map<number, string[]>
): ScoreHarmonyEvent[] {
  const proposalMeasures = Array.from(proposalByMeasure.keys());
  if (proposalMeasures.length === 0) return [];

  const firstMeasure = Math.min(...proposalMeasures);
  const lastMeasure = Math.max(...proposalMeasures);
  return referenceHarmonies.filter(harmony => harmony.measure >= firstMeasure && harmony.measure <= lastMeasure);
}
