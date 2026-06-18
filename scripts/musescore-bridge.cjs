const http = require('http');
const crypto = require('crypto');
const { WebSocketServer, WebSocket } = require('ws');

const PORT = 9000;
let eventQueue = [];

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

  // 6. Endpoint: POST /api/v1/score -> Recebe ScoreSnapshot estruturado do QML (Legado / Fallback)
  if (req.method === 'POST' && url.pathname === '/api/v1/score') {
    pluginLastSeen = new Date().toISOString();
    let body = '';
    let exceeded = false;

    req.on('data', chunk => {
      if (exceeded) return;
      body += chunk.toString();
      if (body.length > 1048576) { // 1MB limite para partituras grandes
        exceeded = true;
        eventsRejected++;
        writeJson(res, 413, { error: 'Payload de partitura muito grande.' });
        req.destroy();
      }
    });

    req.on('end', () => {
      if (exceeded) return;
      try {
        const payload = JSON.parse(body);
        console.log(`[Find Chord Bridge] Recebido ScoreSnapshot do QML via HTTP (${payload.harmonies?.length || 0} acordes).`);
        
        // Wrap num BridgeMessage e retransmite via WS
        const scoreMessage = {
          protocolVersion: "1.0",
          messageType: "SESSION",
          payload: {
            type: "SCORE_SNAPSHOT",
            data: payload
          }
        };
        broadcastMessage(scoreMessage);
        
        writeJson(res, 200, { status: 'success' });
      } catch (e) {
        writeJson(res, 400, { error: 'JSON malformado.' });
      }
    });
    return;
  }

  // 7. Endpoint: GET /api/v1/status -> Telemetria e status (Sprint B.5)
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

  // 8. Endpoint: GET /api/v1/health -> Health Check básico (Sprint B.5)
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

  // Wrap em BridgeMessage
  const bridgeMessage = {
    protocolVersion: payload.protocolVersion || '1.0',
    messageType: payload.messageType || 'RENDER',
    payload: payload.payload || payload
  };

  eventsAccepted++;
  eventQueue.push(bridgeMessage);
  console.log(`[Find Chord Bridge] HTTP Evento enfileirado [${bridgeMessage.messageType}]`);
  
  if (eventQueue.length > 50) {
    eventQueue.shift();
    eventsDropped++;
    console.log('[Find Chord Bridge] Fila cheia. Descartando evento mais antigo (FIFO).');
  }

  broadcastMessage(bridgeMessage);
}

function broadcastMessage(message) {
  const messageStr = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// WebSocket Server integrado ao HTTP
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  // Validação do Origin
  const origin = req.headers['origin'];
  if (origin) {
    const isValidOrigin = /^https?:\/\/(localhost|127\.0\.0\.1):(5173|5174)$/.test(origin);
    if (!isValidOrigin && !req.url.includes('/plugin')) {
      // Se não for o origin válido e não for a rota do plugin (que pode não ter origin)
      ws.close(1008, 'Origem não autorizada');
      return;
    }
  }

  const isPlugin = req.url.includes('/plugin');
  if (isPlugin) {
    pluginLastSeen = new Date().toISOString();
    console.log(`[Find Chord Bridge] Plugin WS conectado. Total: ${wss.clients.size}`);
  } else {
    frontendLastSeen = new Date().toISOString();
    console.log(`[Find Chord Bridge] Dashboard WS conectado. Total: ${wss.clients.size}`);
  }

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      // Re-broadcast (Fan-out) para os outros clientes, exceto o sender
      const messageStr = JSON.stringify(message);
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      });
      // Também adiciona à fila HTTP fallback se for direcionado ao plugin
      if (!isPlugin) {
        eventQueue.push(message);
        if (eventQueue.length > 50) eventQueue.shift();
      }
    } catch (e) {
      console.warn('[Find Chord Bridge] WS message parse error:', e.message);
    }
  });

  ws.on('close', () => {
    console.log(`[Find Chord Bridge] WS desconectado. Total: ${wss.clients.size}`);
  });
});


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
