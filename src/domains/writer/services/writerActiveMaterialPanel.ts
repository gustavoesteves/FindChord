import type { ContextualMaterialCandidate } from "../../../utils/music/theory/contextualMaterialCandidates";
import {
  describeLocalMaterialSource,
  notesForLocalMaterialLine,
  suggestedLineForLocalMaterial,
  type LocalMaterialSourceDescription,
  type LocalMaterialSuggestedLine
} from "../../../utils/music/theory/localMaterialPresentation";

export interface WriterActiveMaterialLine extends LocalMaterialSuggestedLine {
  notes: string[];
  displayNotes: string[];
}

export interface WriterActiveMaterialPanel {
  sourceType: string;
  melodicMaterials: NonNullable<ContextualMaterialCandidate["melodicMaterials"]>;
  studyLine?: WriterActiveMaterialLine;
  theory: LocalMaterialSourceDescription;
}

export interface WriterActiveMaterialPanelInput {
  sourceType: string;
  chordRoot: string;
  candidate?: ContextualMaterialCandidate;
}

export function buildWriterActiveMaterialPanel(input: WriterActiveMaterialPanelInput): WriterActiveMaterialPanel {
  const studyLine = suggestedLineForLocalMaterial(input.sourceType);
  const studyLineNotes = studyLine ? notesForLocalMaterialLine(input.chordRoot, studyLine.intervals) : [];

  return {
    sourceType: input.sourceType,
    melodicMaterials: input.candidate?.melodicMaterials || [],
    studyLine: studyLine
      ? {
          ...studyLine,
          notes: studyLineNotes,
          displayNotes: studyLineNotes.map(note => note.replace(/\d/, ""))
        }
      : undefined,
    theory: describeLocalMaterialSource(input.sourceType)
  };
}
