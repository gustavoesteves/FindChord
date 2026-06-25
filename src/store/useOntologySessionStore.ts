import { create } from "zustand";
import type { FunctionalAnalysis, FunctionalChord, PhraseRole, AttractorField } from "../utils/music/analysis/models/FunctionalAnalysis";
import type { ScoreSnapshot } from "../utils/music/analysis/models/ScoreSnapshot";
import { analyzeProgression } from "../utils/music/analysis/orchestrators/progressionAnalysis";
import type { OntologyRegion, RegionType } from "../utils/music/analysis/regions/OntologyRegion";
import type { SelectionScope, ExplorationResult } from "../utils/music/analysis/models/SuggestedRoute";
import { DEFAULT_PRIORITIES } from "../utils/music/analysis/models/HarmonicPriorities";
import type { HarmonicPriorities } from "../utils/music/analysis/models/HarmonicPriorities";
import { RouteExplorationEngine } from "../utils/music/analysis/engines/RouteExplorationEngine";
import { type ExplanationTrace, generateExplanationTrace } from "../utils/music/analysis/explainability/ExplanationTrace";
import type { ParsedScore } from "../utils/music/analysis/models/ParsedScore";
import { useChordStore } from "./useChordStore";

export interface RegionGraph {
  current: string;
  next?: string;
  previous?: string;
}

export interface FormalSection {
  id: string;
  label: string;
  startMeasure: number;
  endMeasure: number;
  startTick?: number;
  endTick?: number;
  startChordIndex?: number;
  endChordIndex?: number;
}

export interface AnalysisIndexes {
  tickBounds: number[]; // Ordered array of node start ticks
  nodeByTick: Map<number, FunctionalChord>;
  phraseByTick: Map<number, PhraseRole>;
  attractorByTick: Map<number, AttractorField>;
  regions: OntologyRegion[];
  formalSections: FormalSection[];
}

export interface OntologySession {
  analysisVersion: string;
  ontologyVersion: string;
  analysisTimestamp: number;

  // Source of Truth
  scoreSnapshot: ScoreSnapshot | null;
  parsedScore: ParsedScore | null;
  progressionAnalysis: FunctionalAnalysis | null;
  indexes: AnalysisIndexes | null;

  // Local Window
  selectionScope: SelectionScope;
  activeWindow: { tickStart: number; tickEnd: number } | null;
  activeNode: FunctionalChord | null;
  activePhrase: PhraseRole | null;
  activeAttractor: AttractorField | null;
  activeRegion: OntologyRegion | null;
  activeFormalSection: FormalSection | null;
  selectedChordId: string | null;
  selectedRegionId: string | null;
  cursorTick: number | null;
  cursorRegionId: string | null;
  regionChangeCounter: number;
  activeRegionIndex: number | null;
  activeRegionGraph: RegionGraph | null;

  // Caches
  counterfactualCache: Record<string, FunctionalAnalysis>;
  
  // F14.0 ExplorationResult & Decision Layer
  activeExplorationResult: ExplorationResult | null;
  harmonicPriorities: HarmonicPriorities;
  localIntent: string | null;
  setHarmonicPriorities: (priorities: HarmonicPriorities) => void;
  setLocalIntent: (intent: string | null) => void;
  setSelectionScope: (scope: SelectionScope) => void;
  
  // Actions
  loadScore: (snapshot: ScoreSnapshot, parsedScoreContext?: ParsedScore) => void;
  updateCursor: (tick: number) => void;
  selectChordByIndex: (index: number) => void;
  clearSession: () => void;

  // Navigation API
  nextRegion: () => void;
  previousRegion: () => void;
  jumpToRegion: (regionId: string) => void;
  jumpToRegionType: (type: RegionType, direction?: "next" | "prev") => void;
  selectFormalSection: (sectionId: string) => void;

  // Explainability & Counterfactual
  getExplanationTrace: (region: OntologyRegion, chord: FunctionalChord) => ExplanationTrace;
  getCounterfactualSimulation: (baseProgression: string[], hypotheticalChord: string, chordIndex: number) => FunctionalAnalysis;

  // F13.1 Route Exploration
  generateRoutesForRegion: (region: OntologyRegion, userIntentId?: string) => void;
  clearSuggestedRoutes: () => void;
}

/**
 * Helper for O(log n) lookup.
 * Returns the closest startTick in the sorted array that is <= targetTick.
 * If targetTick is before the first element, returns undefined.
 */
