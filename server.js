require('dotenv').config();

const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mqtt = require('mqtt');

// ---------- Konfigurasi Default dari .env ----------
let mqttConfig = {
  url: process.env.MQTT_URL || 'mqtt://mqtt-cleen.ptpjb.com',
  port: parseInt(process.env.MQTT_PORT || '1883', 10),
  username: process.env.MQTT_USERNAME || '',
  password: process.env.MQTT_PASSWORD || '',
  topics: [(process.env.MQTT_TOPIC || 'KPPJBS/PLTD_Suppa/#').trim()],
};

const PORT = parseInt(process.env.PORT || '3000', 10);

// Parameter yang dikenali beserta satuannya (Main & System Parameters)
const PARAM_META = {
  // Main Parameters
  Active_Power: { label: 'Active Power', unit: 'kW', group: 'main' },
  Reactive_Power: { label: 'Reactive Power', unit: 'kVAR', group: 'main' },
  Generator_Current: { label: 'Generator Current', unit: 'A', group: 'main' },
  Engine_Speed: { label: 'Engine Speed', unit: 'RPM', group: 'main' },

  // System Parameters: Pressure (bar) - Angka terakhir adalah desimal (/ 10)
  'fuel oil inlet press 101PT': { label: 'Fuel Oil Inlet Press', unit: 'bar', group: 'system', type: 'pressure', tag: '101PT' },
  'lube oil inlet press 201PT': { label: 'Lube Oil Inlet Press', unit: 'bar', group: 'system', type: 'pressure', tag: '201PT' },
  'HT-water inlet press 401PT': { label: 'HT-Water Inlet Press', unit: 'bar', group: 'system', type: 'pressure', tag: '401PT' },
  'LT-water inlet press 451PT': { label: 'LT-Water Inlet Press', unit: 'bar', group: 'system', type: 'pressure', tag: '451PT' },
  'starting air press 301PT': { label: 'Starting Air Press', unit: 'bar', group: 'system', type: 'pressure', tag: '301PT' },
  'charge air press A 601PT_1': { label: 'Charge Air Press A', unit: 'bar', group: 'system', type: 'pressure', tag: '601PT_1' },

  // System Parameters: Temperature (°C)
  'HT water inlet temp 401TE': { label: 'HT Water Inlet Temp', unit: '°C', group: 'system', type: 'temp', tag: '401TE' },
  'HT water outlet temp 401TE': { label: 'HT Water Outlet Temp', unit: '°C', group: 'system', type: 'temp', tag: '401TE' },
  'lube oil inlet temp 201TE': { label: 'Lube Oil Inlet Temp', unit: '°C', group: 'system', type: 'temp', tag: '201TE' },
  'fuel oil inlet temp 101TE': { label: 'Fuel Oil Inlet Temp', unit: '°C', group: 'system', type: 'temp', tag: '101TE' },
};

// 6 Unit DG-SET Resmi
const ALLOWED_UNITS = ['Unit1', 'Unit2', 'Unit3', 'Unit4', 'Unit5', 'Unit6'];

// Cache nilai terakhir: { "Unit1": { "Active_Power": {value, timestamp}, ... }, ... }
const latestData = {};
ALLOWED_UNITS.forEach(u => { latestData[u] = {}; });

// ---------- HTTP + Socket.io ----------
const app = express();
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware: header iframe & CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Frame-Options', 'ALLOW-FROM https://sites.google.com');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://sites.google.com https://*.googleusercontent.com");
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// ---------- MQTT Client Manager ----------
let client = null;
let mqttConnected = false;
let mqttLastError = null;

function broadcastStatus(status, errorMsg = null) {
  mqttConnected = status;
  mqttLastError = errorMsg;
  io.emit('mqtt-status', {
    connected: status,
    broker: `${mqttConfig.url}:${mqttConfig.port}`,
    topics: mqttConfig.topics,
    error: errorMsg,
  });
}

