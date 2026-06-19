import { create } from "zustand";
import type { FunctionalAnalysis, FunctionalChord, PhraseRole, AttractorField } from "../utils/music/analysis/models/FunctionalAnalysis";
import type { ScoreSnapshot } from "../utils/music/analysis/models/ScoreSnapshot";
import { analyzeProgression } from "../utils/music/analysis/orchestrators/progressionAnalysis";
import type { OntologyRegion, RegionType } from "../utils/music/analysis/regions/OntologyRegion";
import { type ExplanationTrace, generateExplanationTrace } from "../utils/music/analysis/explainability/ExplanationTrace";

export interface RegionGraph {
  current: string;
  next?: string;
  previous?: string;
}

export interface AnalysisIndexes {
  tickBounds: number[]; // Ordered array of node start ticks
  nodeByTick: Map<number, FunctionalChord>;
  phraseByTick: Map<number, PhraseRole>;
  attractorByTick: Map<number, AttractorField>;
  regions: OntologyRegion[];
}

export interface OntologySession {
  analysisVersion: string;
  ontologyVersion: string;
  analysisTimestamp: number;

  // Source of Truth
  scoreSnapshot: ScoreSnapshot | null;
  progressionAnalysis: FunctionalAnalysis | null;
  indexes: AnalysisIndexes | null;

  // Local Window
  activeWindow: { tickStart: number; tickEnd: number } | null;
  activeNode: FunctionalChord | null;
  activePhrase: PhraseRole | null;
  activeAttractor: AttractorField | null;
  activeRegion: OntologyRegion | null;
  cursorTick: number | null;
  cursorRegionId: string | null;
  regionChangeCounter: number;
  activeRegionIndex: number | null;
  activeRegionGraph: RegionGraph | null;

  // Caches
  explainabilityCache: Record<string, ExplanationTrace>;
  counterfactualCache: Record<string, FunctionalAnalysis>;

  // Actions
  loadScore: (snapshot: ScoreSnapshot) => void;
  updateCursor: (tick: number) => void;
  clearSession: () => void;

  // Navigation API
  nextRegion: () => void;
  previousRegion: () => void;
  jumpToRegion: (regionId: string) => void;
  jumpToRegionType: (type: RegionType, direction?: "next" | "prev") => void;

  // Explainability & Counterfactual
  getExplanationTrace: (region: OntologyRegion, chord: FunctionalChord) => ExplanationTrace;
  getCounterfactualSimulation: (baseProgression: string[], hypotheticalChord: string, chordIndex: number) => FunctionalAnalysis;
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
  progressionAnalysis: null,
  indexes: null,

  activeWindow: null,
  activeNode: null,
  activePhrase: null,
  activeAttractor: null,
  activeRegion: null,
  cursorTick: null,
  cursorRegionId: null,
  regionChangeCounter: 0,
  activeRegionIndex: null,
  activeRegionGraph: null,

  explainabilityCache: {},
  counterfactualCache: {},

  loadScore: (snapshot: ScoreSnapshot) => {
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

    let currentRegion: OntologyRegion | null = null;

    analysis.chords.forEach((node, idx) => {
      const originalChord = snapshot.harmonies[idx];
      // Use measure * 1920 to approximate tick bounds for now.
      const startTick = originalChord?.measure ? (originalChord.measure - 1) * 1920 : (idx * 1920);
      
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
      if (originalChord?.measure && !currentRegion.measures.includes(originalChord.measure)) {
        currentRegion.measures.push(originalChord.measure);
      }
    });

    const lastRegion = currentRegion as OntologyRegion | null;
    if (lastRegion) {
      lastRegion.tickEnd = lastRegion.tickStart + (lastRegion.nodes.length * 1920);
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
      regions
    };

    set({
      analysisVersion: crypto.randomUUID(),
      analysisTimestamp: Date.now(),
      scoreSnapshot: snapshot,
      progressionAnalysis: analysis,
      indexes,
      activeWindow: null,
      activeNode: null,
      activePhrase: null,
      activeAttractor: null,
      activeRegion: null,
      cursorTick: null,
      cursorRegionId: null,
      regionChangeCounter: 0,
      activeRegionIndex: null,
      activeRegionGraph: null,
      explainabilityCache: {},
      counterfactualCache: {}
    });
    
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
        activeAttractor: attractor
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
        cursorTick: tick,
        activeRegion: newRegion,
        activeRegionIndex: newRegionIndex,
        cursorRegionId: newRegion.id,
        activeRegionGraph: newGraph,
        regionChangeCounter: regionChangeCounter + 1,
        activeNode: node,
        activePhrase: phrase,
        activeAttractor: attractor,
        activeWindow: { tickStart: newRegion.tickStart, tickEnd: newRegion.tickEnd }
      });
    } else {
      set({
        cursorTick: tick,
        activeNode: node,
        activePhrase: phrase,
        activeAttractor: attractor
      });
    }
  },

  clearSession: () => {
    set({
      analysisVersion: crypto.randomUUID(),
      analysisTimestamp: Date.now(),
      scoreSnapshot: null,
      progressionAnalysis: null,
      indexes: null,
      activeWindow: null,
      activeNode: null,
      activePhrase: null,
      activeAttractor: null,
      activeRegion: null,
      cursorTick: null,
      cursorRegionId: null,
      regionChangeCounter: 0,
      activeRegionIndex: null,
      activeRegionGraph: null,
      explainabilityCache: {},
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

  getExplanationTrace: (region: OntologyRegion, chord: FunctionalChord) => {
    const state = get();
    const cacheKey = `${state.analysisVersion}:${region.id}:${chord.index}`;
    
    if (state.explainabilityCache[cacheKey]) {
      return state.explainabilityCache[cacheKey];
    }
    
    // Fallbacks to avoid crashing
    const trace = generateExplanationTrace(chord, region);
    
    set((s) => ({
      explainabilityCache: {
        ...s.explainabilityCache,
        [cacheKey]: trace
      }
    }));
    
    return trace;
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
  }
}));
