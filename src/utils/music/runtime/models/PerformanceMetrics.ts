export interface PerformanceMetrics {
  eventCount: number;
  averageDensity: number;      // Média de notas por evento disparado
  averagePolyphony: number;    // Índice médio de polifonia concorrente nos instantes de disparo
  noteOnCount: number;         // Quantidade total de comandos NoteOn
  rhythmicComplexity: number;  // Proporção de trigger offsets únicos: uniqueStartTimes / eventCount
}