function simplify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findNormalizedParam(rawParam) {
  if (!rawParam) return null;
  const pSimp = simplify(rawParam);

  // 1. Direct / exact simplified match
  for (const p of Object.keys(PARAM_META)) {
    if (simplify(p) === pSimp) return p;
  }

  // 2. Pressure parameters matching
  if (pSimp.includes('101pt') || (pSimp.includes('fuel') && pSimp.includes('press'))) {
    return 'fuel oil inlet press 101PT';
  }
  if (pSimp.includes('201pt') || (pSimp.includes('lube') && pSimp.includes('press'))) {
    return 'lube oil inlet press 201PT';
  }
  if (pSimp.includes('301pt') || pSimp.includes('startair') || pSimp.includes('startingair') || (pSimp.includes('start') && pSimp.includes('air'))) {
    return 'starting air press 301PT';
  }
  if (pSimp.includes('601pt') || pSimp.includes('chargeair') || (pSimp.includes('charge') && pSimp.includes('air'))) {
    return 'charge air press A 601PT_1';
  }
  if (pSimp.includes('451pt') || (pSimp.includes('lt') && (pSimp.includes('press') || pSimp.includes('water')) && pSimp.includes('press'))) {
    return 'LT-water inlet press 451PT';
  }
  if (pSimp.includes('401pt') || (pSimp.includes('ht') && (pSimp.includes('press') || pSimp.includes('water')) && pSimp.includes('press'))) {
    return 'HT-water inlet press 401PT';
  }

  // 3. Temperature parameters matching
  if (pSimp.includes('201te') || (pSimp.includes('lube') && pSimp.includes('temp'))) {
    return 'lube oil inlet temp 201TE';
  }
  if (pSimp.includes('101te') || (pSimp.includes('fuel') && pSimp.includes('temp'))) {
    return 'fuel oil inlet temp 101TE';
  }
  if ((pSimp.includes('ht') && pSimp.includes('outlet')) || pSimp.includes('402te')) {
    return 'HT water outlet temp 401TE';
  }
  if (pSimp.includes('401te') || (pSimp.includes('ht') && (pSimp.includes('cooling') || pSimp.includes('temp') || pSimp.includes('water')) && pSimp.includes('temp'))) {
    return 'HT water inlet temp 401TE';
  }

  // 4. Main parameters match
  if (pSimp.includes('activepower') || pSimp.includes('actpower') || pSimp === 'kw') return 'Active_Power';
  if (pSimp.includes('reactivepower') || pSimp.includes('reactpower') || pSimp === 'kvar') return 'Reactive_Power';
  if (pSimp.includes('generatorcurrent') || (pSimp.includes('current') && !pSimp.includes('press')) || pSimp === 'ampere') return 'Generator_Current';
  if (pSimp.includes('enginespeed') || pSimp.includes('speed') || pSimp.includes('rpm')) return 'Engine_Speed';

  return null;
}

function formatBrokerUrl(rawUrl, defaultPort = 1883) {
  if (!rawUrl) return `mqtt://localhost:${defaultPort}`;
  let clean = rawUrl.trim().replace(/\/+$/, '');

  let protocol = 'mqtt://';
  const matchProto = clean.match(/^([a-zA-Z0-9]+:\/\/)/);
  if (matchProto) {
    protocol = matchProto[1];
    clean = clean.replace(matchProto[1], '');
  }

  let host = clean;
  let port = defaultPort;

  const portMatch = clean.match(/:(\d+)$/);
  if (portMatch) {
    port = parseInt(portMatch[1], 10);
    host = clean.replace(/:(\d+)$/, '');
  }

  return `${protocol}${host}:${port}`;
}

