import type {
  FunctionalChord,
  Phrase,
  AttractorField,
  AttractorNode,
  AttractorType,
  TonalCenter
} from '../models/FunctionalAnalysis';

export class AttractorEngine {

  /**
   * Calculates the Attractor Field (gravitational pull) for each chord based on its
   * phrase role, harmonic function, and structural position.
   */
  public static calculateFields(chords: FunctionalChord[], phrases: Phrase[], tonalCenter: TonalCenter): void {
    const N = chords.length;

    for (let idx = 0; idx < N; idx++) {
      const chord = chords[idx];
      if (!chord.semantic) continue;

      const activeAttractors: AttractorNode[] = [];
      const role = chord.semantic.phraseRole;

      // 1. Base Structural Attractors
      if (role === 'CLOSING' || role === 'CADENTIAL') {
        const weight = role === 'CLOSING' ? 1.0 : 0.95;
        let alignment = 0.0;
        
        // If we are already resting on the Tonic, alignment is high.
        // If we are on the dominant, alignment is low (we are feeling the pull, but haven't arrived).
        if (chord.harmonicFunction === 'TONIC') alignment = 1.0;
        else if (chord.harmonicFunction === 'SUBDOMINANT') alignment = 0.2;
        else if (chord.harmonicFunction === 'DOMINANT') alignment = 0.0;

        activeAttractors.push({
          type: 'TONAL_RESOLUTION',
          targetRoot: tonalCenter.root,
          targetFunction: 'TONIC',
          targetState: `${tonalCenter.root}_${tonalCenter.mode}_CENTER`,
          weight,
          alignment
        });
      } else if (role === 'PRE_CADENTIAL') {
        let alignment = 0.0;
        if (chord.harmonicFunction === 'DOMINANT') alignment = 1.0;
        else if (chord.harmonicFunction === 'SUBDOMINANT') alignment = 0.5;

        activeAttractors.push({
          type: 'CADENTIAL_DOMINANT',
          targetFunction: 'DOMINANT',
          weight: 0.8,
          alignment
        });
      } else if (role === 'PROLONGATION' || role === 'BODY' || role === 'OPENING') {
        const weight = role === 'PROLONGATION' ? 0.95 : 0.8;
        // In prolongation, we are already in the target state.
        const alignment = 1.0;
        
        activeAttractors.push({
          type: 'PROLONGATION_INERTIA',
          targetRoot: chord.state?.root,
          targetState: `${chord.state?.root || 'UNKNOWN'}_PROLONGATION`,
          weight,
          alignment
        });
      } else if (role === 'BRIDGE') {
        activeAttractors.push({
          type: 'NARRATIVE_DIVERSION',
          targetState: 'DIVERSION_AREA',
          weight: 0.85,
          alignment: 1.0
        });
      }

      // 2. Local Phenomenon Attractors (Secondary Dominants, Modal Borrowing)
      if (chord.contextualFunction === 'SECONDARY_DOMINANT' || chord.contextualFunction === 'TRITONE_SUBSTITUTION') {
        const target = chord.secondary?.secondaryTarget;
        activeAttractors.push({
          type: 'LOCAL_RESOLUTION',
          targetRoot: target,
          targetFunction: 'PRIMARY', // Pulling to the primary degree of the secondary target
          targetState: `${target}_LOCAL_CENTER`,
          weight: 0.9,
          alignment: 0.0 // The dominant itself is 0 alignment to its own target
        });
      }

      if (chord.modal?.modalBorrowing) {
        activeAttractors.push({
          type: 'MODAL_GRAVITY',
          targetState: `${chord.modal.modalBorrowing.sourceMode}_GRAVITY`,
          weight: 0.75,
          alignment: 1.0 // If it's a borrowed chord, it's currently aligning with that modal gravity
        });
      }

      // 3. Determine Primary Attractor
      // The primary attractor is the one with the highest weight
      let primaryAttractor = activeAttractors[0];
      for (const attr of activeAttractors) {
        if (attr.weight > primaryAttractor.weight) {
          primaryAttractor = attr;
        }
      }

      // 4. Default fallback if nothing was matched
      if (!primaryAttractor) {
        primaryAttractor = {
          type: 'PROLONGATION_INERTIA',
          weight: 0.5,
          alignment: 1.0
        };
        activeAttractors.push(primaryAttractor);
      }

      chord.attractorField = {
        primaryAttractor,
        activeAttractors
      };
    }
  }
}
