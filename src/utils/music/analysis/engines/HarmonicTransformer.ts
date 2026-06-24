import { transpose, Chord } from "tonal";
import type { OntologyRegion } from "../regions/OntologyRegion";
import type { FunctionalChord } from "../models/FunctionalAnalysis";
import type { MutationIntent, SuggestedChord, SelectionScope } from "../models/SuggestedRoute";
import type { ParsedScore } from "../models/ParsedScore";

export class HarmonicTransformer {
  /**
   * Applies a mutation intent to a set of chords, guided by the scope.
   */
  public static applyIntent(
    intent: MutationIntent,
    _scope: SelectionScope,
    region: OntologyRegion,
    _activeNode: FunctionalChord | null,
    context: ParsedScore | null
  ): SuggestedChord[] {
    
    // F17: Regional Phrase-Level Reharmonization
    // We no longer iterate chord by chord (1-to-1). We treat the region as a single trajectory.
    const nodes = region.nodes;
    if (!nodes || nodes.length === 0) return [];

    // Identify the Resolution Anchor
    let anchorChordSymbol = "C";
    let anchorRoot = "C";
    
    // Look ahead to the first chord AFTER this region as the primary structural anchor
    let foundNext = false;
    
    if (context && context.chords) {
      // Find the first chord in the score that starts exactly at or after this region's end
      const nextChord = context.chords.find(c => (c.tickStart ?? 0) >= region.tickEnd);
      if (nextChord) {
        anchorChordSymbol = nextChord.symbol;
        const parsed = Chord.get(anchorChordSymbol);
        if (!parsed.empty) {
          anchorRoot = parsed.root || "C";
          foundNext = true;
        }
      }
    }
    
    // Fallback if no next chord exists: use the region's tonal center
    if (!foundNext) {
      anchorRoot = region.nodes[0]?.tonal?.tonalCenter?.root || "C";
      anchorChordSymbol = `${anchorRoot}maj7`; // default assumption
    }

    // Apply phrase-level trajectory generation based on the strategy
    switch (intent.strategy) {
      case 'SECONDARY_DOMINANT':
        return this.generateSecondaryDominantTrajectory(nodes, anchorRoot);
      case 'TRITONE_SUBSTITUTION':
        return this.generateTritoneTrajectory(nodes, anchorRoot);
      case 'BACKDOOR_CADENCE':
        return this.generateBackdoorTrajectory(nodes, anchorRoot);
      case 'MODAL_BORROWING':
        return this.generateModalBorrowingTrajectory(nodes, intent.intensity);
      case 'PASSING_DIMINISHED':
        return this.generatePassingDiminishedTrajectory(nodes, anchorRoot);
      case 'CHROMATIC_APPROACH':
        return this.generateChromaticApproachTrajectory(nodes, anchorRoot);
      default:
        return nodes.map(n => ({
          original: n.chordSymbol,
          suggested: n.chordSymbol,
          reason: `No trajectory defined for ${intent.strategy}`
        }));
    }
  }

  // --- Trajectory Generation Algorithms (F17) ---

  /**
   * Generates a structural backcycling of dominants (or ii-V) pointing to the anchor.
   */
  private static generateSecondaryDominantTrajectory(nodes: FunctionalChord[], anchorRoot: string): SuggestedChord[] {
    const result: SuggestedChord[] = [];
    const len = nodes.length;
    
    const v7Root = transpose(anchorRoot, "P5");
    const ii7Root = transpose(v7Root, "P5");

    if (len === 1) {
      // Expand 1 chord into 2
      result.push({ original: nodes[0].chordSymbol, suggested: `${ii7Root}m7`, reason: `ii7 of V7` });
      result.push({ original: "-", suggested: `${v7Root}7`, reason: `V7 of ${anchorRoot} (Anchor)` });
      return result;
    }
    
    // For 2+ chords: Keep beginning, replace the last chord with an expanded ii-V
    for (let i = 0; i < len - 1; i++) {
      result.push({
        original: nodes[i].chordSymbol,
        suggested: nodes[i].chordSymbol,
        reason: "Maintained progression start"
      });
    }
    result.push({ original: "-", suggested: `${ii7Root}m7`, reason: `ii7 of V7` });
    result.push({ original: nodes[len - 1].chordSymbol, suggested: `${v7Root}7`, reason: `V7 of ${anchorRoot}` });

    return result;
  }