function initMqttClient() {
  if (client) {
    try {
      client.removeAllListeners();
      client.end(true);
    } catch (e) {
      console.error('[MQTT] Error closing previous client:', e.message);
    }
  }

  const brokerUrl = formatBrokerUrl(mqttConfig.url, mqttConfig.port || 1883);
  
  // Force IPv4 untuk kompatibilitas dengan Railway (beberapa broker hanya listen di IPv4)
  const options = {
    username: mqttConfig.username || undefined,
    password: mqttConfig.password || undefined,
    reconnectPeriod: 2000,          // Reconnect lebih cepat
    connectTimeout: 30000,          // Timeout 30 detik untuk jaringan lambat
    cleanSession: true,
    keepalive: 60,                  // Keepalive setiap 60 detik
    reschedulePings: false,         // Gunakan default pinging
    protocolId: 'MQTT',
    protocolVersion: 4,             // MQTT 3.1.1
    family: 4                       // ⭐️ FORCE IPv4 ONLY (fixes Railway DNS issue)
  };

  console.log(`[MQTT] Menghubungkan ke ${brokerUrl}`);
  console.log(`[MQTT] Options: Username=${mqttConfig.username || 'Anonymous'}, IPv4 only=${options.family === 4}, Timeout=${options.connectTimeout}ms`);
  if (mqttConfig.password) {
    console.log(`[MQTT] Password akan digunakan untuk autentikasi`);
  }

  try {
    client = mqtt.connect(brokerUrl, options);

    client.on('connect', () => {
      console.log(`[MQTT] Berhasil terhubung ke ${brokerUrl}`);
      broadcastStatus(true);
      
      const allSubscriptions = new Set(mqttConfig.topics.map(t => t.trim()));
      allSubscriptions.add('KPPJBS/PLTD_Suppa/#');
      allSubscriptions.add('KPPJBS/PLTD_Suppa/+/+');
      allSubscriptions.add('KPPJBS/PLTD_Suppa/+/+/+');

      for (let i = 1; i <= 6; i++) {
        allSubscriptions.add(`KPPJBS/PLTD_Suppa/Unit${i}/#`);
        allSubscriptions.add(`KPPJBS/PLTD_Suppa/Unit ${i}/#`);
        allSubscriptions.add(`KPPJBS/PLTD_Suppa/unit${i}/#`);
      }

      allSubscriptions.forEach((topic) => {
        client.subscribe(topic, (err) => {
          if (err) {
            console.error(`[MQTT] Gagal subscribe ke ${topic}:`, err.message);
          } else {
            console.log(`[MQTT] Subscribed: ${topic}`);
          }
        });
      });
    });

    client.on('reconnect', () => {
      console.log('[MQTT] Mencoba koneksi ulang ke broker...');
    });

    client.on('offline', () => {
      console.log('[MQTT] Broker offline (network disconnected)');
      broadcastStatus(false, 'Broker offline');
    });

    client.on('close', () => {
      console.log('[MQTT] Koneksi broker terputus');
      broadcastStatus(false);
    });

    client.on('error', (err) => {
      // Log detail error ke console Railway
      console.error('[MQTT] ========== ERROR DETAIL ==========');
      console.error('[MQTT] Error code:', err.code || 'N/A');
      console.error('[MQTT] Error errno:', err.errno || 'N/A');
      console.error('[MQTT] Error message:', err.message);
      console.error('[MQTT] Error stack:', err.stack ? err.stack.split('\n')[0] : 'N/A');
      console.error('[MQTT] ================================');
      
      let userFriendlyError = err.message;
      let diagnosis = '';
      
      if (err.code === 'ENOTFOUND') {
        userFriendlyError = `Domain broker tidak dapat dijangkau oleh server (DNS ENOTFOUND).`;
        diagnosis = `DNS resolution gagal. Kemungkinan: (1) nama host salah, (2) broker tidak accessible dari public internet, (3) DNS server issue.`;
      } else if (err.code === 'ECONNREFUSED') {
        userFriendlyError = `Koneksi ditolak oleh broker pada port ${mqttConfig.port || 1883} (ECONNREFUSED).`;
        diagnosis = `Broker tidak listening di IP:port tersebut, atau firewall memblokir koneksi.`;
      } else if (err.code === 'ETIMEDOUT' || err.code === 'EHOSTUNREACH') {
        userFriendlyError = `Koneksi timeout ke broker (${mqttConfig.url}:${mqttConfig.port}).`;
        diagnosis = `Jaringan tidak dapat mencapai broker. Kemungkinan firewall, whitelist IP, atau broker hanya accessible dari jaringan internal.`;
      } else if (err.message.includes('Not authorized')) {
        userFriendlyError = `Autentikasi MQTT gagal (username/password salah).`;
        diagnosis = `Pastikan MQTT_USERNAME dan MQTT_PASSWORD di Railway sesuai dengan broker.`;
      } else if (err.message.includes('getaddrinfo')) {
        userFriendlyError = `Gagal resolve DNS untuk ${mqttConfig.url}.`;
        diagnosis = `DNS lookup gagal. Coba gunakan IP address langsung atau pastikan DNS server accessible.`;
      } else {
        diagnosis = `Error tidak dikenali. Periksa log Railway untuk detail lengkap.`;
      }
      
      console.log(`[MQTT] Diagnosis: ${diagnosis}`);
      broadcastStatus(false, userFriendlyError);
    });

    client.on('message', (topic, message) => {
      // Format: [Prefix]/PLTD_Suppa/UnitX/Parameter
      const parts = topic.split('/');
      if (parts.length < 3) return;

      let rawUnit = '';
      let rawParam = '';

      // Cari segmen Unit1 s/d Unit6
      for (let i = 0; i < parts.length; i++) {
        const uMatch = parts[i].trim().match(/^unit\s*([1-6])$/i);
        if (uMatch) {
          rawUnit = 'Unit' + uMatch[1];
          rawParam = parts.slice(i + 1).join('/').trim();
          break;
        }
      }

      if (!rawUnit || !rawParam) {
        if (parts.length >= 4) {
          rawUnit = parts[parts.length - 2].trim();
          rawParam = parts[parts.length - 1].trim();
        } else if (parts.length === 3) {
          rawUnit = parts[1].trim();
          rawParam = parts[2].trim();
        }
      }

      const unitMatch = rawUnit.match(/unit\s*([1-6])/i);
      if (!unitMatch) return;
      const unit = 'Unit' + unitMatch[1];

      const normalizedParam = findNormalizedParam(rawParam);
      if (!normalizedParam) return;

      const meta = PARAM_META[normalizedParam];
      const raw = message.toString().trim();
      const parsed = parseFloat(raw);
      let value = isNaN(parsed) ? raw : parsed;

      if (value === 32768) {
        value = null; // Sentinel sensor offline
      } else if (typeof value === 'number' && meta.type === 'pressure') {
        // Untuk parameter pressure, angka terakhir merupakan angka di belakang koma (dibagi 10)
        value = parseFloat((value / 10).toFixed(2));
      }

      const entry = {
        value,
        group: meta.group,
        type: meta.type || 'standard',
        rawTopic: topic,
        timestamp: new Date().toISOString(),
      };

      if (!latestData[unit]) latestData[unit] = {};
      latestData[unit][normalizedParam] = entry;

      console.log(`[MQTT RECV] ${unit} | ${normalizedParam} = ${value} (Topic: ${topic})`);
      io.emit('data', { unit, parameter: normalizedParam, ...entry });
    });
  } catch (err) {
    console.error('[MQTT] Gagal inisialisasi client MQTT:', err.message);
    broadcastStatus(false, err.message);
  }
}

