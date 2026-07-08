import { Note } from "tonal";
import type { ScoreHarmonyEvent } from "../models/ScoreSnapshot";
import type { ReharmonizationProposal } from "../models/ReharmonizationProposal";
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
  | "root-drift";

export interface ReferenceHarmonyComparisonPoint {
  measureIndex: number;
  proposalChord: string;
  referenceChord: string;
  proposalFunction: StrategyFunctionId;
  referenceFunction: StrategyFunctionId;
  rootRelation: "same-root" | "different-root";
  functionRelation: "same-function" | "different-function";
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

function proposalChordsByMeasure(proposal: ReharmonizationProposal): Map<number, string> {
  return new Map(proposal.measures.map(measure => [measure.measureIndex, measure.chords[0]]));
}

function referenceChordsByMeasure(harmonies: ScoreHarmonyEvent[]): Map<number, string> {
  const ordered = [...harmonies].sort((a, b) => a.measure - b.measure || a.tickStart - b.tickStart);
  const byMeasure = new Map<number, string>();
  for (const harmony of ordered) {
    if (!byMeasure.has(harmony.measure)) byMeasure.set(harmony.measure, harmony.harmony);
  }
  return byMeasure;
}

function normalizedRoot(chord: string): string {
  return Note.pitchClass(normalizeChordRoot(chord)) || normalizeChordRoot(chord);
}

function sameRoot(a: string, b: string): boolean {
  return normalizedRoot(a) === normalizedRoot(b);
}

function classificationModeForReference(
  referenceBoundary: ReturnType<typeof analyzeReferenceHarmony>["minorModalBoundary"]
): FunctionalClassificationMode {
  return referenceBoundary?.boundary === "minor-functional-cadential" ? "minor-functional" : "major-functional";
}

function statusFor(functionAgreement: number, comparedMeasures: number): ReferenceComparisonStatus {
  if (comparedMeasures === 0) return "no-reference";
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

  if (sameFunctionDifferentRootCount > 0) causes.add("function-preserved-root-changed");
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
}): string[] {
  if (input.status === "no-reference") {
    return ["Sem cifras de referência suficientes para comparação direta."];
  }

  const evidence = [
    `${input.matchingFunctionCount}/${input.comparedMeasures} compassos preservam a função aparente da referência.`,
    `${input.matchingRootCount}/${input.comparedMeasures} compassos mantêm a mesma raiz da referência.`
  ];

  if (input.status === "aligned") {
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
  const overlappingReferenceHarmonies = referenceHarmonies.filter(harmony => (
    proposalByMeasure.has(harmony.measure)
    && referenceByMeasure.get(harmony.measure) === harmony.harmony
  ));
  const referenceAnalysis = analyzeReferenceHarmony(referenceHarmonies);
  const localReferenceAnalysis = overlappingReferenceHarmonies.length > 0
    ? analyzeReferenceHarmony(overlappingReferenceHarmonies)
    : referenceAnalysis;
  const referenceCenter = localReferenceAnalysis.referenceCenter?.tonic
    || referenceAnalysis.referenceCenter?.tonic
    || center;
  const mode = classificationModeForReference(
    localReferenceAnalysis.minorModalBoundary || referenceAnalysis.minorModalBoundary
  );
  const points: ReferenceHarmonyComparisonPoint[] = [];

  for (const [measureIndex, proposalChord] of proposalByMeasure.entries()) {
    const referenceChord = referenceByMeasure.get(measureIndex);
    if (!referenceChord) continue;

    const proposalFunction = classifyFunctionInMode(proposalChord, center, mode);
    const referenceFunction = classifyFunctionInMode(referenceChord, referenceCenter, mode);
    const rootRelation = sameRoot(proposalChord, referenceChord) ? "same-root" : "different-root";
    const functionRelation = proposalFunction === referenceFunction ? "same-function" : "different-function";
    points.push({
      measureIndex,
      proposalChord,
      referenceChord,
      proposalFunction,
      referenceFunction,
      rootRelation,
      functionRelation
    });
  }

  const comparedMeasures = points.length;
  const matchingFunctionCount = points.filter(point => point.functionRelation === "same-function").length;
  const matchingRootCount = points.filter(point => point.rootRelation === "same-root").length;
  const functionAgreement = ratio(matchingFunctionCount, comparedMeasures);
  const rootAgreement = ratio(matchingRootCount, comparedMeasures);
  const status = statusFor(functionAgreement, comparedMeasures);
  const referenceIdiom = localReferenceAnalysis.idiom?.idiom || referenceAnalysis.idiom?.idiom;
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
      )
    }),
    points
  };
}