  /**
   * Replaces the dominant resolution with a Tritone Substitution (subV7 -> Anchor)
   * Also expands it by adding the related ii7 of the subV7.
   */
  private static generateTritoneTrajectory(nodes: FunctionalChord[], anchorRoot: string): SuggestedChord[] {
    const result: SuggestedChord[] = [];
    const len = nodes.length;
    const subV7Root = transpose(anchorRoot, "m2");
    const ii7Root = transpose(subV7Root, "P5");

    if (len === 1) {
      result.push({ original: nodes[0].chordSymbol, suggested: `${ii7Root}m7`, reason: `Related ii7` });
      result.push({ original: "-", suggested: `${subV7Root}7`, reason: `subV7 of ${anchorRoot} (Tritone Sub)` });
      return result;
    }

    for (let i = 0; i < len - 1; i++) {
      result.push({ original: nodes[i].chordSymbol, suggested: nodes[i].chordSymbol, reason: "Maintained" });
    }
    result.push({ original: "-", suggested: `${ii7Root}m7`, reason: `Related ii7` });
    result.push({ original: nodes[len - 1].chordSymbol, suggested: `${subV7Root}7`, reason: `subV7 of ${anchorRoot} (Tritone Sub)` });

    return result;
  }

  /**
   * Generates a Backdoor Cadence (iv7 - bVII7) pointing to the anchor.
   */
  private static generateBackdoorTrajectory(nodes: FunctionalChord[], anchorRoot: string): SuggestedChord[] {
    const result: SuggestedChord[] = [];
    const len = nodes.length;

    const bVII = transpose(anchorRoot, "m7");
    const iv = transpose(anchorRoot, "P4");

    if (len === 1) {
      result.push({ original: nodes[0].chordSymbol, suggested: `${iv}m7`, reason: `iv7 (borrowed from minor)` });
      result.push({ original: "-", suggested: `${bVII}7`, reason: `Backdoor bVII7 to ${anchorRoot}` });
      return result;
    }

    for (let i = 0; i < len - 1; i++) {
      result.push({ original: nodes[i].chordSymbol, suggested: nodes[i].chordSymbol, reason: "Maintained" });
    }
    result.push({ original: "-", suggested: `${iv}m7`, reason: `iv7 (borrowed from minor)` });
    result.push({ original: nodes[len - 1].chordSymbol, suggested: `${bVII}7`, reason: `bVII7 (Backdoor)` });

    return result;
  }

  private static generateModalBorrowingTrajectory(nodes: FunctionalChord[], intensity: number): SuggestedChord[] {
    // Borrow from parallel minor (flatten 3, 6, 7 where appropriate)
    return nodes.map(node => {
      const parsed = Chord.get(node.chordSymbol);
      if (!parsed.empty && parsed.root && parsed.quality === 'Major') {
        const newQuality = intensity > 0.6 ? 'm7' : 'm';
        return { original: node.chordSymbol, suggested: `${parsed.root}${newQuality}`, reason: "Modal Borrowing (Parallel Minor)" };
      }
      return { original: node.chordSymbol, suggested: node.chordSymbol, reason: "Maintained" };
    });
  }

  private static generatePassingDiminishedTrajectory(nodes: FunctionalChord[], anchorRoot: string): SuggestedChord[] {
    const result: SuggestedChord[] = [];
    const len = nodes.length;

    if (len === 1) {
      // If there's only 1 chord, change it to a diminished chord leading to the anchor
      const dimRoot = transpose(anchorRoot, "-m2");
      result.push({ original: nodes[0].chordSymbol, suggested: `${dimRoot}dim7`, reason: `Passing diminished to ${anchorRoot}` });
      return result;
    }

    // Look at adjacent pairs inside the region to insert a passing diminished chord
    for (let i = 0; i < len; i++) {
      result.push({ original: nodes[i].chordSymbol, suggested: nodes[i].chordSymbol, reason: "Maintained" });
      
      // If there is a next chord, maybe we can convert a chord into 2 chords! 
      // But for now, we just change the chord itself to be a passing dim if it's the 2nd to last, 
      // OR we just keep 1-to-1 replacement for MVP of this specific algorithm.
      // Wait, let's actually change the LAST chord to be a passing diminished to the anchor.
    }
    
    // Modify the last chord to be a passing diminished to the anchor
    const dimRoot = transpose(anchorRoot, "-m2");
    result[len - 1] = {
      original: nodes[len - 1].chordSymbol,
      suggested: `${dimRoot}dim7`,
      reason: `Passing diminished to ${anchorRoot}`
    };

    return result;
  }

  private static generateChromaticApproachTrajectory(nodes: FunctionalChord[], anchorRoot: string): SuggestedChord[] {
    const result: SuggestedChord[] = [];
    const len = nodes.length;

    const approachRoot = transpose(anchorRoot, "m2"); // Half step above

    if (len === 1) {
      result.push({ original: nodes[0].chordSymbol, suggested: `${approachRoot}7`, reason: `Chromatic approach to ${anchorRoot}` });
      return result;
    }

    for (let i = 0; i < len - 1; i++) {
      result.push({ original: nodes[i].chordSymbol, suggested: nodes[i].chordSymbol, reason: "Maintained" });
    }
    
    result.push({ original: nodes[len - 1].chordSymbol, suggested: `${approachRoot}7`, reason: `Chromatic approach from above` });
    return result;
  }
}
