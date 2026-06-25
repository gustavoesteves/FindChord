import type { MelodicAnchor } from "../models/ProjectionSet";
import type { PhraseContext } from "./PhraseAnalysisEngine";
import type { ReharmonizationProposal, ReharmonizationMeasure } from "./ReharmonizationProposalEngine";
import { HorizontalHarmonyEngine, type HarmonicPathway } from "./HorizontalHarmonyEngine";
import { HarmonicDivergenceEngine } from "./HarmonicDivergenceEngine";
import type { GravityField } from "./fields/GravityField";
import { TonalGravityField } from "./fields/TonalGravityField";
import { ChromaticGravityField } from "./fields/ChromaticGravityField";
import { ContrapuntalGravityField } from "./fields/ContrapuntalGravityField";

export class GravityFieldManager {
  private static fields: GravityField[] = [
    new TonalGravityField(),
    new ChromaticGravityField(),
    new ContrapuntalGravityField()
  ];

  public static generateProposals(
    anchors: MelodicAnchor[], 
    phraseContext: PhraseContext
  ): ReharmonizationProposal[] {
    
    let allProposals: ReharmonizationProposal[] = [];
    let pIdx = 1;

    for (const field of this.fields) {
      // 1. Run the Multi-Beam search constrained by the GravityField
      const pathways = HorizontalHarmonyEngine.generatePathways(anchors, phraseContext, field);
      
      if (pathways.length === 0) continue;

      // Wrap pathways into "SoftWorld" structure so we can reuse Divergence logic
      // (This will be refactored eventually, but works perfectly for now)
      const worlds = pathways.map((p: HarmonicPathway, i: number) => ({
        id: `${field.id}_world_${i}`,
        structuralProfile: { diatonicStability: 0, dominantDensity: 0, modalAmbiguity: 0, chromaticDisruption: 0 },
        coherenceScore: p.metrics.totalScore,
        events: p.harmonyEvents.map((he: any, i: number) => ({
          measureIndex: anchors[i].measureIndex,
          anchorPitch: he.melody,
          interpretation: he.interpretation,
          resolvedChord: he.chord
        })),
        bassLine: p.bassLine,
        metrics: p.metrics,
        detectedMotives: p.detectedMotives,
        phraseContext: phraseContext
      }));

      // 2. Extract divergent ideas localized to THIS FIELD
      const divergentIdeas = HarmonicDivergenceEngine.extractDivergentIdeas(worlds);

      // We only take the top 1 or 2 ideas per field so we don't flood the UI
      const topIdeas = divergentIdeas.slice(0, 1); // Starting conservative with 1 idea per field

      // 3. Package them into Proposals
      for (const idea of topIdeas) {
        const world = idea.primaryWorld;

        const measuresMap = new Map<number, string[]>();
        for (const event of world.events) {
          if (!measuresMap.has(event.measureIndex)) {
            measuresMap.set(event.measureIndex, []);
          }
          measuresMap.get(event.measureIndex)!.push(event.resolvedChord);
        }

        const measures: ReharmonizationMeasure[] = Array.from(measuresMap.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([measureIndex, chords]) => ({ measureIndex, chords }));

        allProposals.push({
          id: `prop_${pIdx}`,
          name: `Ideia ${pIdx} — ${field.name}`,
          measures,
          explanation: idea.archetype, 
          bassLine: idea.bassLine || [],
          detectedMotives: idea.detectedMotives || [],
          phraseContext: idea.phraseContext
        });

        pIdx++;
      }
    }

    return allProposals;
  }
}
