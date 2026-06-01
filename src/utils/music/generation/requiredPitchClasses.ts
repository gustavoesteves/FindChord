/**
 * Mapeia os graus estruturais de Nível 1 (Críticos) e Nível 2 (Preferenciais) de um acorde.
 */
export function getRequiredPitchClasses(quality: string, rootPC: number): { core: number[]; preferred: number[] } {
  const core: number[] = [];
  const preferred: number[] = [rootPC]; // A tônica é preferencial (Nível 2)

  if (quality.startsWith("major7") || quality === "major9th" || quality === "major13th" || quality === "major7#11") {
    core.push((rootPC + 4) % 12);  // Terça Maior (Nível 1)
    core.push((rootPC + 11) % 12); // Sétima Maior (Nível 1)
  } else if (quality.startsWith("minor7") || quality === "minor9th" || quality === "minor11th" || quality === "minor13th") {
    core.push((rootPC + 3) % 12);  // Terça menor (Nível 1)
    core.push((rootPC + 10) % 12); // Sétima menor (Nível 1)
  } else if (quality.startsWith("dominant7") || quality === "dominant9th" || quality === "dominant11th" || quality === "dominant13th" || quality === "dominant7b9" || quality === "dominant7#9" || quality === "dominant7#11" || quality === "dominant7b13") {
    core.push((rootPC + 4) % 12);  // Terça Maior (Nível 1)
    core.push((rootPC + 10) % 12); // Sétima menor (Nível 1)
  } else if (quality === "halfDiminished") {
    core.push((rootPC + 3) % 12);  // Terça menor (Nível 1)
    core.push((rootPC + 6) % 12);  // Quinta diminuta (Nível 1)
    core.push((rootPC + 10) % 12); // Sétima menor (Nível 1)
  } else if (quality === "diminished7th") {
    core.push((rootPC + 3) % 12);  // Terça menor (Nível 1)
    core.push((rootPC + 6) % 12);  // Quinta diminuta (Nível 1)
    core.push((rootPC + 9) % 12);  // Sétima diminuta (Nível 1)
  } else if (quality === "major6th" || quality === "69") {
    core.push((rootPC + 4) % 12);  // Terça Maior (Nível 1)
    core.push((rootPC + 9) % 12);  // Sexta Maior (Nível 1)
  } else if (quality === "minor6th") {
    core.push((rootPC + 3) % 12);  // Terça menor (Nível 1)
    core.push((rootPC + 9) % 12);  // Sexta Maior (Nível 1)
  } else if (quality === "major" || quality === "add9") {
    core.push((rootPC + 4) % 12);  // Terça Maior (Nível 1)
  } else if (quality === "minor" || quality === "minorAdd9") {
    core.push((rootPC + 3) % 12);  // Terça menor (Nível 1)
  }

  // 2. Adicionar Extensões Característica Mandatórias no Core
  if (quality.includes("9th") || quality === "add9" || quality === "minorAdd9" || quality === "69") {
    core.push((rootPC + 2) % 12);  // Nona (Nível 1 Crítico para acordes de 9ª)
  }
  if (quality.includes("11th") || quality === "major7#11" || quality === "dominant7#11") {
    const isSharp11 = quality.includes("#11");
    core.push((rootPC + (isSharp11 ? 6 : 5)) % 12); // 11ª / #11ª (Nível 1 Crítico para acordes de 11ª)
  }
  if (quality.includes("13th") || quality === "dominant7b13") {
    const isFlat13 = quality.includes("b13");
    core.push((rootPC + (isFlat13 ? 8 : 9)) % 12); // 13ª / b13ª (Nível 1 Crítico para acordes de 13ª)
  }

  return { core, preferred };
}
