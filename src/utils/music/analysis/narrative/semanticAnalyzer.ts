import type {
  FunctionalChord,
  Phrase,
  HarmonicIntent,
  PhraseRole,
  SemanticCause,
  SemanticSupport
} from '../models/FunctionalAnalysis';
import { PhraseRoleEngine } from './phraseRoleEngine';

function getSemanticExplanation(
  intent: HarmonicIntent,
  role: PhraseRole,
  chord: FunctionalChord
): string[] {
  const explanation: string[] = [];

  // 1. Classification
  if (chord.contextualFunction && chord.contextualFunction !== 'PRIMARY') {
    explanation.push(`Chord classified as ${chord.contextualFunction}`);
  } else {
    explanation.push("Chord classified as PRIMARY");
  }

  // 2. Functional Target / Key Detail
  if (chord.secondary?.secondaryTarget) {
    explanation.push(`Targets ${chord.secondary.secondaryTarget} degree`);
  } else if (chord.tonal?.tonalCenter) {
    const root = chord.tonal.tonalCenter.root;
    const mode = chord.tonal.tonalCenter.mode === 'MAJOR' ? 'Major' : 'Minor';
    explanation.push(`${chord.harmonicFunction} function in ${root} ${mode}`);
  }

  // 3. Phrase Position
  if (role === 'OPENING') {
    explanation.push("Occurs in opening area of the phrase");
  } else if (role === 'BODY') {
    explanation.push("Occurs in the body of the phrase");
  } else if (role === 'PRE_CADENTIAL') {
    explanation.push("Occurs in pre-cadential area");
  } else if (role === 'CADENTIAL') {
    explanation.push("Occurs in active cadential area");
  } else if (role === 'CLOSING') {
    explanation.push("Occurs as cadential resolution");
  }

  // 4. Harmonic Intent Impact
  if (intent === 'PROLONGATION') {
    explanation.push("Prolongs harmonic stability");
  } else if (intent === 'PREPARATION') {
    explanation.push("Prepares cadential movement");
  } else if (intent === 'INTENSIFICATION') {
    explanation.push("Increases harmonic tension");
  } else if (intent === 'ATTRACTION') {
    explanation.push("Generates active voice-leading attraction");
  } else if (intent === 'RESOLUTION') {
    explanation.push("Resolves tension to a stable center");
  } else if (intent === 'COLORATION') {
    explanation.push("Introduces modal or chromatic color");
  }

  return explanation;
}

export function analyzeSemanticContext(
  chords: FunctionalChord[],
  phrases: Phrase[]
): void {
  const N = chords.length;
  if (N === 0) return;

  // Initialize all chords with a default semantic context to avoid undefined errors
  chords.forEach(chord => {
    chord.semantic = {
      intent: 'PROLONGATION',
      phraseRole: 'BODY',
      causes: [],
      supports: [],
      explanation: ['Occurs in the body of the phrase', 'Prolongs harmonic stability']
    };
  });

  for (const phrase of phrases) {
    const pStart = phrase.startIndex;
    const pEnd = phrase.endIndex;

    // Identify cadential indexes if there is a terminating cadence
    const inferences = PhraseRoleEngine.inferRoles(chords, phrases);

    for (let idx = pStart; idx <= pEnd; idx++) {
      if (idx >= N) break;

      const chord = chords[idx];
      const inference = inferences[idx];
      const role = inference.role;
      const confidence = inference.confidence;
      const causes: SemanticCause[] = [];
      const supports: SemanticSupport[] = inference.supports;
      let intent: HarmonicIntent;

      // A. Populate semantic causes based on active chord analytical tags
      if (chord.isDiatonic) {
        if (chord.harmonicFunction === 'TONIC') causes.push('TONIC_FUNCTION');
        else if (chord.harmonicFunction === 'SUBDOMINANT') causes.push('SUBDOMINANT_FUNCTION');
        else if (chord.harmonicFunction === 'DOMINANT') causes.push('DOMINANT_FUNCTION');
      }

      if (chord.contextualFunction === 'SECONDARY_DOMINANT') causes.push('SECONDARY_DOMINANT');
      if (chord.contextualFunction === 'TRITONE_SUBSTITUTION') causes.push('TRITONE_SUBSTITUTION');
      if (chord.contextualFunction === 'SECONDARY_LEADING_TONE') causes.push('SECONDARY_LEADING_TONE');
      if (chord.modal?.modalBorrowing) causes.push('MODAL_BORROWING');
      if (chord.modal?.contextualFunction === 'MODAL_AXIS') causes.push('MODAL_AXIS');
      if (chord.modal?.contextualFunction === 'CHROMATIC_APPROACH') causes.push('CHROMATIC_APPROACH');
      if (chord.modal?.contextualFunction === 'PASSING_DIMINISHED') causes.push('PASSING_DIMINISHED');
      if (chord.modal?.contextualFunction === 'COMMON_TONE_DIMINISHED') causes.push('COMMON_TONE_DIMINISHED');
      if (chord.modal?.contextualFunction === 'NEIGHBOR_DIMINISHED') causes.push('NEIGHBOR_DIMINISHED');

      // Map TONICIZATION when secondary functions are active (phenomenon vs mechanism)
      if (
        chord.contextualFunction === 'SECONDARY_DOMINANT' ||
        chord.contextualFunction === 'TRITONE_SUBSTITUTION' ||
        chord.contextualFunction === 'SECONDARY_LEADING_TONE'
      ) {
        causes.push('TONICIZATION');
      }

      // C. Determine HarmonicIntent (Orthogonal to role)
      if (role === 'CLOSING') {
        intent = 'RESOLUTION';
      } else if (chord.harmonicFunction === 'TONIC' && chord.isDiatonic) {
        intent = 'PROLONGATION';
      } else if (chord.harmonicFunction === 'SUBDOMINANT' && chord.isDiatonic) {
        intent = 'PREPARATION';
      } else if (chord.harmonicFunction === 'DOMINANT' && chord.isDiatonic) {
        intent = 'ATTRACTION';
      } else if (
        chord.contextualFunction === 'SECONDARY_DOMINANT' ||
        chord.contextualFunction === 'TRITONE_SUBSTITUTION' ||
        chord.contextualFunction === 'SECONDARY_LEADING_TONE'
      ) {
        intent = 'INTENSIFICATION';
      } else if (
        chord.modal?.modalBorrowing ||
        chord.modal?.contextualFunction === 'MODAL_AXIS' ||
        chord.modal?.contextualFunction === 'CHROMATIC_APPROACH' ||
        chord.modal?.contextualFunction === 'PASSING_DIMINISHED' ||
        chord.modal?.contextualFunction === 'COMMON_TONE_DIMINISHED' ||
        chord.modal?.contextualFunction === 'NEIGHBOR_DIMINISHED'
      ) {
        intent = 'COLORATION';
      } else {
        intent = 'COLORATION';
      }

      const explanation = getSemanticExplanation(intent, role, chord);
      if (idx === pEnd) {
        explanation.push("Closes the phrase structures");
      }

      chord.semantic = {
        intent,
        phraseRole: role,
        phraseRoleConfidence: confidence,
        causes,
        supports,
        explanation
      };
    }
  }
}
