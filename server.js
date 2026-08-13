require('dotenv').config();

const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mqtt = require('mqtt');

// ---------- Konfigurasi dari .env ----------
const MQTT_URL = process.env.MQTT_URL || 'mqtt://mqtt-cleen.ptpjb.com';
const MQTT_PORT = parseInt(process.env.MQTT_PORT || '1883', 10);
const MQTT_USERNAME = process.env.MQTT_USERNAME || '';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';
const MQTT_TOPIC = (process.env.MQTT_TOPIC || 'KPPJBS/PLTD_Suppa/#').trim();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Parameter yang dikenali beserta satuannya
const PARAM_META = {
  Active_Power: { label: 'Active Power', unit: 'kW' },
  Reactive_Power: { label: 'Reactive Power', unit: 'kVAR' },
  Generator_Current: { label: 'Generator Current', unit: 'A' },
  Engine_Speed: { label: 'Engine Speed', unit: 'RPM' },
};

// Cache nilai terakhir: { "Unit1": { "Active_Power": {value, timestamp}, ... }, ... }
const latestData = {};

// ---------- HTTP + Socket.io ----------
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware: header iframe HARUS sebelum static
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'ALLOW-FROM https://sites.google.com');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://sites.google.com https://*.googleusercontent.com");
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  // Kirim seluruh cache + status saat client baru terhubung
  socket.emit('init', {
    data: latestData,
    meta: PARAM_META,
    mqttStatus: mqttConnected,
  });
});

// ---------- MQTT Client ----------
const brokerUrl = `${MQTT_URL}:${MQTT_PORT}`;
const client = mqtt.connect(brokerUrl, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  reconnectPeriod: 5000,
  connectTimeout: 10000,
});

let mqttConnected = false;

function broadcastStatus(status) {
  mqttConnected = status;
  io.emit('mqtt-status', status);
}

client.on('connect', () => {
  console.log(`[MQTT] Terhubung ke ${brokerUrl}`);
  broadcastStatus(true);
  client.subscribe(MQTT_TOPIC, (err) => {
    if (err) {
      console.error('[MQTT] Gagal subscribe:', err.message);
    } else {
      console.log(`[MQTT] Subscribe: ${MQTT_TOPIC}`);
    }
  });
});

client.on('reconnect', () => console.log('[MQTT] Mencoba koneksi ulang...'));
client.on('close', () => {
  console.log('[MQTT] Koneksi terputus');
  broadcastStatus(false);
});
client.on('error', (err) => {
  console.error('[MQTT] Error:', err.message);
  broadcastStatus(false);
});

client.on('message', (topic, message) => {
  // Format topik: KPPJBS/PLTD_Suppa/UnitX/Parameter
  const parts = topic.split('/');
  if (parts.length < 4) return;

  const unit = parts[2];       // contoh: Unit1
  const parameter = parts[3];  // contoh: Active_Power

  if (!PARAM_META[parameter]) return; // abaikan parameter tidak dikenal

  const raw = message.toString().trim();
  const parsed = parseFloat(raw);
  let value = isNaN(parsed) ? raw : parsed;
  // 32768 = nilai sentinel sensor offline/invalid dari PLC -> tampilkan "--"
  if (value === 32768) value = null;
  const entry = {
    value,
    timestamp: new Date().toISOString(),
  };

  if (!latestData[unit]) latestData[unit] = {};
  latestData[unit][parameter] = entry;

  io.emit('data', { unit, parameter, ...entry });
});

// ---------- Jalankan server ----------
server.listen(PORT, () => {
  console.log(`Dashboard berjalan di http://localhost:${PORT}`);
});
