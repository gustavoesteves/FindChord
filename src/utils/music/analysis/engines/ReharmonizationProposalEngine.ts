import type { DivergentIdea } from "./HarmonicDivergenceEngine";
import type { MotiveTag } from "./HorizontalHarmonyEngine";
import type { PhraseContext } from "./PhraseAnalysisEngine";

export interface ReharmonizationMeasure {
  measureIndex: number;
  chords: string[];
}

export interface ReharmonizationProposal {
  id: string;
  name: string;
  measures: ReharmonizationMeasure[];
  explanation: string;
  bassLine: string[];
  detectedMotives: MotiveTag[];
  phraseContext: PhraseContext;
}

export class ReharmonizationProposalEngine {
  
  public static extractProposals(ideas: DivergentIdea[]): ReharmonizationProposal[] {
    const proposals: ReharmonizationProposal[] = [];
    let pIdx = 1;

    for (const idea of ideas) {
      const world = idea.primaryWorld;

      // Group chords by measure
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

      proposals.push({
        id: `prop_${pIdx}`,
        name: `IDEIA ${pIdx}: ${idea.archetype}`,
        measures,
        explanation: idea.signature,
        bassLine: idea.bassLine || [],
        detectedMotives: idea.detectedMotives || [],
        phraseContext: idea.phraseContext
      });

      pIdx++;
    }

    return proposals;
  }
}
