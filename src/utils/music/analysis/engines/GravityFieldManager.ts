import type { MelodicAnchor } from "../models/ProjectionSet";
import type { PhraseContext } from "./PhraseAnalysisEngine";
import type { ReharmonizationProposal, ReharmonizationMeasure } from "../models/ReharmonizationProposal";
import { ChordRealizationEngine } from "./ChordRealizationEngine";
import { BassTrajectoryModel } from "./archetypes/BassTrajectoryModel";
import { TemporalSlotAllocator } from "./TemporalSlotAllocator";
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
      
      // 1. Generate Archetype Seeds
      const seeds = field.generateArchetypeSeeds(phraseContext);

      for (const seed of seeds) {
        // 2. Realize the Abstract Trajectory into concrete Bass Lines
        const bassLines = BassTrajectoryModel.realizeSeed(seed, anchors);

        for (const bassLine of bassLines) {
          // 3. Allocate Temporal Slots using Harmonic Anchor Weighting
          const slots = TemporalSlotAllocator.allocateSlots(bassLine, anchors, seed);

          // 4. Realize the Chords that satisfy the Bass Line AND validate against Melody
          const pathways = ChordRealizationEngine.realize(slots, phraseContext, seed.requireTonalStability);

          if (pathways.length > 0) {
            // Take the best pathway for this realization
            const bestPath = pathways[0];

            // Map to Measures
            const measuresMap = new Map<number, string[]>();
            for (let i = 0; i < anchors.length; i++) {
              const mIdx = anchors[i].measureIndex;
              if (!measuresMap.has(mIdx)) {
                measuresMap.set(mIdx, []);
              }
              measuresMap.get(mIdx)!.push(bestPath.harmonyEvents[i].chord);
            }

            const measures: ReharmonizationMeasure[] = Array.from(measuresMap.entries())
              .sort((a, b) => a[0] - b[0])
              .map(([measureIndex, chords]) => ({ measureIndex, chords }));

            allProposals.push({
              id: `prop_${pIdx}`,
              name: `Ideia — ${field.name}`,
              measures,
              explanation: seed.explanation, 
              bassLine: bestPath.bassLine,
              detectedMotives: [], // We can pull this from the seed type
              phraseContext: phraseContext
            });

            pIdx++;
          }
        }
      }
    }

    return allProposals;
  }
}
