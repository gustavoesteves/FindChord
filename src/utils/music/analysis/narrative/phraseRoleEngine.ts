import type {
  FunctionalChord,
  Phrase,
  PhraseRole,
  SemanticSupport,
  CadenceInfo
} from '../models/FunctionalAnalysis';

export interface RoleInference {
  role: PhraseRole;
  confidence: number;
  supports: SemanticSupport[];
}

export class PhraseRoleEngine {
  
  /**
   * Infers the phrase role (OPENING, BODY, PROLONGATION, CADENTIAL, etc.) for each chord.
   * Uses structural smoothing to avoid treating weak vamps as full cadential closures.
   */
  public static inferRoles(chords: FunctionalChord[], phrases: Phrase[]): RoleInference[] {
    const N = chords.length;
    const inferences: RoleInference[] = new Array(N).fill({
      role: 'UNKNOWN',
      confidence: 0.0,
      supports: []
    });

    for (const phrase of phrases) {
      const pStart = phrase.startIndex;
      const pEnd = phrase.endIndex;
      const cad = phrase.terminatingCadence;

      let cadStart = -1;
      let cadEnd = -1;
      let isTrueCadence = false;

      // Evaluate Cadential Candidate
      if (cad) {
        cadStart = cad.startIndex;
        cadEnd = cad.endIndex;
        isTrueCadence = PhraseRoleEngine.evaluateCadentialCandidate(cad, chords);
      }

      // Check if this phrase acts as a Prolongation Vamp
      const isVamp = PhraseRoleEngine.isProlongationVamp(chords, pStart, pEnd);

      for (let idx = pStart; idx <= pEnd; idx++) {
        if (idx >= N) break;

        let role: PhraseRole = 'BODY';
        let confidence = 0.8;
        const supports: SemanticSupport[] = [];

        // 1. Structural Boundaries
        if (idx === pStart) {
          role = 'OPENING';
          supports.push('PHRASE_OPENING');
          confidence = 0.9;
        }

        // 2. Cadential Zones (Only if it's a true cadence)
        if (isTrueCadence && idx >= cadStart && idx <= cadEnd) {
          const isResolved = (cad!.type === 'AUTHENTIC' || cad!.type === 'PLAGAL') &&
            (cad!.resolution.status === 'RESOLVED' ||
             cad!.resolution.status === 'DECEPTIVE' ||
             cad!.resolution.status === 'DELAYED');

          if (isResolved) {
            if (idx === cadEnd) {
              role = 'CLOSING';
              supports.push('CADENCE_RESOLUTION');
              confidence = cad!.confidence;
            } else if (idx === cadEnd - 1) {
              role = 'CADENTIAL';
              supports.push('CADENCE_TENSION');
              confidence = cad!.confidence;
            } else {
              role = 'PRE_CADENTIAL';
              supports.push('CADENCE_PREPARATION');
              confidence = cad!.confidence * 0.8;
            }
          } else {
            // Unresolved / Half Cadence
            if (idx === cadEnd) {
              role = 'CADENTIAL';
              supports.push('CADENCE_TENSION');
              confidence = cad!.confidence;
            } else {
              role = 'PRE_CADENTIAL';
              supports.push('CADENCE_PREPARATION');
              confidence = cad!.confidence * 0.8;
            }
          }
        } else if (isVamp && idx !== pStart) {
          // 3. Smooth Vamps into PROLONGATION
          role = 'PROLONGATION';
          supports.push('VAMP_PROLONGATION');
          confidence = 0.95;
        } else if (!isTrueCadence && idx === pEnd && idx !== pStart) {
          // If phrase ends but there's no true cadence, it's just the BODY or PROLONGATION extending
          role = isVamp ? 'PROLONGATION' : 'BODY';
          confidence = 0.85;
        }

        if (idx === pEnd && role === 'CLOSING' && !supports.includes('PHRASE_CLOSING')) {
          supports.push('PHRASE_CLOSING');
        } else if (idx === pEnd && !supports.includes('PHRASE_CLOSING')) {
          // Weak closures
          supports.push('PHRASE_CLOSING');
        }

        inferences[idx] = { role, confidence, supports };
      }
    }

    return inferences;
  }

  /**
   * Heuristic to determine if a CadenceInfo is structurally strong enough
   * to dictate a CADENTIAL -> CLOSING narrative.
   */
  private static evaluateCadentialCandidate(cad: CadenceInfo, _chords: FunctionalChord[]): boolean {
    if (cad.suppressed) return false;
    
    // If it's explicitly marked as WEAK and low confidence, it's probably a localized motion (like a vamp)
    if (cad.strength === 'WEAK' && cad.confidence < 0.6) {
      return false;
    }

    // Trust the CadenceInfo logic. The PhraseBoundaryEngine already validated the functions.
    // An AUTHENTIC or PLAGAL cadence with moderate/strong strength is a true cadence.
    return true;
  }

  /**
   * Detects if a phrase is essentially a static prolongation (a vamp)
   * rather than a forward-moving harmonic progression.
   */
  private static isProlongationVamp(chords: FunctionalChord[], start: number, end: number): boolean {
    if (end - start < 2) return false;

    let tonicCount = 0;
    for (let i = start; i <= end; i++) {
      if (chords[i]?.harmonicFunction === 'TONIC') {
        tonicCount++;
      }
    }

    // If more than 70% of the phrase is Tonic function, it's a vamp/prolongation
    const tonicRatio = tonicCount / ((end - start) + 1);
    return tonicRatio >= 0.7;
  }
}
