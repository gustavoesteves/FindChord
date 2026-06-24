export interface MelodicAnchor {
    pitchClass: string;
    octave: number;
    tickStart: number;
    tickEnd: number;
    duration: number; // ticks
    metricWeight: number; // 0.0 a 1.0 (ex: 1.0 para tempo forte)
    stabilityWeight: number; // Diferencia nota parada vs passagem
    structuralImportance: number; // Derivado dos três acima
}
