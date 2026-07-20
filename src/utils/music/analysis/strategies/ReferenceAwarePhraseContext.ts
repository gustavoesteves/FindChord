import type {
  CadenceType,
  CadentialTarget,
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

function matchingCandidate(
  candidates: TonalCenterCandidate[],
  tonic: string,
  mode: TonalCenterCandidate["mode"]
): TonalCenterCandidate | undefined {
  return candidates.find(candidate => candidate.tonic === tonic && candidate.mode === mode);
}

function hasExplicitReferenceCadence(evidence: string[]): boolean {
  return evidence.some(item =>
    /^iiø-V-i local aponta /.test(item)
    || /^ii-V-I local aponta /.test(item)
    || /^V-I local aponta /.test(item)
    || /^V-i local aponta /.test(item)
    || /^meia cadência em /.test(item)
    || /^(?:IV|iv)-I plagal aponta /.test(item)
  );
}

function cadenceTypeFromReferenceEvidence(evidence: string[]): CadenceType {
  if (evidence.some(item => /^meia cadência em /.test(item))) return "HALF";
  if (evidence.some(item => /^(?:IV|iv)-I plagal aponta /.test(item))) return "PLAGAL";
  return hasExplicitReferenceCadence(evidence) ? "AUTHENTIC" : "OPEN";
}

function referenceCadentialTarget(
  referenceCenter: { tonic: string; confidence: "weak" | "medium" | "strong"; evidence: string[] },
  melodyCadentialTarget: CadentialTarget
): CadentialTarget {
  if (!hasExplicitReferenceCadence(referenceCenter.evidence)) {
    return melodyCadentialTarget;
  }

  const cadenceType = cadenceTypeFromReferenceEvidence(referenceCenter.evidence);
  const referenceConfidence = referenceConfidenceValue(referenceCenter.confidence);
  const confidence = cadenceType === "AUTHENTIC"
    ? Math.max(referenceConfidence, 0.75)
    : Math.min(Math.max(referenceConfidence, melodyCadentialTarget.confidence), 0.8);

  return {
    targetPitch: referenceCenter.tonic,
    cadenceType,
    confidence
  };
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

  const halfCadence = evidence.match(/^meia cadência em (.+) (maior|menor)$/);
  if (halfCadence) return `meia cadência confirma chegada dominante em ${halfCadence[1]} ${halfCadence[2]}`;

  const plagalCadence = evidence.match(/^(IV|iv)-I plagal aponta (.+) (maior|menor)$/);
  if (plagalCadence) return `cadência plagal ${plagalCadence[1]}-I confirma ${plagalCadence[2]} ${plagalCadence[3]}`;

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
  if (!referenceCenter) return phraseContext;

  const melodyCandidate = matchingCandidate(
    phraseContext.tonalCenterCandidates,
    referenceCenter.tonic,
    referenceCenter.mode
  );
  const weakReferenceConfirmedByMelody = referenceCenter.confidence === "weak"
    && melodyCandidate
    && melodyCandidate.confidence >= 0.8;
  if (referenceCenter.confidence === "weak" && !weakReferenceConfirmedByMelody) return phraseContext;

  const referenceCandidate: TonalCenterCandidate = {
    tonic: referenceCenter.tonic,
    mode: referenceCenter.mode,
    confidence: Math.max(
      referenceConfidenceValue(referenceCenter.confidence),
      melodyCandidate?.confidence ?? 0
    )
  };

  return {
    ...phraseContext,
    selectedCenter: referenceCandidate,
    selectedCenterSource: "reference",
    selectedCenterEvidence: referenceCenter.evidence.map(formatReferenceCenterEvidence),
    cadentialTarget: referenceCadentialTarget(referenceCenter, phraseContext.cadentialTarget),
    tonalCenterCandidates: mergeCandidate(phraseContext.tonalCenterCandidates, referenceCandidate)
  };
}