function findNearestTick(tickBounds: number[], targetTick: number): number | undefined {
  if (tickBounds.length === 0) return undefined;
  if (targetTick < tickBounds[0]) return undefined;

  let left = 0;
  let right = tickBounds.length - 1;
  let result = tickBounds[0];

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (tickBounds[mid] === targetTick) {
      return tickBounds[mid];
    } else if (tickBounds[mid] < targetTick) {
      result = tickBounds[mid];
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return result;
}

/**
 * Helper to find the FormalSection that contains a given chord.
 */
function getFormalSectionForChord(formalSections: FormalSection[], node: FunctionalChord | null): FormalSection | null {
  if (!node || !formalSections || formalSections.length === 0) return null;
  
  // If we have chord indexes, use them
  if (node.index !== undefined) {
    const idx = node.index;
    const match = formalSections.find(s => 
      s.startChordIndex !== undefined && s.endChordIndex !== undefined &&
      idx >= s.startChordIndex && idx <= s.endChordIndex
    );
    if (match) return match;
  }
  
  return null;
}

/**
 * O(log n) lookup for regions using tick bounds.
 * Returns the region and its index in the array.
 */
function findRegionForTick(regions: OntologyRegion[], targetTick: number): { region: OntologyRegion, index: number } | undefined {
  if (regions.length === 0) return undefined;
  
  let left = 0;
  let right = regions.length - 1;
  let fallback = undefined;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const region = regions[mid];
    
    if (targetTick >= region.tickStart && targetTick < region.tickEnd) {
      return { region, index: mid };
    }
    
    if (targetTick < region.tickStart) {
      right = mid - 1;
    } else {
      fallback = { region, index: mid };
      left = mid + 1;
    }
  }

  return fallback;
}

