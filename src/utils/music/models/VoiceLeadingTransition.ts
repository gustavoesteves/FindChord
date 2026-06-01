export interface VoiceLeadingTransition {
  fromVoicing: number[];
  toVoicing: number[];
  fretDistance: number;
  commonVoicesCount: number;
  voiceLeadingCost: number;
  totalTransitionCost: number;
}
