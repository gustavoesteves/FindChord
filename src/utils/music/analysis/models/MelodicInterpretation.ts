export interface AnchorInterpretation {
  anchorPitch: string;
  meaningId: string; // e.g. "ThirdOfDominant"
  meaningLabel: string; // e.g. "Third of Dominant"
  behavior: string; // e.g. "DIATONIC", "DOMINANT", "MODAL", "CHROMATIC" (or custom hybrids)
  impliedChord: string; // e.g. "G7"
}

export interface TrajectoryInterpretation {
  anchorPitch: string;
  selectedMeaning: AnchorInterpretation;
  
  // Implied gravity field mapped to the options that fulfill it
  antecedentOptions: string[];
  consequentOptions: string[];
  
  narrativeType: string; // e.g. "AuthenticCadence", "MinorTonicization"
}