export const useOntologySessionStore = create<OntologySession>((set, get) => ({
  analysisVersion: crypto.randomUUID(),
  ontologyVersion: "14.0",
  analysisTimestamp: Date.now(),

  scoreSnapshot: null,
  parsedScore: null,
  progressionAnalysis: null,
  indexes: null,

  selectionScope: 'REGION',
  activeWindow: null,
  activeNode: null,
  activePhrase: null,
  activeAttractor: null,
  activeRegion: null,
  activeFormalSection: null,
  selectedChordId: null,
  selectedRegionId: null,
  cursorTick: null,
  cursorRegionId: null,
  regionChangeCounter: 0,
  activeRegionIndex: null,
  activeRegionGraph: null,
  
  activeExplorationResult: null,
  harmonicPriorities: DEFAULT_PRIORITIES,
  localIntent: null,

  counterfactualCache: {},

  loadScore: (snapshot: ScoreSnapshot, parsedScoreContext?: ParsedScore) => {
    console.log("[Ontology Session] Computing Heavy Ontology (analyzeProgression)...");
    
    // 1. Run the heavy analysis once (with Validator safety boundary)
    const chordStrings = snapshot.harmonies.map(h => h.harmony);
    let analysis: FunctionalAnalysis;
    try {
      analysis = analyzeProgression(chordStrings);
    } catch (err) {
      console.error("[Ontology Session] 🚨 HARMONY_PARSE_WARNING: Crash during progression analysis! Invalid chords bypassed.", err);
      // Fallback para evitar morte do Dashboard
      analysis = { chords: [], cadences: [], tonalCenter: { root: 'C', mode: 'MAJOR' as any, confidence: 0 } } as unknown as FunctionalAnalysis;
    }

    // 2. Build the indexes O(N)
    const tickBounds: number[] = [];
    const nodeByTick = new Map<number, FunctionalChord>();
    const phraseByTick = new Map<number, PhraseRole>();
    const attractorByTick = new Map<number, AttractorField>();
    const regions: OntologyRegion[] = [];
    let formalSections: FormalSection[] = (snapshot.sections || []).map(sec => ({
      id: sec.id,
      label: sec.label,
      startMeasure: sec.startMeasure,
      endMeasure: sec.endMeasure,
      startTick: sec.startTick || 0,
      endTick: sec.endTick || 0,
      startChordIndex: sec.startChordIndex,
      endChordIndex: sec.endChordIndex
    }));

    // Auto-generate 8-bar structure if no sections are declared by the composer
    if (formalSections.length === 0 && snapshot.metadata?.measures) {
      const total = snapshot.metadata.measures;
      let current = 1;
      let partIndex = 1;
      const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
      
      while (current <= total) {
        const end = Math.min(current + 7, total);
        formalSections.push({
          id: `auto_sec_${partIndex}`,
          label: `Parte ${letters[(partIndex - 1) % letters.length]}`,
          startMeasure: current,
          endMeasure: end,
          startTick: (current - 1) * 1920,
          endTick: end * 1920
        });
        current = end + 1;
        partIndex++;
      }
    }

    let currentRegion: OntologyRegion | null = null;

    analysis.chords.forEach((node, idx) => {
      const originalChord = snapshot.harmonies[idx];
      // Use tickStart from parser if available, fallback to measure * 1920
      const startTick = originalChord?.tickStart !== undefined ? originalChord.tickStart : (originalChord?.measure ? (originalChord.measure - 1) * 1920 : (idx * 1920));
      const endTick = originalChord?.tickEnd !== undefined ? originalChord.tickEnd : startTick + 1920;
      
      tickBounds.push(startTick);
      nodeByTick.set(startTick, node);

      const role = node.semantic?.phraseRole || 'UNKNOWN';
      const attractorType = node.attractorField?.primaryAttractor?.type || 'UNKNOWN';

      if (node.semantic?.phraseRole) {
        phraseByTick.set(startTick, node.semantic.phraseRole);
      }

      if (node.attractorField) {
        attractorByTick.set(startTick, node.attractorField);
      }

      if (!currentRegion || currentRegion.dominantRole !== role || currentRegion.dominantAttractor !== attractorType) {
        if (currentRegion) {
          currentRegion.tickEnd = startTick;
          const roleConfSum = currentRegion.nodes.reduce((sum, n) => sum + (n.semantic?.phraseRoleConfidence || n.confidence || 0.5), 0);
          const avgRoleConf = currentRegion.nodes.length ? (roleConfSum / currentRegion.nodes.length) : 0;
          const alignSum = currentRegion.nodes.reduce((sum, n) => sum + (n.attractorField?.primaryAttractor?.alignment ?? 1.0), 0);
          const avgAlign = currentRegion.nodes.length ? (alignSum / currentRegion.nodes.length) : 1.0;
          currentRegion.confidence = Math.min(avgRoleConf, avgAlign);
          regions.push(currentRegion);
        }

        let regionType: RegionType = 'NARRATIVE';
        if (role === 'PROLONGATION') regionType = 'PROLONGATION';
        else if (role === 'PRE_CADENTIAL' || role === 'CADENTIAL') regionType = 'CADENTIAL';
        else if (role === 'BRIDGE') regionType = 'TRANSITION';

        currentRegion = {
          id: crypto.randomUUID(),
          tickStart: startTick,
          tickEnd: 0,
          measures: [],
          dominantRole: role as PhraseRole,
          dominantAttractor: attractorType,
          confidence: 0,
          regionType,
          nodes: []
        } as OntologyRegion;
      }

      currentRegion.nodes.push(node);
      currentRegion.tickEnd = endTick; // Continually push tickEnd based on current chord's endTick
      if (originalChord?.measure && !currentRegion.measures.includes(originalChord.measure)) {
        currentRegion.measures.push(originalChord.measure);
      }
    });

    const lastRegion = currentRegion as OntologyRegion | null;
    if (lastRegion) {
      // tickEnd was already updated on the last chord
      const roleConfSum = lastRegion.nodes.reduce((sum, n) => sum + (n.semantic?.phraseRoleConfidence || n.confidence || 0.5), 0);
      const avgRoleConf = lastRegion.nodes.length ? (roleConfSum / lastRegion.nodes.length) : 0;
      const alignSum = lastRegion.nodes.reduce((sum, n) => sum + (n.attractorField?.primaryAttractor?.alignment ?? 1.0), 0);
      const avgAlign = lastRegion.nodes.length ? (alignSum / lastRegion.nodes.length) : 1.0;
      lastRegion.confidence = Math.min(avgRoleConf, avgAlign);
      regions.push(lastRegion);
    }

    tickBounds.sort((a, b) => a - b);

    const indexes: AnalysisIndexes = {
      tickBounds,
      nodeByTick,
      phraseByTick,
      attractorByTick,
      regions,
      formalSections
    };

    set({
      analysisVersion: crypto.randomUUID(),
      analysisTimestamp: Date.now(),
      scoreSnapshot: snapshot,
      parsedScore: parsedScoreContext || null,
      progressionAnalysis: analysis,
      indexes,
      activeWindow: null,
      activeNode: null,
      activePhrase: null,
      activeAttractor: null,
      activeRegion: null,
      activeFormalSection: null,
      selectedChordId: null,
      selectedRegionId: null,
      cursorTick: null,
      cursorRegionId: null,
      regionChangeCounter: 0,
      activeRegionIndex: null,
      activeRegionGraph: null,
      activeExplorationResult: null,
      counterfactualCache: {}
    });
    
    // Select the first chord automatically if available
    if (analysis.chords.length > 0) {
      get().selectChordByIndex(0);
    }

    console.log("[Ontology Session] Indexes built. Score loaded successfully.");
  },

  updateCursor: (tick: number) => {
    const { indexes, cursorRegionId, regionChangeCounter } = get();
    if (!indexes) return;

    const match = findRegionForTick(indexes.regions, tick);
    
    // Auxiliary data lookup
    const baseTick = findNearestTick(indexes.tickBounds, tick);
    const node = baseTick !== undefined ? indexes.nodeByTick.get(baseTick) || null : null;
    const phrase = baseTick !== undefined ? indexes.phraseByTick.get(baseTick) || null : null;
    const attractor = baseTick !== undefined ? indexes.attractorByTick.get(baseTick) || null : null;

    if (!match) {
      set({ 
        cursorTick: tick,
        activeNode: node,
        activePhrase: phrase,
        activeAttractor: attractor,
        activeFormalSection: null
      });
      return;
    }
    
    const newRegion = match.region;
    const newRegionIndex = match.index;

    if (newRegion.id !== cursorRegionId) {
      // Build RegionGraph
      const prev = newRegionIndex > 0 ? indexes.regions[newRegionIndex - 1].id : undefined;
      const next = newRegionIndex < indexes.regions.length - 1 ? indexes.regions[newRegionIndex + 1].id : undefined;
      const newGraph: RegionGraph = {
        current: newRegion.id,
        previous: prev,
        next: next
      };

      set({
        activeRegion: newRegion,
        activeRegionIndex: newRegionIndex,
        activeRegionGraph: newGraph,
        activeExplorationResult: null,
        regionChangeCounter: regionChangeCounter + 1,
        activeNode: node,
        activePhrase: phrase,
        activeAttractor: attractor,
        activeFormalSection: getFormalSectionForChord(indexes.formalSections, node),
        activeWindow: { tickStart: newRegion.tickStart, tickEnd: newRegion.tickEnd }
      });
    } else {
      set({
        cursorTick: tick,
        activeNode: node,
        activePhrase: phrase,
        activeAttractor: attractor,
        activeFormalSection: getFormalSectionForChord(indexes.formalSections, node)
      });
    }
  },

  selectChordByIndex: (index: number) => {
    const { progressionAnalysis, indexes } = get();
    if (!progressionAnalysis || !indexes) return;

    const chord = progressionAnalysis.chords[index];
    if (!chord) return;

    // Achar o tick correspondente (heuristic: usa o tickBounds do índice)
    const tick = indexes.tickBounds[index] || 0;
    const match = findRegionForTick(indexes.regions, tick);

    set({
      selectedChordId: chord.index.toString(),
      selectedRegionId: match?.region.id || null,
      activeNode: chord,
      activePhrase: chord.semantic?.phraseRole || null,
      activeAttractor: chord.attractorField || null,
      activeFormalSection: getFormalSectionForChord(indexes.formalSections, chord),
      cursorTick: tick,
      selectionScope: 'CHORD',
      ...(match && { activeRegion: match.region, activeRegionIndex: match.index })
    });
  },

  clearSession: () => {
    set({
      analysisVersion: crypto.randomUUID(),
      analysisTimestamp: Date.now(),
      scoreSnapshot: null,
      parsedScore: null,
      progressionAnalysis: null,
      indexes: null,
      selectionScope: 'REGION',
      activeWindow: null,
      activeNode: null,
      activePhrase: null,
      activeAttractor: null,
      activeRegion: null,
      activeFormalSection: null,
      cursorTick: null,
      cursorRegionId: null,
      regionChangeCounter: 0,
      activeRegionIndex: null,
      activeRegionGraph: null,
      activeExplorationResult: null,
      counterfactualCache: {}
    });
  },

  nextRegion: () => {
    const { indexes, activeRegionIndex, updateCursor } = get();
    if (!indexes || activeRegionIndex === null) return;
    if (activeRegionIndex < indexes.regions.length - 1) {
      const nextReg = indexes.regions[activeRegionIndex + 1];
      updateCursor(nextReg.tickStart);
    }
  },

  previousRegion: () => {
    const { indexes, activeRegionIndex, updateCursor } = get();
    if (!indexes || activeRegionIndex === null) return;
    if (activeRegionIndex > 0) {
      const prevReg = indexes.regions[activeRegionIndex - 1];
      updateCursor(prevReg.tickStart);
    }
  },

  jumpToRegion: (regionId: string) => {
    const { indexes, updateCursor } = get();
    if (!indexes) return;
    const target = indexes.regions.find(r => r.id === regionId);
    if (target) {
      updateCursor(target.tickStart);
    }
  },

  jumpToRegionType: (type: RegionType, direction: "next" | "prev" = "next") => {
    const { indexes, activeRegionIndex, updateCursor } = get();
    if (!indexes || activeRegionIndex === null) return;
    
    const regions = indexes.regions;
    if (direction === "next") {
      for (let i = activeRegionIndex + 1; i < regions.length; i++) {
        if (regions[i].regionType === type) {
          updateCursor(regions[i].tickStart);
          return;
        }
      }
    } else {
      for (let i = activeRegionIndex - 1; i >= 0; i--) {
        if (regions[i].regionType === type) {
          updateCursor(regions[i].tickStart);
          return;
        }
      }
    }
  },

  selectFormalSection: (sectionId: string) => {
    const { indexes, selectChordByIndex } = get();
    if (!indexes) return;
    const section = indexes.formalSections?.find(s => s.id === sectionId);
    if (section) {
      set({ activeFormalSection: section, selectionScope: 'SECTION' });
      // Clear generated routes since the focus changed
      set({ activeExplorationResult: null });
      
      // Auto-select the first chord of the section
      if (section.startChordIndex !== undefined) {
        useChordStore.getState().setActiveTimelineIndex(section.startChordIndex);
        selectChordByIndex(section.startChordIndex);
      }
    }
  },

  setSelectionScope: (scope: SelectionScope) => {
    set({ selectionScope: scope });
  },

  getExplanationTrace: (region: OntologyRegion, chord: FunctionalChord) => {
    const state = get();
    const snapshot = state.progressionAnalysis?.explainabilitySnapshots?.[chord.index.toString()];
    
    if (snapshot) {
      return {
        ...snapshot.explanation,
        regionId: region.id,
        regionType: region.regionType
      };
    }
    
    // Fallback if not found
    return generateExplanationTrace(chord, region.id, region.regionType);
  },

  getCounterfactualSimulation: (baseProgression: string[], hypotheticalChord: string, chordIndex: number) => {
    const state = get();
    // Cache key based on the original chord being replaced, plus the new replacement
    // If the snapshot has chords, we use the original chord's index as the base for the key
    const originalChordId = `idx_${chordIndex}`;
    const cacheKey = `${originalChordId}|${hypotheticalChord}`;
    
    if (state.counterfactualCache[cacheKey]) {
      return state.counterfactualCache[cacheKey];
    }
    
    const hypotheticalProgression = [...baseProgression, hypotheticalChord];
    const analysis = analyzeProgression(hypotheticalProgression, 'GENERAL', 'COUNTERFACTUAL');
    
    set((s) => ({
      counterfactualCache: {
        ...s.counterfactualCache,
        [cacheKey]: analysis
      }
    }));
    
    return analysis;
  },

  setHarmonicPriorities: (priorities) => set({ harmonicPriorities: priorities }),
  setLocalIntent: (intent) => set({ localIntent: intent }),

  generateRoutesForRegion: (region: OntologyRegion, userIntentId?: string) => {
    const { activeNode, parsedScore, harmonicPriorities } = get();
    // F16.6 Forçamos o scope para 'REGION' para garantir a unidade de decisão sobre o trecho, e não sobre o acorde (CHORD)
    const result = RouteExplorationEngine.exploreScope('REGION', region, activeNode, parsedScore, harmonicPriorities, userIntentId);
    set({ activeExplorationResult: result });
  },

  generateRoutesForSection: (section: FormalSection, userIntentId?: string) => {
    const { activeNode, parsedScore, harmonicPriorities, progressionAnalysis, scoreSnapshot } = get();
    if (!progressionAnalysis || !scoreSnapshot) return;

    const sectionNodes = progressionAnalysis.chords.filter((_c, idx) => {
      const original = scoreSnapshot.harmonies[idx];
      const startTick = original?.tickStart !== undefined ? original.tickStart : (original?.measure ? (original.measure - 1) * 1920 : idx * 1920);
      return startTick >= (section.startTick || 0) && startTick < (section.endTick || Infinity);
    });

    if (sectionNodes.length === 0) return;

    const mockRegion: OntologyRegion = {
      id: section.id,
      tickStart: section.startTick || 0,
      tickEnd: section.endTick || 0,
      measures: [],
      dominantRole: 'PROLONGATION' as any,
      dominantAttractor: 'UNKNOWN',
      confidence: 1,
      regionType: 'NARRATIVE',
      nodes: sectionNodes
    };

    const result = RouteExplorationEngine.exploreScope('REGION', mockRegion, activeNode, parsedScore, harmonicPriorities, userIntentId);
    set({ activeExplorationResult: result });
  },

  clearSuggestedRoutes: () => {
    set({ activeExplorationResult: null });
  }

}));
