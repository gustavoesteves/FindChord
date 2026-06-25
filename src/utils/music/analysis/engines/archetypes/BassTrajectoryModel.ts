import { Note, transpose } from "tonal";
import type { MelodicAnchor } from "../../models/ProjectionSet";
import type { HarmonicSeed } from "../../models/HarmonicSeed";

export class BassTrajectoryModel {
  
  public static realizeSeed(seed: HarmonicSeed, anchors: MelodicAnchor[]): string[][] {
    const len = anchors.length;
    if (len === 0) return [];

    const targetPitchClass = seed.bassContour.target; // "G" or "Am" (if "Am", strip to "A")
    const targetPC = targetPitchClass.replace(/m|maj|dim|aug|7|9|11|13/g, "");

    switch (seed.type) {
      case "CHROMATIC_ASCENT_TO_TARGET":
        return this.generateChromaticAscent(targetPC, len);
      case "CHROMATIC_DESCENT_TO_TARGET":
        return this.generateChromaticDescent(targetPC, len);
      case "DIATONIC_CADENCE_MOTION":
        return this.generateCircleOf5ths(targetPC, len);
      case "CONTRARY_MOTION_OBLIQUE":
        return this.generateContraryMotion(targetPC, anchors);
      default:
        // Fallback: just return a pedal point
        return [Array(len).fill(targetPC)];
    }
  }

  private static generateChromaticAscent(target: string, length: number): string[][] {
    const line: string[] = new Array(length);
    line[length - 1] = target;
    
    for (let i = length - 2; i >= 0; i--) {
      line[i] = Note.simplify(Note.pitchClass(transpose(line[i + 1] + "4", "-2m")));
    }
    return [line];
  }

  private static generateChromaticDescent(target: string, length: number): string[][] {
    const line: string[] = new Array(length);
    line[length - 1] = target;
    
    for (let i = length - 2; i >= 0; i--) {
      line[i] = Note.simplify(Note.pitchClass(transpose(line[i + 1] + "4", "2m")));
    }
    return [line];
  }

  private static generateCircleOf5ths(target: string, length: number): string[][] {
    const line: string[] = new Array(length);
    line[length - 1] = target;
    
    for (let i = length - 2; i >= 0; i--) {
      line[i] = Note.simplify(Note.pitchClass(transpose(line[i + 1] + "4", "5P")));
    }
    return [line];
  }

  private static generateContraryMotion(target: string, anchors: MelodicAnchor[]): string[][] {
    const length = anchors.length;
    const line: string[] = new Array(length);
    line[length - 1] = target;
    
    // Simplistic contrary motion for now
    for (let i = length - 2; i >= 0; i--) {
      const currentMelody = Note.midi(anchors[i].pitch + "4") || 0;
      const nextMelody = Note.midi(anchors[i+1].pitch + "4") || 0;
      const diff = nextMelody - currentMelody;
      
      if (diff > 0) { // Melody went up, bass goes down (by step)
        line[i] = Note.pitchClass(transpose(line[i + 1] + "4", "2M")); // going backwards, so we go up to mean it went down forward
      } else if (diff < 0) { // Melody went down, bass goes up
        line[i] = Note.pitchClass(transpose(line[i + 1] + "4", "-2M"));
      } else {
        line[i] = line[i + 1]; // Oblique
      }
    }
    return [line];
  }
}
