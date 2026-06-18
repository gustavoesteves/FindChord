export type ProtocolVersion = '1.0';

export type BridgeMessageType = 'SESSION' | 'RENDER' | 'MUTATION';

export interface BridgeMessage {
  protocolVersion: ProtocolVersion;
  messageType: BridgeMessageType;
  payload: unknown;
}

export type SessionCommandType = 
  | 'CURSOR_CHANGED' 
  | 'SELECTION_CHANGED' 
  | 'SCORE_LOADED' 
  | 'SCORE_CLOSED';

export interface SessionCommand {
  type: SessionCommandType;
  cursorTick?: number;
  selectionStartTick?: number;
  selectionEndTick?: number;
  scoreId?: string;
  metadata?: Record<string, unknown>;
}

export interface RenderCommand {
  type: 'RENDER';
  action: 'DRAW_ATTRACTOR' | 'DRAW_ROLE' | 'HIGHLIGHT';
  targetTick: number;
  data: Record<string, unknown>;
}

export interface MutationCommand {
  type: 'MUTATION';
  action: 'INSERT_CHORD' | 'REPLACE_CHORD' | 'DELETE_CHORD';
  targetTick: number;
  chordSymbol?: string;
}
