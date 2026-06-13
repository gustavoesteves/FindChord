const http = require('http');
const crypto = require('crypto');

const PORT = 9000;
let eventQueue = [];
const activeSockets = new Set();

// Telemetria Operacional (Sprint B.5)
let eventsReceived = 0;
let eventsAccepted = 0;
let eventsRejected = 0;
let pluginPollCount = 0;
let pluginLastSeen = null;
let frontendLastSeen = null;

// Helper to write JSON HTTP responses
function writeJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-FindChord-Client'
  });
  res.end(JSON.stringify(data));
}

// Validação de Origem e Cabeçalho do Cliente (Sprint A)
function validateOrigin(req, res) {
  const origin = req.headers['origin'];
  if (origin) {
    // Permite portas do dev server (5173/5174) de localhost ou loopback
    const isValidOrigin = /^https?:\/\/(localhost|127\.0\.0\.1):(5173|5174)$/.test(origin);
    if (!isValidOrigin) {
      eventsRejected++;
      writeJson(res, 403, { error: 'Origem não autorizada.' });
      return false;
    }
    
    // Exige cabeçalho customizado para chamadas vindas de navegadores
    const clientHeader = req.headers['x-findchord-client'];
    if (clientHeader !== 'compose-suite') {
      eventsRejected++;
      writeJson(res, 403, { error: 'Cabeçalho de cliente ausente ou inválido.' });
      return false;
    }

    frontendLastSeen = new Date().toISOString();
  }
  return true;
}

// Create HTTP Server
const server = http.createServer((req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-FindChord-Client'
    });
    res.end();
    return;
  }

  // Validação de segurança de origem
  if (!validateOrigin(req, res)) {
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // 1. Endpoint: GET /api/v1/pending -> Retorna os eventos pendentes na fila
  if (req.method === 'GET' && url.pathname === '/api/v1/pending') {
    writeJson(res, 200, eventQueue);
    return;
  }

  // 2. Endpoint: GET /api/v1/consume -> Retorna os eventos e limpa a fila imediatamente (polling do QML)
  if (req.method === 'GET' && url.pathname === '/api/v1/consume') {
    pluginPollCount++;
    pluginLastSeen = new Date().toISOString();

    const pending = [...eventQueue];
    eventQueue = [];
    if (pending.length > 0) {
      eventsConsumed += pending.length;
      console.log(`[Find Chord Bridge] Fila consumida por polling. (${pending.length} evento(s) removido(s))`);
    }
    writeJson(res, 200, pending);
    return;
  }

  // 3. Endpoint: POST /api/v1/send -> Envia um novo evento harmônico via HTTP
  if (req.method === 'POST' && url.pathname === '/api/v1/send') {
    frontendLastSeen = new Date().toISOString();
    let body = '';
    let exceeded = false;

    req.on('data', chunk => {
      if (exceeded) return;
      body += chunk.toString();
      // Limite de payload de 128KB (Sprint A)
      if (body.length > 131072) {
        exceeded = true;
        eventsRejected++;
        writeJson(res, 413, { error: 'Payload muito grande. Máximo de 128KB permitido.' });
        req.destroy();
      }
    });

    req.on('end', () => {
      if (exceeded) return;
      try {
        const payload = JSON.parse(body);
        if (!payload.type || !payload.data) {
          eventsRejected++;
          writeJson(res, 400, { error: 'Payload inválido. Necessita de "type" e "data".' });
          return;
        }

        handleNewEvent(payload);
        writeJson(res, 200, { status: 'success', queued: eventQueue.length });
      } catch (e) {
        eventsRejected++;
        writeJson(res, 400, { error: 'JSON malformado.' });
      }
    });
    return;
  }

  // 4. Endpoint: POST /api/v1/clear -> Limpa a fila
  if (req.method === 'POST' && url.pathname === '/api/v1/clear') {
    frontendLastSeen = new Date().toISOString();
    eventQueue = [];
    console.log('[Find Chord Bridge] Fila de eventos redefinida.');
    writeJson(res, 200, { status: 'success', message: 'Fila limpa' });
    return;
  }

  // 5. Endpoint: POST /api/v1/log -> Recebe logs e diagnostics do QML
  if (req.method === 'POST' && url.pathname === '/api/v1/log') {
    pluginLastSeen = new Date().toISOString();
    let body = '';
    let exceeded = false;

    req.on('data', chunk => {
      if (exceeded) return;
      body += chunk.toString();
      if (body.length > 131072) {
        exceeded = true;
        eventsRejected++;
        writeJson(res, 413, { error: 'Payload de log muito grande.' });
        req.destroy();
      }
    });

    req.on('end', () => {
      if (exceeded) return;
      try {
        const payload = JSON.parse(body);
        const fs = require('fs');
        const path = require('path');
        const logFilePath = path.join(__dirname, '..', 'musescore_bridge.log');
        const timeStr = new Date().toISOString();
        const logLine = `[${timeStr}] [QML-LOG] ${payload.message}\n`;
        fs.appendFileSync(logFilePath, logLine);
        console.log(`[Find Chord Bridge] QML Log: ${payload.message}`);
        writeJson(res, 200, { status: 'success' });
      } catch (e) {
        writeJson(res, 400, { error: e.message });
      }
    });
    return;
  }

  // 6. Endpoint: GET /api/v1/status -> Telemetria e status (Sprint B.5)
  if (req.method === 'GET' && url.pathname === '/api/v1/status') {
    writeJson(res, 200, {
      apiVersion: '1.0',
      bridgeVersion: '1.0',
      bridgeOnline: true,
      queueSize: eventQueue.length,
      eventsReceived,
      eventsAccepted,
      eventsRejected,
      pluginPollCount,
      pluginLastSeen,
      frontendLastSeen
    });
    return;
  }

  // 7. Endpoint: GET /api/v1/health -> Health Check básico (Sprint B.5)
  if (req.method === 'GET' && url.pathname === '/api/v1/health') {
    writeJson(res, 200, {
      status: 'ok',
      uptime: process.uptime()
    });
    return;
  }

  // Rota não encontrada
  writeJson(res, 404, { error: 'Rota não encontrada' });
});

