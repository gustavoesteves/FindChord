import type { CanonicalProgressionEvent } from '../../analysis/models/CanonicalProgressionEvent';
import type { FunctionalFingerprint } from '../models/FunctionalFingerprint';
import type { HarmonicDNA, CadentialType } from '../models/HarmonicDNA';
import { DnaStrand } from '../models/HarmonicDNA';

/**
 * Extracts the Harmonic DNA (the pure structural sequence) from a progression
 * and its semantic fingerprint.
 */
export class HarmonicDNAExtractor {
  
  /**
   * Generates the HarmonicDNA by analyzing the progression's timeline and its
   * global functional fingerprint.
   */
  public extract(_progression: CanonicalProgressionEvent, fingerprint: FunctionalFingerprint): HarmonicDNA {
    const macro: DnaStrand[] = [];
    const micro: DnaStrand[] = [];

    // Heuristics based on fingerprint's global narrative
    // In a fully developed implementation, this would iterate through progression.chords
    // For now, we deduce the strand sequence from the dominant fingerprint axes
    
    // 1. Preparation
    if (fingerprint.narrativeIntent.preparation > 0.3) {
      macro.push(DnaStrand.Preparation);
    }

    // 2. Expansion / Connection
    if (fingerprint.narrativeIntent.expansion > 0.3) {
      macro.push(DnaStrand.Expansion);
    }
    
    // We infer Connection if structural decorative weight is extremely high but no strong narrative
    if (fingerprint.hierarchy.decorativeWeight > 0.6 && fingerprint.narrativeIntent.preparation < 0.3 && fingerprint.narrativeIntent.expansion < 0.3) {
      macro.push(DnaStrand.Connection);
    }

    // 3. Dominance / Suspension
    if (fingerprint.narrativeIntent.suspension > 0.4) {
      if (fingerprint.structure.dominantWeight > 0.4) {
        macro.push(DnaStrand.Dominance);
        micro.push(DnaStrand.Suspension); // Suspension acting over a dominant
      } else {
        macro.push(DnaStrand.Suspension); // Pure suspension
      }
    } else if (fingerprint.structure.dominantWeight > 0.3) {
      macro.push(DnaStrand.Dominance);
    }

    // Anchor inference
    if (macro.length === 0 && fingerprint.stability.harmonicStability > 0.8) {
      macro.push(DnaStrand.Anchor);
    }

    // Determine Closure
    let closureDetected = false;
    let closureType: CadentialType | undefined = undefined;

    if (fingerprint.perception.closureStrength > 0.5) {
      closureDetected = true;
      const sig = fingerprint.cadentialSignature;
      
      if (sig.authentic >= sig.plagal && sig.authentic >= sig.deceptive && sig.authentic >= sig.modal) {
        closureType = 'AUTHENTIC';
      } else if (sig.plagal >= sig.authentic && sig.plagal >= sig.deceptive && sig.plagal >= sig.modal) {
        closureType = 'PLAGAL';
      } else if (sig.deceptive >= sig.authentic && sig.deceptive >= sig.plagal && sig.deceptive >= sig.modal) {
        closureType = 'DECEPTIVE';
      } else {
        closureType = 'MODAL';
      }
    }

    // Gravity
    const primaryGravity = fingerprint.gravity.modalGravity > fingerprint.gravity.tonalGravity ? 'MODAL' : 'TONAL';

    return {
      macro,
      micro,
      closureDetected,
      closureType,
      primaryGravity
    };
  }
}
