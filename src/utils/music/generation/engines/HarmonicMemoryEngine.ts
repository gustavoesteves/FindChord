import type { FunctionalFingerprint } from '../models/FunctionalFingerprint';
import type { 
  PhraseContext, 
  ContextualInterpretation, 
  PerceptualOverlay 
} from '../models/HarmonicMemory';

/**
 * Harmonic Memory Engine (F14-X2)
 * Modulates the perception of a functional fingerprint based on the
 * context of recent history (creating an Expectation Vector).
 */
export class HarmonicMemoryEngine {

  /**
   * Evaluates recent harmonic history to build an expectation vector.
   */
  public calculateContext(history: FunctionalFingerprint[]): PhraseContext {
    let tensionAccumulation = 0;
    let anticipatedClosure = false;
    let anticipatedGravity: 'TONAL' | 'MODAL' = 'TONAL';
    let anticipatedDirection: 'expansion' | 'compression' | 'suspension' | 'resolution' = 'expansion';

    if (history.length > 0) {
      const recent = history[history.length - 1];

      // If the last thing was a dominant structure or high tension, we expect closure and resolution
      if (recent.structure.dominantWeight > 0.6 || recent.narrativeIntent.preparation > 0.7) {
        anticipatedClosure = true;
        anticipatedDirection = 'resolution';
      } else if (recent.narrativeIntent.suspension > 0.5) {
        anticipatedDirection = 'resolution'; // Suspensions demand resolution
      } else if (recent.stability.harmonicStability > 0.8) {
        // An anchor usually proceeds to an expansion
        anticipatedDirection = 'expansion';
      }

      // Check if gravity is shifting modal
      const avgModalGravity = history.reduce((sum, f) => sum + f.gravity.modalGravity, 0) / history.length;
      if (avgModalGravity > 0.6) {
        anticipatedGravity = 'MODAL';
      }

      // Accumulate tension if there are unresolved high-tension moments
      for (const fp of history) {
        if (fp.energy.tensionIndex > 0.6 && fp.perception.closureStrength < 0.3) {
          tensionAccumulation += fp.energy.tensionIndex * 0.5;
        } else if (fp.perception.closureStrength > 0.7) {
          tensionAccumulation = 0; // Tension resolves on closure
        }
      }
    }

    return {
      previousFingerprints: history,
      expectationVector: {
        anticipatedClosure,
        anticipatedGravity,
        anticipatedDirection,
        tensionAccumulation: Math.min(1.0, tensionAccumulation)
      }
    };
  }

  /**
   * Generates a PerceptualOverlay without mutating the structural truth (Fingerprint).
   */
  public evaluatePerception(
    fingerprint: FunctionalFingerprint, 
    context: PhraseContext
  ): ContextualInterpretation {
    
    let perceivedClosureStrength = fingerprint.perception.closureStrength;
    let perceivedTension = fingerprint.energy.tensionIndex;
    let perceivedGravity = fingerprint.gravity.tonalGravity; // Assume tonal baseline for now

    const expectation = context.expectationVector;

    // 1. Modulate Closure Strength
    if (expectation.anticipatedClosure && fingerprint.structure.establishmentWeight > 0.5) {
      // If we expected closure and got an anchor/establishment, perception of closure spikes
      perceivedClosureStrength = Math.min(1.0, perceivedClosureStrength + 0.3 + expectation.tensionAccumulation * 0.2);
    } else if (expectation.anticipatedClosure && fingerprint.narrativeIntent.diversion > 0.5) {
      // If we expected closure but got a deceptive motion, closure feels even weaker
      perceivedClosureStrength = Math.max(0.0, perceivedClosureStrength - 0.2);
    }

    // 2. Modulate Tension
    if (expectation.tensionAccumulation > 0.5 && fingerprint.energy.tensionIndex > 0.5) {
      // Tension stacks exponentially if already accumulated
      perceivedTension = Math.min(1.0, perceivedTension + expectation.tensionAccumulation * 0.5);
    }

    // 3. Modulate Gravity
    if (expectation.anticipatedGravity === 'MODAL' && fingerprint.gravity.modalGravity > 0.3) {
      // If we are in a modal context, the modal gravity of the current chord is perceived stronger
      perceivedGravity = fingerprint.gravity.modalGravity * 1.5;
    } else {
      perceivedGravity = fingerprint.gravity.tonalGravity;
    }

    const overlay: PerceptualOverlay = {
      perceivedClosureStrength: Math.min(1.0, perceivedClosureStrength),
      perceivedTension: Math.min(1.0, perceivedTension),
      perceivedGravity: Math.min(1.0, perceivedGravity)
    };

    return {
      fingerprint,
      context,
      overlay
    };
  }
}
