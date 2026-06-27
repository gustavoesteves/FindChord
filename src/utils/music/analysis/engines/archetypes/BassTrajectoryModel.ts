import { Note } from "tonal";
import type { TonalCenterCandidate } from "../../engines/PhraseAnalysisEngine";
import type { HarmonicSlot } from "../../models/HarmonicSlot";

export class BassTrajectoryModel {
  
  public static realizeBassForSlots(
    slots: HarmonicSlot[],
    anchorCenter: TonalCenterCandidate
  ): string[] {
    // Bass is a realization of the region, not the structure.
    const bassLine: string[] = [];
    
    for (let i = 0; i < slots.length; i++) {
      const func = slots[i].requiredFunction;
      // Simplistic bass realization based on required function
      let bass = "C";
      if (func === "T") bass = anchorCenter.tonic;
      else if (func === "PD") bass = Note.transpose(anchorCenter.tonic + "4", "4P")!.replace(/\d/g, "");
      else if (func === "D") bass = Note.transpose(anchorCenter.tonic + "4", "5P")!.replace(/\d/g, "");
      else if (func === "EXT") bass = Note.transpose(anchorCenter.tonic + "4", "2M")!.replace(/\d/g, "");
      else if (func === "CHROM") bass = Note.transpose(anchorCenter.tonic + "4", "2m")!.replace(/\d/g, "");
      
      bassLine.push(bass);
    }
    
    return bassLine;
  }
}
