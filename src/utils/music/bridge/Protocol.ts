export interface BridgeMessage {
  protocolVersion: '1.0';
  messageType: 'SESSION' | 'MUTATION';
  payload: unknown;
}

export interface MutationCommand {
  type: 'MUTATION';
  action: 'INSERT_CHORD' | 'REPLACE_CHORD' | 'DELETE_CHORD';
  targetTick: number;
  chordSymbol?: string;
  data?: unknown;
}