// Trata um novo evento harmônico e propaga para conexões ativas
let eventsConsumed = 0;
let eventsDropped = 0;

function handleNewEvent(payload) {
  eventsReceived++;

  // Criação da estrutura canônica versionada com UUID e timestamp (Sprint A)
  const event = {
    version: payload.version || '1.0',
    type: payload.type,
    id: payload.id || `evt_${crypto.randomBytes(8).toString('hex')}`,
    timestamp: payload.timestamp || Math.floor(Date.now() / 1000),
    state: payload.state || 'pending', // Preparado para o Reliable Delivery ACK
    data: payload.data
  };

  eventsAccepted++;
  eventQueue.push(event);
  console.log(`[Find Chord Bridge] Evento enfileirado [${event.type.toUpperCase()}] ID: ${event.id}`);
  
  // Limita o tamanho da fila para evitar consumo excessivo de memória
  if (eventQueue.length > 50) {
    eventQueue.shift();
    eventsDropped++;
    console.log('[Find Chord Bridge] Fila cheia. Descartando evento mais antigo (FIFO).');
  }

  // Propaga o evento via WebSocket para clientes conectados
  const messageStr = JSON.stringify(event);
  const frame = encodeWebSocketFrame(messageStr);
  activeSockets.forEach(socket => {
    try {
      socket.write(frame);
    } catch (e) {
      activeSockets.delete(socket);
    }
  });
}

