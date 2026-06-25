import type { MelodicAnchor } from "../models/ProjectionSet";
import type { PhraseContext } from "./PhraseAnalysisEngine";
import type { ReharmonizationProposal, ReharmonizationMeasure } from "../models/ReharmonizationProposal";
import { ChordRealizationEngine } from "./ChordRealizationEngine";
import { BassTrajectoryModel } from "./archetypes/BassTrajectoryModel";
import { TemporalSlotAllocator } from "./TemporalSlotAllocator";
import { HarmonicRegionResolver } from "./HarmonicRegionResolver";
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
          // 4. Initialize the Musical Narrative State
          const initialState = {
            tonalAnchor: phraseContext.selectedCenter,
            phase: "EXPOSITION" as const,
            goal: seed.narrativeGoal,
            tension: 0.0,
            memory: []
          };

          // 4.1 F23.0 Tonal Gravity Map
          const gravityMap = {
            tonic: phraseContext.selectedCenter.tonic,
            gravityStrength: { "I": 1.0, "IV": 0.7, "V": 0.8 },
            inertia: 0.8 // high inertia = slower harmonic rhythm
          };

          // 4.2 F23.3 Harmonic Region Resolver
          const form = HarmonicRegionResolver.resolve(anchors, seed, gravityMap, initialState);

          // 3. Allocate Temporal Slots based on the Resolved Form
          const slots = TemporalSlotAllocator.allocateSlots(form, anchors);

          // 3.1 Realize Bass for the resolved regions
          const bassLine = BassTrajectoryModel.realizeBassForSlots(slots, phraseContext.selectedCenter);
          for (let i = 0; i < slots.length; i++) {
            slots[i].bassNote = bassLine[i];
          }

          // 5. Dual-Force Fusion Loop (Realization)
          const pathways = ChordRealizationEngine.realize(slots, phraseContext, seed, initialState);

          if (pathways.length > 0) {
            // Take the best pathway for this realization
            const bestPath = pathways[0];

            // Map to Measures
            const measuresMap = new Map<number, string[]>();
            for (let i = 0; i < slots.length; i++) {
              const mIdx = slots[i].measureIndex;
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

    return allProposals;
  }
}