// Inisialisasi awal MQTT
initMqttClient();

// ---------- REST API Endpoints ----------
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    mqttConnected,
    mqttLastError,
    broker: `${mqttConfig.url}:${mqttConfig.port}`,
    topics: mqttConfig.topics,
    units: ALLOWED_UNITS,
    serverTime: new Date().toISOString(),
  });
});

app.get('/api/data', (req, res) => {
  res.json({
    data: latestData,
    meta: PARAM_META,
  });
});

app.get('/api/mqtt/config', (req, res) => {
  res.json({
    url: mqttConfig.url,
    port: mqttConfig.port,
    username: mqttConfig.username,
    hasPassword: Boolean(mqttConfig.password),
    topics: mqttConfig.topics,
    mqttConnected,
  });
});

app.post('/api/mqtt/config', (req, res) => {
  const { url, port, username, password, topics } = req.body;
  if (url) mqttConfig.url = url;
  if (port) mqttConfig.port = parseInt(port, 10);
  if (username !== undefined) mqttConfig.username = username;
  if (password !== undefined && password !== '') mqttConfig.password = password;
  if (Array.isArray(topics) && topics.length > 0) {
    mqttConfig.topics = topics.map(t => t.trim()).filter(Boolean);
  }

  initMqttClient();

  res.json({
    message: 'Konfigurasi MQTT berhasil diperbarui',
    config: {
      url: mqttConfig.url,
      port: mqttConfig.port,
      username: mqttConfig.username,
      topics: mqttConfig.topics,
    },
  });
});