// WebSocket: Handshake Upgrade
server.on('upgrade', (req, socket, head) => {
  // Validação do Origin para WebSocket
  const origin = req.headers['origin'];
  if (origin) {
    const isValidOrigin = /^https?:\/\/(localhost|127\.0\.0\.1):(5173|5174)$/.test(origin);
    if (!isValidOrigin) {
      console.warn(`[Find Chord Bridge] Bloqueado upgrade WS de origem não autorizada: ${origin}`);
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }
  }

  // Gera o hash de aceitação do WebSocket
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }

  const acceptValue = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${acceptValue}\r\n\r\n`
  );

  activeSockets.add(socket);
  frontendLastSeen = new Date().toISOString();
  console.log(`[Find Chord Bridge] Novo cliente WebSocket conectado. Total ativos: ${activeSockets.size}`);

  let bufferAccumulator = Buffer.alloc(0);

  socket.on('data', data => {
    bufferAccumulator = Buffer.concat([bufferAccumulator, data]);

    while (bufferAccumulator.length >= 2) {
      const decoded = decodeWebSocketFrame(bufferAccumulator);
      if (!decoded) {
        break; // Aguardando mais dados do buffer
      }

      // Avança o acumulador de buffer
      const consumedLength = bufferAccumulator.length - (bufferAccumulator.length - getFrameLength(bufferAccumulator));
      bufferAccumulator = bufferAccumulator.slice(consumedLength);

      if (decoded.type === 'close') {
        activeSockets.delete(socket);
        socket.destroy();
        console.log(`[Find Chord Bridge] Cliente desconectado. Total ativos: ${activeSockets.size}`);
        break;
      }

      if (decoded.type === 'text') {
        try {
          const payload = JSON.parse(decoded.data);
          handleNewEvent(payload);
        } catch (e) {
          console.warn('[Find Chord Bridge] WebSocket recebeu mensagem não-JSON:', decoded.data);
        }
      }
    }
  });

  socket.on('close', () => {
    activeSockets.delete(socket);
    console.log(`[Find Chord Bridge] Cliente desconectado. Total ativos: ${activeSockets.size}`);
  });

  socket.on('error', () => {
    activeSockets.delete(socket);
    socket.destroy();
  });
});

// Decodifica frames de texto de cliente mascarados (RFC 6455)
function decodeWebSocketFrame(buffer) {
  const secondByte = buffer[1];
  const isMasked = (secondByte & 0x80) !== 0;
  let payloadLength = secondByte & 0x7F;
  
  let offset = 2;
  if (payloadLength === 126) {
    if (buffer.length < 4) return null;
    payloadLength = buffer.readUInt16BE(2);
    offset = 4;
  } else if (payloadLength === 127) {
    if (buffer.length < 10) return null;
    payloadLength = buffer.readUInt32BE(6);
    offset = 10;
  }
  
  if (!isMasked) return null;
  if (buffer.length < offset + 4 + payloadLength) return null;

  const maskKey = buffer.slice(offset, offset + 4);
  const payload = buffer.slice(offset + 4, offset + 4 + payloadLength);
  
  const decoded = Buffer.alloc(payloadLength);
  for (let i = 0; i < payloadLength; i++) {
    decoded[i] = payload[i] ^ maskKey[i % 4];
  }
  
  const firstByte = buffer[0];
  const opcode = firstByte & 0x0F;
  if (opcode === 8) return { type: 'close' };
  
  return { type: 'text', data: decoded.toString('utf8') };
}

function getFrameLength(buffer) {
  const secondByte = buffer[1];
  let payloadLength = secondByte & 0x7F;
  let offset = 2;
  if (payloadLength === 126) {
    payloadLength = buffer.readUInt16BE(2);
    offset = 4;
  } else if (payloadLength === 127) {
    payloadLength = buffer.readUInt32BE(6);
    offset = 10;
  }
  const isMasked = (secondByte & 0x80) !== 0;
  return offset + (isMasked ? 4 : 0) + payloadLength;
}

function encodeWebSocketFrame(text) {
  const payload = Buffer.from(text, 'utf8');
  const len = payload.length;
  let header;
  
  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81;
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeUInt32BE(0, 2);
    header.writeUInt32BE(len, 6);
  }
  
  return Buffer.concat([header, payload]);
}

// Inicializa o Servidor
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` 📡 FIND CHORD LOCAL INTEGRATION BRIDGE SERVER      `);
  console.log(`====================================================`);
  console.log(`➜  Porta: http://localhost:${PORT}`);
  console.log(`➜  WebSocket: ws://localhost:${PORT}`);
  console.log(`➜  Endpoints de Polling (v1):`);
  console.log(`   - GET  /api/v1/pending  (Exibe fila atual)`);
  console.log(`   - GET  /api/v1/consume  (Consome e limpa a fila)`);
  console.log(`   - POST /api/v1/send     (Envia um novo evento)`);
  console.log(`   - GET  /api/v1/status   (Métricas de telemetria)`);
  console.log(`====================================================`);
});
