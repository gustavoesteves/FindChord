/**
 * Valida o limite de stretch máximo (distância máxima de trastes pressionados)
 */
export function isWithinAnatomicalStretch(frettedMin: number, frettedMax: number): boolean {
  if (frettedMin === Infinity || frettedMax === -Infinity) return true;
  return (frettedMax - frettedMin) <= 4;
}

/**
 * Valida a viabilidade anatômica de alcance da mão em cordas adjacentes
 */
export function isPhysicalReachValid(frets: (number | null)[]): boolean {
  for (let s_low = 0; s_low < 6; s_low++) {
    const f_low = frets[s_low];
    if (f_low === null || f_low === 0) continue;

    for (let s_high = 0; s_high < s_low; s_high++) {
      const f_high = frets[s_high];
      if (f_high === null || f_high === 0) continue;

      // Se a distância entre cordas for menor ou igual a 2, a diferença de trastes não pode passar de 2 (limite mecânico dos dedos)
      if (s_low - s_high <= 2) {
        if (f_low - f_high > 2) {
          return false;
        }
      }
    }
  }
  return true;
}
