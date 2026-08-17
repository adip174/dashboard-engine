#!/usr/bin/env node
/**
 * ============================================================
 * MQTT BRIDGE: Broker PJB -> HiveMQ Cloud
 * ============================================================
 * Alternatif relay untuk PC kantor (selain Node-RED)
 * Lebih sederhana, tidak butuh GUI, hanya butuh Node.js
 *
 * Cara pakai:
 *   node mqtt-bridge.js
 *   (atau setup sebagai Windows Service dengan NSSM)
 * ============================================================
 */

require('dotenv').config({ path: '.env.bridge' });

const mqtt = require('mqtt');

// Konfigurasi Broker PJB (sumber data)
const pjbConfig = {
  url: process.env.BROKER_PJB_URL || 'mqtt://mqtt-cleen.ptpjb.com',
  port: parseInt(process.env.BROKER_PJB_PORT || '1883', 10),
  username: process.env.BROKER_PJB_USERNAME || 'bbtk',
  password: process.env.BROKER_PJB_PASSWORD || 'ebtbbtk@PJB',
  topic: process.env.MQTT_TOPIC || 'KPPJBS/PLTD_Suppa/#',
};

// Konfigurasi HiveMQ Cloud (tujuan)
const hivemqConfig = {
  url: process.env.HIVEMQ_URL || `mqtts://${process.env.HIVEMQ_HOST}`,
  port: parseInt(process.env.HIVEMQ_PORT || '8883', 10),
  username: process.env.HIVEMQ_USERNAME || 'railway-dashboard',
  password: process.env.HIVEMQ_PASSWORD || 'password-yang-anda-buat',
};

console.log('='.repeat(60));
console.log('  MQTT BRIDGE: Broker PJB -> HiveMQ Cloud');
console.log('='.repeat(60));
console.log(`[PJB]  ${pjbConfig.url}:${pjbConfig.port}`);
console.log(`[HIVE] ${hivemqConfig.url}:${hivemqConfig.port}`);
console.log(`[TOPIC] ${pjbConfig.topic}`);
console.log('='.repeat(60));

let pjbClient = null;
let hivemqClient = null;
let messageCount = 0;

// Connect ke Broker PJB
function connectPJB() {
  console.log('[PJB] Connecting...');
  pjbClient = mqtt.connect(`${pjbConfig.url}:${pjbConfig.port}`, {
    username: pjbConfig.username,
    password: pjbConfig.password,
    reconnectPeriod: 5000,
    connectTimeout: 30000,
    keepalive: 60,
    family: 4, // Force IPv4
  });

  pjbClient.on('connect', () => {
    console.log('[PJB] ✅ Connected!');
    pjbClient.subscribe(pjbConfig.topic, (err) => {
      if (err) console.error('[PJB] ❌ Subscribe error:', err.message);
      else console.log(`[PJB] 📡 Subscribed to: ${pjbConfig.topic}`);
    });
  });

  pjbClient.on('error', (err) => {
    console.error('[PJB] ❌ Error:', err.message);
  });

  pjbClient.on('message', (topic, message) => {
    // Forward ke HiveMQ (topik persis sama)
    forwardToHiveMQ(topic, message);
  });
}

// Connect ke HiveMQ Cloud
function connectHiveMQ() {
  console.log('[HIVE] Connecting...');
  hivemqClient = mqtt.connect(`${hivemqConfig.url}:${hivemqConfig.port}`, {
    username: hivemqConfig.username,
    password: hivemqConfig.password,
    reconnectPeriod: 5000,
    connectTimeout: 30000,
    keepalive: 60,
    rejectUnauthorized: true, // Enforce TLS certificate validation
  });

  hivemqClient.on('connect', () => {
    console.log('[HIVE] ✅ Connected!');
  });

  hivemqClient.on('error', (err) => {
    console.error('[HIVE] ❌ Error:', err.message);
  });
}

// Forward message dari PJB ke HiveMQ
function forwardToHiveMQ(topic, message) {
  if (!hivemqClient || !hivemqClient.connected) {
    console.warn('[HIVE] ⚠️ Not connected, message dropped');
    return;
  }

  messageCount++;
  hivemqClient.publish(topic, message, { qos: 1 }, (err) => {
    if (err) {
      console.error(`[HIVE] ❌ Publish error: ${err.message}`);
    } else {
      // Log setiap 100 pesan untuk mengurangi spam
      if (messageCount % 100 === 0) {
        console.log(`[HIVE] 📤 Forwarded ${messageCount} messages (last: ${topic})`);
      }
    }
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down bridge...');
  if (pjbClient) pjbClient.end();
  if (hivemqClient) hivemqClient.end();
  process.exit(0);
});

// Start
connectPJB();
connectHiveMQ();