// ---------- User Admin Hardcoded ----------
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'adip';

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ success: true, message: 'Login Admin Berhasil', role: 'admin' });
  }
  return res.status(401).json({ success: false, message: 'Username atau Password Admin salah!' });
});



// ---------- Socket.io Events ----------
io.on('connection', (socket) => {
  socket.emit('init', {
    data: latestData,
    meta: PARAM_META,
    mqttStatus: mqttConnected,
    mqttConfig: {
      url: mqttConfig.url,
      port: mqttConfig.port,
      username: mqttConfig.username,
      topics: mqttConfig.topics,
    },
  });

  socket.on('update-mqtt-config', (newConfig) => {
    console.log('[Socket] Menerima pembaruan konfigurasi MQTT dari client');
    if (newConfig.url) mqttConfig.url = newConfig.url;
    if (newConfig.port) mqttConfig.port = parseInt(newConfig.port, 10);
    if (newConfig.username !== undefined) mqttConfig.username = newConfig.username;
    if (newConfig.password !== undefined && newConfig.password !== '') mqttConfig.password = newConfig.password;
    if (Array.isArray(newConfig.topics) && newConfig.topics.length > 0) {
      mqttConfig.topics = newConfig.topics.map(t => t.trim()).filter(Boolean);
    }

    initMqttClient();

    io.emit('mqtt-config-updated', {
      url: mqttConfig.url,
      port: mqttConfig.port,
      username: mqttConfig.username,
      topics: mqttConfig.topics,
    });
  });

  socket.on('add-topic', (topic) => {
    if (!topic) return;
    const cleanTopic = topic.trim();
    if (!mqttConfig.topics.includes(cleanTopic)) {
      mqttConfig.topics.push(cleanTopic);
      if (client && client.connected) {
        client.subscribe(cleanTopic, (err) => {
          if (!err) console.log(`[MQTT] Subscribe topik baru: ${cleanTopic}`);
        });
      }
      io.emit('topics-updated', mqttConfig.topics);
    }
  });

  socket.on('remove-topic', (topic) => {
    if (!topic) return;
    const cleanTopic = topic.trim();
    mqttConfig.topics = mqttConfig.topics.filter(t => t !== cleanTopic);
    if (client && client.connected) {
      client.unsubscribe(cleanTopic, () => {
        console.log(`[MQTT] Unsubscribe topik: ${cleanTopic}`);
      });
    }
    io.emit('topics-updated', mqttConfig.topics);
  });
});

// ---------- Jalankan server ----------
server.listen(PORT, () => {
  console.log(`Dashboard backend berjalan di http://localhost:${PORT}`);
});
