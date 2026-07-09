import type {
  PhraseContext,
  TonalCenterCandidate
} from "../engines/PhraseAnalysisEngine";
import type { ScoreHarmonyEvent } from "../models/ScoreSnapshot";
import { analyzeReferenceHarmony } from "./ReferenceHarmonyAnalysis";

function referenceConfidenceValue(confidence: "weak" | "medium" | "strong"): number {
  if (confidence === "strong") return 0.88;
  if (confidence === "medium") return 0.76;
  return 0.52;
}

function sameCenter(a: TonalCenterCandidate, b: TonalCenterCandidate): boolean {
  return a.tonic === b.tonic && a.mode === b.mode;
}

function mergeCandidate(
  candidates: TonalCenterCandidate[],
  referenceCandidate: TonalCenterCandidate
): TonalCenterCandidate[] {
  const withoutDuplicate = candidates.filter(candidate => !sameCenter(candidate, referenceCandidate));
  return [referenceCandidate, ...withoutDuplicate]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 4);
}

export function formatReferenceCenterEvidence(evidence: string): string {
  const iiVMinor = evidence.match(/^iiø-V-i local aponta (.+) menor$/);
  if (iiVMinor) return `cadência iiø-V-i confirma ${iiVMinor[1]} menor`;

  const iiVMajor = evidence.match(/^ii-V-I local aponta (.+) maior$/);
  if (iiVMajor) return `cadência ii-V-I confirma ${iiVMajor[1]} maior`;

  const localDominantMajor = evidence.match(/^V-I local aponta (.+) maior$/);
  if (localDominantMajor) return `cadência V-I confirma ${localDominantMajor[1]} maior`;

  const localDominantMinor = evidence.match(/^V-i local aponta (.+) menor$/);
  if (localDominantMinor) return `cadência V-i confirma ${localDominantMinor[1]} menor`;

  const recurringMajor = evidence.match(/^repouso maior recorrente em (.+)$/);
  if (recurringMajor) return `repousos recorrentes sustentam ${recurringMajor[1]} maior`;

  const recurringMinor = evidence.match(/^repouso menor recorrente em (.+)$/);
  if (recurringMinor) return `repousos recorrentes sustentam ${recurringMinor[1]} menor`;

  const finalRest = evidence.match(/^acorde final sugere repouso em (.+)$/);
  if (finalRest) return `acorde final repousa em ${finalRest[1]}`;

  const openingMajor = evidence.match(/^primeiro acorde sugere (.+) maior$/);
  if (openingMajor) return `primeiro acorde apresenta ${openingMajor[1]} maior`;

  const openingMinor = evidence.match(/^primeiro acorde sugere (.+) menor$/);
  if (openingMinor) return `primeiro acorde apresenta ${openingMinor[1]} menor`;

  return evidence;
}

export function formatReferenceCenterEvidenceSentence(evidence: string): string {
  if (evidence.length === 0) return evidence;
  const capitalized = `${evidence[0].toUpperCase()}${evidence.slice(1)}`;
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

export function applyReferenceCenterToPhraseContext(
  phraseContext: PhraseContext,
  referenceHarmonies: ScoreHarmonyEvent[]
): PhraseContext {
  if (referenceHarmonies.length === 0) return phraseContext;

  const referenceAnalysis = analyzeReferenceHarmony(referenceHarmonies);
  const referenceCenter = referenceAnalysis.referenceCenter;
  if (!referenceCenter || referenceCenter.confidence === "weak") return phraseContext;

  const referenceCandidate: TonalCenterCandidate = {
    tonic: referenceCenter.tonic,
    mode: referenceCenter.mode,
    confidence: Math.max(
      referenceConfidenceValue(referenceCenter.confidence),
      phraseContext.selectedCenter.confidence
    )
  };

  return {
    ...phraseContext,
    selectedCenter: referenceCandidate,
    selectedCenterSource: "reference",
    selectedCenterEvidence: referenceCenter.evidence.map(formatReferenceCenterEvidence),
    tonalCenterCandidates: mergeCandidate(phraseContext.tonalCenterCandidates, referenceCandidate)
  };
}
