import { HarmonicRoute } from './HarmonicRoute';

export type RouteMutationType = 
  | 'functional_reinterpretation' 
  | 'modal_expansion' 
  | 'chromatic_displacement' 
  | 'cadential_weakening' 
  | 'tonal_destabilization';

export interface DistanceMetrics {
  fromOriginal: number; // Delta (0-100) from the original root phrase
  fromParent: number;   // Delta (0-100) from the parent node (if this is a mutation)
}

export interface ExplorationNode {
  nodeId: string;
  parentId?: string; // Links back to the parent ExplorationNode, or undefined if it directly branches from Original
  
  mutationType?: RouteMutationType; // The compositional technique used to derive this from the parent
  
  route: HarmonicRoute; // The generated payload
  
  distance: DistanceMetrics; // Relative and absolute audacity
  
  accepted: boolean; // Whether the composer selected this route in the UI
  favorite?: boolean; // ⭐ User starred
  pinned?: boolean; // 📌 Pinned to dashboard
  
  createdAt: number; // Timestamp for timeline reconstruction
}
