import { Note } from "tonal";
import type { MelodicAnchor } from "../models/ProjectionSet";
import type { StrategyFunctionId } from "./HarmonicStrategyValidator";

export type FunctionalRegionRole =
  | "ESTABLISHMENT"
  | "SUBDOMINANT_RESPONSE"
  | "DOMINANT_PREPARATION"
  | "CADENTIAL_RESOLUTION";

export type FunctionalCadenceKind =
  | "AUTHENTIC"
  | "HALF"
  | "PLAGAL"
  | "OPEN";

export interface MeasureFunctionalRegion {
  measureIndex: number;
  absoluteIndex: number;
  phraseIndex: number;
  localIndex: number;
  localTotal: number;
  functionId: StrategyFunctionId;
  role: FunctionalRegionRole;
  isPhraseFinal: boolean;
  isCadentialPreparation: boolean;
  confidence: number;
  evidence: string[];
  cadenceKind?: FunctionalCadenceKind;
  cadentialTarget?: string;
}

export class FunctionalRegionPlanner {
  public static planFromAnchors(anchors: MelodicAnchor[], center?: string): MeasureFunctionalRegion[] {
    const measureIndexes = Array.from(new Set(anchors.map(anchor => anchor.measureIndex))).sort((a, b) => a - b);
    const regions = this.planFromMeasureIndexes(measureIndexes);
    if (!center) return regions;

    return regions.map(region => this.refineRegionWithMelody(region, anchors, center));
  }

  public static planFromMeasureIndexes(measureIndexes: number[]): MeasureFunctionalRegion[] {
    const total = measureIndexes.length;
    if (total === 0) return [];

    return measureIndexes.map((measureIndex, absoluteIndex) => {
      const phraseStart = total > 4 ? Math.floor(absoluteIndex / 4) * 4 : 0;
      const phraseEnd = total > 4 ? Math.min(phraseStart + 4, total) : total;
      const localIndex = absoluteIndex - phraseStart;
      const localTotal = phraseEnd - phraseStart;
      const isPhraseFinal = localIndex === localTotal - 1;
      const isCadentialPreparation = localTotal > 1 && localIndex === localTotal - 2;
      const functionId = this.functionForPosition(localIndex, localTotal);

      return {
        measureIndex,
        absoluteIndex,
        phraseIndex: Math.floor(phraseStart / 4),
        localIndex,
        localTotal,
        functionId,
        role: this.roleForPosition(localIndex, localTotal),
        isPhraseFinal,
        isCadentialPreparation,
        confidence: 0.55,
        evidence: [this.baseEvidenceForPosition(localIndex, localTotal)],
        cadenceKind: isPhraseFinal ? "OPEN" : undefined
      };
    });
  }

  private static functionForPosition(localIndex: number, localTotal: number): StrategyFunctionId {
    if (localIndex === 0 || localIndex === localTotal - 1) return "T";
    if (localIndex === localTotal - 2) return "D";
    return "PD";
  }

  private static roleForPosition(localIndex: number, localTotal: number): FunctionalRegionRole {
    if (localTotal <= 1) return "CADENTIAL_RESOLUTION";
    if (localIndex === 0) return "ESTABLISHMENT";
    if (localIndex === localTotal - 1) return "CADENTIAL_RESOLUTION";
    if (localIndex === localTotal - 2) return "DOMINANT_PREPARATION";
    return "SUBDOMINANT_RESPONSE";
  }

  private static baseEvidenceForPosition(localIndex: number, localTotal: number): string {
    if (localTotal <= 1 || localIndex === localTotal - 1) return "posição de fechamento da subfrase";
    if (localIndex === 0) return "posição inicial de estabelecimento";
    if (localIndex === localTotal - 2) return "posição de preparação cadencial";
    return "posição interna de abertura subdominante";
  }

