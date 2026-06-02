export interface VoicedVoice {
  role: "bass" | "root" | "third" | "fifth" | "seventh" | "tension";
  midi: number;
  label: string; // Ex: "C3 (Bass)"
}
