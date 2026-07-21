export interface BridgeMessage {
  protocolVersion: '1.0';
  messageType: 'SESSION' | 'MUTATION' | 'ACK';
  payload: unknown;
}

export interface MutationCommand {
  type: 'MUTATION';
  commandId: string;
  targetPluginSessionId?: string;
  expiresAt: number;
  action: 'INSERT_CHORD';
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

export function isBridgeMessage(candidate: unknown): candidate is BridgeMessage {
  if (!candidate || typeof candidate !== 'object') return false;
  const message = candidate as Partial<BridgeMessage>;
  return message.protocolVersion === '1.0'
    && (message.messageType === 'SESSION' || message.messageType === 'MUTATION' || message.messageType === 'ACK');
}