  private static refineRegionWithMelody(
    region: MeasureFunctionalRegion,
    anchors: MelodicAnchor[],
    center: string
  ): MeasureFunctionalRegion {
    const measureAnchors = anchors.filter(anchor => anchor.measureIndex === region.measureIndex);
    if (measureAnchors.length === 0) return region;

    const tonic = Note.pitchClass(center);
    const subdominant = Note.pitchClass(Note.transpose(`${center}4`, "4P"));
    const dominant = Note.pitchClass(Note.transpose(`${center}4`, "5P"));
    const evidence = [...region.evidence];
    let functionId = region.functionId;
    let role = region.role;
    let confidence = region.confidence;
    let cadenceKind = region.cadenceKind;
    let cadentialTarget = region.cadentialTarget;

    if (tonic && this.hasProminentPitch(measureAnchors, tonic)) {
      confidence = Math.max(confidence, region.isPhraseFinal ? 0.86 : 0.72);
      evidence.push(region.isPhraseFinal
        ? "a melodia repousa no centro tonal no fechamento"
        : "a melodia reforça o centro tonal");
    }

    if (subdominant && this.hasProminentPitch(measureAnchors, subdominant) && !region.isCadentialPreparation) {
      functionId = "PD";
      role = "SUBDOMINANT_RESPONSE";
      confidence = Math.max(confidence, 0.78);
      evidence.push("a melodia sustenta o quarto grau como abertura subdominante");
    }

    if (dominant && this.hasProminentPitch(measureAnchors, dominant) && region.isCadentialPreparation) {
      functionId = "D";
      role = "DOMINANT_PREPARATION";
      confidence = Math.max(confidence, 0.8);
      evidence.push("a melodia sustenta o quinto grau como preparação dominante");
    }

    if (region.isPhraseFinal) {
      const cadence = this.inferCadenceKind(region, anchors, center);
      cadenceKind = cadence.kind;
      cadentialTarget = cadence.target;
      confidence = Math.max(confidence, cadence.confidence);
      evidence.push(cadence.evidence);
    }

    return {
      ...region,
      functionId,
      role,
      confidence,
      evidence: Array.from(new Set(evidence)),
      cadenceKind,
      cadentialTarget
    };
  }

  private static inferCadenceKind(
    region: MeasureFunctionalRegion,
    anchors: MelodicAnchor[],
    center: string
  ): {
    kind: FunctionalCadenceKind;
    target: string;
    confidence: number;
    evidence: string;
  } {
    const measureAnchors = anchors.filter(anchor => anchor.measureIndex === region.measureIndex);
    const previousAnchors = anchors.filter(anchor => anchor.measureIndex === region.measureIndex - 1);
    const tonic = Note.pitchClass(center) || center;
    const subdominant = Note.pitchClass(Note.transpose(`${center}4`, "4P"));
    const dominant = Note.pitchClass(Note.transpose(`${center}4`, "5P"));

    if (dominant && this.hasProminentPitch(measureAnchors, dominant)) {
      return {
        kind: "HALF",
        target: dominant,
        confidence: 0.78,
        evidence: "a subfrase termina suspensa no quinto grau"
      };
    }

    if (this.hasProminentPitch(measureAnchors, tonic)) {
      if (dominant && this.hasProminentPitch(previousAnchors, dominant)) {
        return {
          kind: "AUTHENTIC",
          target: tonic,
          confidence: 0.9,
          evidence: "a subfrase fecha com preparação dominante e repouso no centro"
        };
      }

      if (subdominant && this.hasProminentPitch(previousAnchors, subdominant)) {
        return {
          kind: "PLAGAL",
          target: tonic,
          confidence: 0.84,
          evidence: "a subfrase fecha por gesto plagal em direção ao centro"
        };
      }

      return {
        kind: "AUTHENTIC",
        target: tonic,
        confidence: 0.76,
        evidence: "a subfrase fecha no centro tonal"
      };
    }

    return {
      kind: "OPEN",
      target: Note.pitchClass(measureAnchors[measureAnchors.length - 1]?.pitch || tonic) || tonic,
      confidence: 0.62,
      evidence: "a subfrase termina aberta, sem repouso tonal forte"
    };
  }

  private static hasProminentPitch(anchors: MelodicAnchor[], pitchClass: string): boolean {
    const totalDuration = anchors.reduce((sum, anchor) => sum + Math.max(1, anchor.duration || 1), 0);
    const pitchDuration = anchors.reduce((sum, anchor) => (
      Note.pitchClass(anchor.pitch) === pitchClass
        ? sum + Math.max(1, anchor.duration || 1)
        : sum
    ), 0);

    return pitchDuration / totalDuration >= 0.3;
  }
}
