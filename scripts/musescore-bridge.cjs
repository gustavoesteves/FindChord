const http = require('http');
const crypto = require('crypto');
const { WebSocketServer, WebSocket } = require('ws');

const PORT = 9000;
const HOST = '127.0.0.1';
const MAX_HTTP_BODY_BYTES = 131072;
const MAX_SCORE_BODY_BYTES = 524288;
const MAX_WS_PAYLOAD_BYTES = 65536;
const DASHBOARD_PATH = '/dashboard';
const PLUGIN_PATH = '/plugin';
const PLUGIN_HTTP_PATHS = new Set([
  '/api/v1/plugin-session',
  '/api/v1/consume',
  '/api/v1/log',
  '/api/v1/score'
]);
const sessionId = crypto.randomUUID();
const dashboardToken = crypto.randomBytes(24).toString('hex');
const pluginToken = crypto.randomBytes(24).toString('hex');
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
    'Access-Control-Allow-Headers': 'Content-Type, X-FindChord-Client, X-FindChord-Session, X-FindChord-Plugin-Token'
  });
  res.end(JSON.stringify(data));
}

// Validação de Origem e Cabeçalho do Cliente (Sprint A)
function isValidDashboardOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1):(5173|5174)$/.test(origin);
}

function validateOrigin(req, res, url) {
  const origin = req.headers['origin'];
  if (!origin) {
    if (PLUGIN_HTTP_PATHS.has(url.pathname) || url.pathname === '/api/v1/health') {
      return true;
    }

    eventsRejected++;
    writeJson(res, 403, { error: 'Origem ausente para endpoint de dashboard.' });
    return false;
  }

  if (origin) {
    // Permite portas do dev server (5173/5174) de localhost ou loopback
    const isValidOrigin = isValidDashboardOrigin(origin);
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

function timingSafeEqualString(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function validatePluginToken(req, res) {
  const token = req.headers['x-findchord-plugin-token'] || new URL(req.url, `http://localhost:${PORT}`).searchParams.get('token');
  if (!timingSafeEqualString(token, pluginToken)) {
    eventsRejected++;
    writeJson(res, 403, { error: 'Token do plugin ausente ou invalido.' });
    return false;
  }
  return true;
}

function validateDashboardToken(req, res, url) {
  if (url.pathname === '/api/v1/session') return true;
  if (PLUGIN_HTTP_PATHS.has(url.pathname) || url.pathname === '/api/v1/health') return true;

  const token = req.headers['x-findchord-session'] || url.searchParams.get('token');
  if (!timingSafeEqualString(token, dashboardToken)) {
    eventsRejected++;
    writeJson(res, 403, { error: 'Sessao de dashboard ausente ou invalida.' });
    return false;
  }
  return true;
}

// Create HTTP Server
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-FindChord-Client, X-FindChord-Session, X-FindChord-Plugin-Token'
    });
    res.end();
    return;
  }

  // Validação de segurança de origem
  if (!validateOrigin(req, res, url)) {
    return;
  }

  if (!validateDashboardToken(req, res, url)) {
    return;
  }

  if (PLUGIN_HTTP_PATHS.has(url.pathname) && url.pathname !== '/api/v1/plugin-session' && !validatePluginToken(req, res)) {
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/v1/session') {
    frontendLastSeen = new Date().toISOString();
    writeJson(res, 200, {
      sessionId,
      dashboardToken,
      wsEndpoint: `ws://${HOST}:${PORT}${DASHBOARD_PATH}?session=${sessionId}&token=${dashboardToken}`
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/v1/plugin-session') {
    pluginLastSeen = new Date().toISOString();
    writeJson(res, 200, {
      sessionId,
      pluginToken
    });
    return;
  }

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
      if (body.length > MAX_HTTP_BODY_BYTES) {
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
        if (!payload.type && !payload.protocolVersion) {
          eventsRejected++;
          writeJson(res, 400, { error: 'Payload inválido. Necessita ser um evento ou BridgeMessage.' });
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
      if (body.length > MAX_HTTP_BODY_BYTES) {
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

  // 6. Endpoint: POST /api/v1/score -> Recebe eventos de Cifras e Notas do QML
  if (req.method === 'POST' && url.pathname === '/api/v1/score') {
    frontendLastSeen = new Date().toISOString();
    pluginLastSeen = new Date().toISOString();
    let body = '';
    let exceeded = false;

    req.on('data', chunk => {
      if (exceeded) return;
      body += chunk.toString();
      if (body.length > MAX_SCORE_BODY_BYTES) {
        exceeded = true;
        eventsRejected++;
        writeJson(res, 413, { error: 'Payload de score muito grande.' });
        req.destroy();
      }
    });

    req.on('end', () => {
      if (exceeded) return;
      try {
        const payload = JSON.parse(body);

        // --- FILE BRIDGE INTERCEPTION ---
        if (payload.action === "PARSE_XML" && payload.path) {
          const fs = require('fs');
          if (!fs.existsSync(payload.path)) {
            writeJson(res, 404, { error: 'Arquivo XML temporário não encontrado.' });
            return;
          }

          const xmlData = fs.readFileSync(payload.path, 'utf8');
          const { parseMusicXML } = require('./musicxml-parser.cjs');
          
          let parsedScore;
          try {
            parsedScore = parseMusicXML(xmlData);
          } catch (err) {
            writeJson(res, 500, { error: 'Failed to parse MusicXML: ' + err.message });
            return;
          }

          console.log(`[Find Chord Bridge] File Bridge: parsed ${parsedScore.harmonies.length} chords and ${parsedScore.notes.length} notes from MusicXML.`);
          
          const snapshotForFrontend = {
            ...parsedScore,
            notes: parsedScore.notes
          };

          const scoreMessage = {
            protocolVersion: "1.0",
            messageType: "SESSION",
            payload: { type: "SCORE_SNAPSHOT", data: snapshotForFrontend }
          };

          const messageStr = JSON.stringify(scoreMessage);
          wss.clients.forEach((client) => {
            if (client.role === 'dashboard' && client.readyState === WebSocket.OPEN) {
              client.send(messageStr);
            }
          });

          writeJson(res, 200, { status: 'success', parsedChords: parsedScore.harmonies.length, parsedNotes: parsedScore.notes.length });
          return;
        }
        // --- END FILE BRIDGE ---

        console.log(`[Find Chord Bridge] Recebido ScoreSnapshot do QML via HTTP (${payload.harmonies?.length || 0} acordes).`);
        
        const scoreMessage = {
          protocolVersion: "1.0",
          messageType: "SESSION",
          payload: { type: "SCORE_SNAPSHOT", data: payload }
        };

        const messageStr = JSON.stringify(scoreMessage);
        wss.clients.forEach((client) => {
          if (client.role === 'dashboard' && client.readyState === WebSocket.OPEN) {
            client.send(messageStr);
          }
        });
        
        writeJson(res, 200, { status: 'success', broadcastedTo: wss.clients.size });
      } catch (e) {
        eventsRejected++;
        writeJson(res, 400, { error: 'Falha no processamento do ScoreSnapshot.', details: e.message });
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
      sessionId,
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
    if (client.role === 'plugin' && client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// WebSocket Server integrado ao HTTP
const wss = new WebSocketServer({ server, maxPayload: MAX_WS_PAYLOAD_BYTES });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const isPlugin = url.pathname === PLUGIN_PATH;
  const isDashboard = url.pathname === DASHBOARD_PATH;

  if (!isPlugin && !isDashboard) {
    ws.close(1008, 'Caminho WebSocket não autorizado');
    return;
  }

  // Validação do Origin
  const origin = req.headers['origin'];
  if (isDashboard && (!origin || !isValidDashboardOrigin(origin))) {
    ws.close(1008, 'Origem não autorizada');
    return;
  }
  if (isPlugin && origin && !isValidDashboardOrigin(origin)) {
    ws.close(1008, 'Origem não autorizada');
    return;
  }

  if (url.searchParams.get('session') !== sessionId) {
    ws.close(1008, 'Sessao invalida');
    return;
  }
  if (isDashboard && !timingSafeEqualString(url.searchParams.get('token'), dashboardToken)) {
    ws.close(1008, 'Token de dashboard invalido');
    return;
  }
  if (isPlugin && !timingSafeEqualString(url.searchParams.get('token'), pluginToken)) {
    ws.close(1008, 'Token de plugin invalido');
    return;
  }

  if (isPlugin) {
    ws.role = 'plugin';
    pluginLastSeen = new Date().toISOString();
    console.log(`[Find Chord Bridge] Plugin WS conectado. Total: ${wss.clients.size}`);
  } else {
    ws.role = 'dashboard';
    frontendLastSeen = new Date().toISOString();
    console.log(`[Find Chord Bridge] Dashboard WS conectado. Total: ${wss.clients.size}`);
  }

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      const messageStr = JSON.stringify(message);
      if (!isPlugin) {
        wss.clients.forEach((client) => {
          if (client !== ws && client.role === 'plugin' && client.readyState === WebSocket.OPEN) {
            client.send(messageStr);
          }
        });
        eventQueue.push(message);
        if (eventQueue.length > 50) eventQueue.shift();
      } else {
        wss.clients.forEach((client) => {
          if (client !== ws && client.role === 'dashboard' && client.readyState === WebSocket.OPEN) {
            client.send(messageStr);
          }
        });
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
server.listen(PORT, HOST, () => {
  console.log(`====================================================`);
  console.log(` 📡 FIND CHORD LOCAL INTEGRATION BRIDGE SERVER      `);
  console.log(`====================================================`);
  console.log(`➜  Porta: http://${HOST}:${PORT}`);
  console.log(`➜  WebSocket: ws://${HOST}:${PORT}`);
  console.log(`➜  Endpoints de Polling (v1):`);
  console.log(`   - GET  /api/v1/pending  (Exibe fila atual)`);
  console.log(`   - GET  /api/v1/consume  (Consome e limpa a fila)`);
  console.log(`   - POST /api/v1/send     (Envia um novo evento)`);
  console.log(`   - GET  /api/v1/status   (Métricas de telemetria)`);
  console.log(`====================================================`);
});
