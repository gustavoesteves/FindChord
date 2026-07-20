export interface BridgeMessage {
  protocolVersion: '1.0';
  messageType: 'SESSION' | 'MUTATION' | 'ACK';
  payload: unknown;
}

export interface MutationCommand {
  type: 'MUTATION';
  commandId: string;
  expiresAt: number;
  action: 'INSERT_CHORD' | 'REPLACE_CHORD' | 'DELETE_CHORD';
  targetTick: number;
  chordSymbol?: string;
  data?: unknown;
}

export interface CommandAck {
  type: 'COMMAND_ACK';
  commandId: string;
  status: 'accepted' | 'rejected';
  reason?: string;
}
