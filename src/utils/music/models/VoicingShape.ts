export type CageShape = "C" | "A" | "G" | "E" | "D";

export interface VoicingShape {
  chordName: string;
  frets: (number | null)[]; // 6 elementos correspondendo a 6ª corda (index 0) até 1ª corda (index 5)
  rootString: number;        // String onde a tônica está (0 a 5)
  cageShape: CageShape;
  positionFret: number;     // Primeiro traste pressionado
  notes: string[];          // Notas em cada corda
  qualityScore?: number;    // Score de tocabilidade anatômica e musical (10 a 150)
  shapeFamily?: string;     // Metadados explicativos (ex: "Drop 2")
}
