import type { NarrativeWorld, StructuralProfile } from "./NarrativeWorld";
import type { TransitionMutation } from "../engines/WorldTransitionEngine";

export interface MelodicAnchor {
  measureIndex: number;
  pitch: string;
  duration?: number;
}

export interface ProjectionUnit {
  measureIndex: number;
  melodicAnchor: MelodicAnchor;
  assignedChord: string;
  functionalRole: string; // e.g. "V/V"
  interpretationLabel: string; // e.g. "Third of Secondary Dominant"
  behavior: string; // "DIATONIC", "DOMINANT", etc.
}

export interface WorldTransition {
  fromWorldId: string;
  toWorldId: string;
  cost: number;
  mutations: TransitionMutation[];
}

export interface ProjectionSet {
  melody: MelodicAnchor[];
  worlds: NarrativeWorld[];
  projections: ProjectionUnit[]; // the final sequence of chords representing the active world
  transitions: WorldTransition[];
}

// F18 -> F19 Event Architecture Contract
export type F18Event =
  | MelodyLoadedEvent
  | WorldsGeneratedEvent
  | TransitionComputedEvent
  | ProjectionResolvedEvent
  | ActiveWorldChangedEvent;

export interface MelodyLoadedEvent {
  type: "MELODY_LOADED";
  anchors: MelodicAnchor[];
}

export interface WorldsGeneratedEvent {
  type: "WORLDS_GENERATED";
  worlds: NarrativeWorld[];
}

export interface TransitionComputedEvent {
  type: "TRANSITION_COMPUTED";
  targetVector: StructuralProfile;
  bestWorldId: string;
  distanceMap: Record<string, number>;
}

export interface ProjectionResolvedEvent {
  type: "PROJECTION_RESOLVED";
  projectionSet: ProjectionSet;
}

export interface ActiveWorldChangedEvent {
  type: "ACTIVE_WORLD_CHANGED";
  worldId: string;
}
