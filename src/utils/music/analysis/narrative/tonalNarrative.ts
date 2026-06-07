import type {
  TonalRegion,
  TonalRegionNode,
  FunctionalChord,
  TonalSummary,
  TonalNarrative,
  TonalCenter,
  StructuralTonalEvent,
  TonalNarrativeType
} from '../models/FunctionalAnalysis';
import { getKeyRelation } from '../../theory/tonalRelations';

/**
 * Builds the high-level tonal narrative and structural reduction.
 */
export function generateTonalNarrative(
  regions: TonalRegion[],
  _regionTree: TonalRegionNode | null,
  _chords: FunctionalChord[],
  summary: TonalSummary
): TonalNarrative | null {
  if (regions.length === 0) return null;

  const homeKey = regions[0].key;
  const departureKey = homeKey;
  const arrivalKey = regions[regions.length - 1].key;

  // 1. Structural Reduction (primaryTrajectory)
  const structuralRegions = regions.filter(
    r => r.isHomeKey || r.type === 'ESTABLISHED_MODULATION' || (r.type === 'REGIONAL_SHIFT' && r.stabilityScore >= 0.45)
  );

  const primaryTrajectory: TonalCenter[] = [];
  structuralRegions.forEach(r => {
    const last = primaryTrajectory[primaryTrajectory.length - 1];
    if (!last || last.root !== r.key.root || last.mode !== r.key.mode) {
      primaryTrajectory.push(r.key);
    }
  });

  if (primaryTrajectory.length === 0) {
    primaryTrajectory.push(homeKey);
  }

  // 2. Structural Events (structuralEvents)
  const structuralEvents: StructuralTonalEvent[] = [];
  for (let i = 1; i < regions.length; i++) {
    const startReg = regions[i - 1];
    const endReg = regions[i];
    const relation = getKeyRelation(startReg.key, endReg.key);

    let significance: 'LOCAL' | 'REGIONAL' | 'STRUCTURAL' = 'REGIONAL';
    if (startReg.type === 'TONICIZATION' || endReg.type === 'TONICIZATION') {
      significance = 'LOCAL';
    } else if (endReg.type === 'ESTABLISHED_MODULATION') {
      significance = 'STRUCTURAL';
    } else if (endReg.type === 'REGIONAL_SHIFT') {
      significance = 'REGIONAL';
    }

    structuralEvents.push({
      startRegionId: `region-node-${i - 1}`,
      endRegionId: `region-node-${i}`,
      relation,
      significance
    });
  }

  // 3. Classify narrative type (narrativeType)
  const establishedModulations = regions.filter(r => !r.isHomeKey && r.type === 'ESTABLISHED_MODULATION').length;
  const tonicizations = regions.filter(r => r.type === 'TONICIZATION').length;
  const regionalShifts = regions.filter(r => !r.isHomeKey && r.type === 'REGIONAL_SHIFT').length;
  
  const returnsToHome = regions.some(
    (r, idx) => idx > 0 && r.isHomeKey && regions.slice(0, idx).some(prev => !prev.isHomeKey)
  );

  let narrativeType: TonalNarrativeType = 'STATIC';
  if (regions.length === 1 || regions.every(r => r.isHomeKey)) {
    narrativeType = 'STATIC';
  } else if (establishedModulations === 0 && regionalShifts === 0 && tonicizations > 0) {
    narrativeType = 'TONICIZATION_CHAIN';
  } else if (returnsToHome) {
    narrativeType = 'ROUND_TRIP';
  } else if (primaryTrajectory.length > 2 || summary.visitedKeys.length > 2) {
    narrativeType = 'MULTI_CENTRIC';
  } else {
    narrativeType = 'MODULATING';
  }

  return {
    departureKey,
    arrivalKey,
    primaryTrajectory,
    structuralEvents,
    narrativeType
  };
}
