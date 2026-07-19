import { getPitchClass } from "../core/pitch";

export type LocalMaterialNoteCategory = "root" | "chordTone" | "characteristic" | "tension" | "avoid";

export interface LocalMaterialNoteCategoryDescriptor {
  category: LocalMaterialNoteCategory;
  label: string;
  title: string;
  activeClassName: string;
  dotActiveClassName: string;
}

export interface LocalMaterialNoteRole {
  category: LocalMaterialNoteCategory;
  label: string;
  color: string;
  tooltip: string;
}

export const LOCAL_MATERIAL_NOTE_CATEGORIES: LocalMaterialNoteCategoryDescriptor[] = [
  {
    category: "root",
    label: "Tônica",
    title: "Alternar visibilidade das tônicas",
    activeClassName: "bg-[#0165e7]/10 border-[#0165e7]/45 text-zinc-200 shadow-[0_0_6px_rgba(1,101,231,0.06)]",
    dotActiveClassName: "bg-[#0165e7] shadow-[0_0_5px_#0165e7]"
  },
  {
    category: "chordTone",
    label: "Acorde",
    title: "Alternar visibilidade das notas do acorde",
    activeClassName: "bg-[#ff4e8c]/10 border-[#ff4e8c]/45 text-zinc-200 shadow-[0_0_6px_rgba(255,78,140,0.06)]",
    dotActiveClassName: "bg-[#ff4e8c] shadow-[0_0_5px_#ff4e8c]"
  },
  {
    category: "characteristic",
    label: "Cor",
    title: "Alternar visibilidade das notas de assinatura modal",
    activeClassName: "bg-[#FCD34D]/10 border-[#FCD34D]/45 text-zinc-200 shadow-[0_0_6px_rgba(252,211,77,0.06)]",
    dotActiveClassName: "bg-[#FCD34D] shadow-[0_0_8px_#FCD34D] animate-pulse"
  },
  {
    category: "tension",
    label: "Tensão",
    title: "Alternar visibilidade das tensões admissíveis",
    activeClassName: "bg-[#FF9900]/10 border-[#FF9900]/45 text-zinc-200 shadow-[0_0_6px_rgba(255,153,0,0.06)]",
    dotActiveClassName: "bg-[#FF9900] shadow-[0_0_5px_#FF9900]"
  },
  {
    category: "avoid",
    label: "Evitar",
    title: "Alternar visibilidade das notas de evitar",
    activeClassName: "bg-[#EF4444]/10 border-[#EF4444]/45 text-zinc-200 shadow-[0_0_6px_rgba(239,68,68,0.06)]",
    dotActiveClassName: "bg-[#EF4444] shadow-[0_0_5px_#EF4444] border border-dashed border-red-500"
  }
];

export const LOCAL_MATERIAL_NOTE_CATEGORY_INACTIVE_CLASS = "bg-zinc-950/40 border-zinc-900/50 text-zinc-500 opacity-45";
export const LOCAL_MATERIAL_NOTE_CATEGORY_DOT_INACTIVE_CLASS = "bg-zinc-700";

export function defaultLocalMaterialNoteCategoryVisibility(): Record<LocalMaterialNoteCategory, boolean> {
  return Object.fromEntries(
    LOCAL_MATERIAL_NOTE_CATEGORIES.map(item => [item.category, true])
  ) as Record<LocalMaterialNoteCategory, boolean>;
}

export function classifyLocalMaterialNote(
  noteName: string,
  chordRoot: string,
  chordNotes: string[],
  sourceType: string
): LocalMaterialNoteRole {
  const notePC = getPitchClass(noteName);
  const rootPC = getPitchClass(chordRoot);
  const chordPCs = chordNotes.map(note => getPitchClass(note));
  const distance = (notePC - rootPC + 12) % 12;

  if (notePC === rootPC) {
    return {
      category: "root",
      label: "R (Tonica)",
      color: "#0165e7",
      tooltip: "Tonica: centro de repouso do acorde."
    };
  }

  if (sourceType.includes("lydian") && distance === 6) {
    return {
      category: "characteristic",
      label: "#11 (Modal)",
      color: "#FCD34D",
      tooltip: "Assinatura lidia: quarta aumentada como cor caracteristica."
    };
  }

  if (sourceType.includes("dorian") && distance === 9) {
    return {
      category: "characteristic",
      label: "13 (Modal)",
      color: "#FCD34D",
      tooltip: "Assinatura dorica: sexta maior como cor caracteristica."
    };
  }

  if (sourceType.includes("mixolydian") && distance === 10) {
    return {
      category: "characteristic",
      label: "b7 (Modal)",
      color: "#FCD34D",
      tooltip: "Assinatura mixolidia: setima menor como cor dominante."
    };
  }

  if (sourceType.includes("phrygian") && distance === 1) {
    return {
      category: "characteristic",
      label: "b9 (Modal)",
      color: "#FCD34D",
      tooltip: "Assinatura frigia: segunda menor como cor caracteristica."
    };
  }

  if (sourceType.includes("locrian") && distance === 6) {
    return {
      category: "characteristic",
      label: "b5 (Modal)",
      color: "#FCD34D",
      tooltip: "Assinatura locria: quinta diminuta como instabilidade estrutural."
    };
  }

  if (chordPCs.includes(notePC)) {
    const labels: Record<number, string> = {
      3: "3a (Acorde)",
      4: "3a (Acorde)",
      5: "5a (Acorde)",
      6: "5a (Acorde)",
      7: "5a (Acorde)",
      8: "5a (Acorde)",
      9: "7a (Acorde)",
      10: "7a (Acorde)",
      11: "7a (Acorde)"
    };
    return {
      category: "chordTone",
      label: labels[distance] || "Acorde",
      color: "#ff4e8c",
      tooltip: "Nota do acorde: ponto estavel para apoiar ou finalizar frases."
    };
  }

  const isAvoidFourth = (sourceType === "major" || sourceType.includes("bebop") || sourceType.includes("mixolydian")) && distance === 5;
  const isAvoidSixth = (sourceType.includes("aeolian") || sourceType.includes("phrygian")) && distance === 8;
  const isAvoidSecond = sourceType.includes("locrian") && distance === 1;

  if (isAvoidFourth || isAvoidSixth || isAvoidSecond) {
    const labels: Record<number, string> = {
      1: "b9 (Evitar)",
      5: "11 (Evitar)",
      8: "b13 (Evitar)"
    };
    return {
      category: "avoid",
      label: labels[distance] || "Evitar",
      color: "#EF4444",
      tooltip: "Nota de evitar: use como passagem, suspensao ou friccao controlada."
    };
  }

  const labels: Record<number, string> = {
    1: "b9",
    2: "9",
    5: "11",
    6: "#11",
    8: "b13",
    9: "13"
  };
  return {
    category: "tension",
    label: labels[distance] || `${distance}`,
    color: "#FF9900",
    tooltip: "Tensao: nota de cor para enriquecer o fraseado."
  };
}
