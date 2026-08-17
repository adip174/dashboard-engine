/**
 * ============================================================
 * MQTT DIAGNOSTIC TOOL - Jalankan via Railway Shell
 * ============================================================
 * Cara pakai (pilih salah satu):
 *   A) Railway Dashboard → service → Settings → aktifkan "Shell"
 *      lalu buka shell dan jalankan:  node diagnose-mqtt.js
 *   B) Railway CLI lokal:
 *        railway link
 *        railway run node diagnose-mqtt.js      (test via env Railway)
 *        railway shell → node diagnose-mqtt.js  (test DARI server Railway)
 *
 * Tool ini menguji 4 level konektivitas ke broker MQTT:
 *   1. DNS resolution (IPv4/IPv6)
 *   2. Raw TCP connect
 *   3. MQTT protocol handshake (kirim CONNECT, tunggu CONNACK)
 *   4. MQTT dengan kredensial (via library mqtt.js)
 * ============================================================
 */

const dns = require('dns').promises;
const net = require('net');
const crypto = require('crypto');
try { require('dotenv').config(); } catch (e) { /* dotenv opsional */ }

const HOST = process.env.MQTT_HOST_OVERRIDE || 'mqtt-cleen.ptpjb.com';
const PORT = parseInt(process.env.MQTT_PORT || '1883', 10);
const USERNAME = process.env.MQTT_USERNAME || '';
const PASSWORD = process.env.MQTT_PASSWORD || '';

let failures = 0;

function header(title) {
  console.log('\n==================================================');
  console.log(`  ${title}`);
  console.log('==================================================');
}

async function testDNS() {
  header('TEST 1: DNS RESOLUTION');
  try {
    const all = await dns.lookup(HOST, { all: true });
    all.forEach(a => console.log(`  ✅ ${a.address} (IPv${a.family})`));
    return all;
  } catch (e) {
    console.log(`  ❌ DNS lookup gagal: ${e.message}`);
    failures++;
    return [];
  }
}

function testTCP(addresses) {
  header('TEST 2: RAW TCP CONNECT');
  const targets = addresses.length
    ? addresses.map(a => ({ host: a.address, label: `IPv${a.family}` }))
    : [{ host: HOST, label: 'hostname' }];

  return Promise.all(targets.map(t => new Promise(resolve => {
    const start = Date.now();
    const sock = net.connect({ host: t.host, port: PORT, family: t.label === 'IPv6' ? 6 : 4 });
    sock.setTimeout(10000);
    sock.on('connect', () => {
      console.log(`  ✅ TCP connect ${t.label} (${t.host}:${PORT}) OK dalam ${Date.now() - start}ms`);
      sock.destroy();
      resolve(true);
    });
    sock.on('timeout', () => {
      console.log(`  ❌ TCP ${t.label} TIMEOUT (10s) — firewall memblokir/drop paket`);
      sock.destroy(); failures++; resolve(false);
    });
    sock.on('error', (e) => {
      console.log(`  ❌ TCP ${t.label} ERROR: ${e.code || e.message}`);
      failures++; resolve(false);
    });
  })));
}

function buildConnectPacket() {
  const proto = Buffer.from([0x00, 0x04, 0x4D, 0x51, 0x54, 0x54, 0x04]);
  const clientId = 'railway-diag-' + crypto.randomBytes(4).toString('hex');
  const cidBuf = Buffer.from(clientId, 'utf8');

  const flags = USERNAME ? 0xC2 : 0x02; // clean session + username (+password)
  const varHeader = Buffer.concat([proto, Buffer.from([flags, 0x00, 0x3C])]);

  let payload = Buffer.concat([
    Buffer.from([cidBuf.length >> 8, cidBuf.length & 0xFF]), cidBuf
  ]);
  if (USERNAME) {
    const u = Buffer.from(USERNAME, 'utf8');
    const p = Buffer.from(PASSWORD, 'utf8');
    payload = Buffer.concat([
      payload,
      Buffer.from([u.length >> 8, u.length & 0xFF]), u,
      Buffer.from([p.length >> 8, p.length & 0xFF]), p
    ]);
  }

  const remaining = varHeader.length + payload.length;
  const rl = [];
  let x = remaining;
  do { let b = x % 128; x = Math.floor(x / 128); if (x > 0) b |= 128; rl.push(b); } while (x > 0);

  return Buffer.concat([Buffer.from([0x10, ...rl]), varHeader, payload]);
}

function testMQTTHandshake() {
  header('TEST 3: MQTT PROTOCOL HANDSHAKE (manual CONNECT → CONNACK)');
  return new Promise(resolve => {
    const sock = net.connect({ host: HOST, port: PORT, family: 4 });
    sock.setTimeout(15000);
    let gotResponse = false;

    sock.on('connect', () => {
      console.log('  ✅ TCP terhubung, mengirim MQTT CONNECT...');
      sock.write(buildConnectPacket());
    });
    sock.on('data', (data) => {
      gotResponse = true;
      if (data[0] === 0x20) {
        const rc = data[3];
        const meanings = {
          0: 'Connection Accepted ✅ — broker SEHAT & autentikasi OK',
          1: 'Refused: protocol version tidak didukung',
          2: 'Refused: client identifier ditolak',
          3: 'Refused: server unavailable',
          4: 'Refused: bad username/password',
          5: 'Refused: NOT AUTHORIZED — cek kredensial'
        };
        console.log(`  ✅ CONNACK diterima! Return code: ${rc} (${meanings[rc] || 'unknown'})`);
        if (rc !== 0) failures++;
      } else {
        console.log(`  ⚠️ Broker merespon tapi bukan CONNACK standar: 0x${data[0].toString(16)}`);
      }
      sock.destroy();
      resolve(true);
    });
    sock.on('timeout', () => {
      console.log('  ❌ TIDAK ADA RESPON dalam 15 detik setelah CONNECT dikirim');
      console.log('  👉 INI POLA KHAS: firewall/DPI memfilter layer-7 berdasarkan IP sumber,');
      console.log('     atau broker menggantung koneksi dari IP eksternal (Railway).');
      failures++; sock.destroy(); resolve(false);
    });
    sock.on('error', (e) => {
      if (!gotResponse) {
        console.log(`  ❌ Error: ${e.code || e.message}`);
        failures++;
      }
      resolve(false);
    });
  });
}

function testMqttLibrary() {
  header('TEST 4: MQTT via library mqtt.js (seperti server.js)');
  const mqtt = require('mqtt');
  return new Promise(resolve => {
    const client = mqtt.connect(`mqtt://${HOST}:${PORT}`, {
      username: USERNAME || undefined,
      password: PASSWORD || undefined,
      family: 4,
      connectTimeout: 20000,
      reconnectPeriod: 0,
    });
    client.on('connect', (packet) => {
      console.log(`  ✅ CONNECTED! sessionPresent=${packet.sessionPresent}`);
      console.log('  👉 MQTT berfungsi penuh dari environment ini.');
      client.end(true);
      resolve(true);
    });
    client.on('error', (e) => {
      console.log(`  ❌ ERROR: ${e.message}`);
      failures++;
      client.end(true);
      resolve(false);
    });
    setTimeout(() => { client.end(true); resolve(false); }, 25000);
  });
}

function testControl() {
  header('TEST 5 (KONTROL): Broker publik broker.emqx.io:1883');
  const mqtt = require('mqtt');
  return new Promise(resolve => {
    const client = mqtt.connect('mqtt://broker.emqx.io:1883', {
      family: 4,
      connectTimeout: 15000,
      reconnectPeriod: 0,
    });
    client.on('connect', () => {
      console.log('  ✅ Broker publik BISA dijangkau — egress Railway normal.');
      console.log('  👉 Artinya masalah SPESIFIK ke broker mqtt-cleen.ptpjb.com (firewall/whitelist IP).');
      client.end(true);
      resolve(true);
    });
    client.on('error', (e) => {
      console.log(`  ❌ Broker publik juga gagal: ${e.message}`);
      console.log('  👉 Jika kontrol juga gagal, ada kemungkinan Railway memblokir outbound port 1883.');
      client.end(true);
      resolve(false);
    });
    setTimeout(() => { client.end(true); resolve(false); }, 20000);
  });
}

(async () => {
  console.log(`\n🔍 MQTT DIAGNOSTIC — target: ${HOST}:${PORT}`);
  console.log(`   username: ${USERNAME || '(kosong)'}`);
  console.log(`   waktu: ${new Date().toISOString()}`);

  const addresses = await testDNS();
  await testTCP(addresses);
  await testMQTTHandshake();
  await testMqttLibrary();
  await testControl();

  header('RINGKASAN');
  if (failures === 0) {
    console.log('  ✅ Semua test lulus — MQTT bisa konek dari environment ini.');
  } else {
    console.log(`  ❌ ${failures} test gagal.`);
    console.log('');
    console.log('  Jika TEST 2 (TCP) ✅ tapi TEST 3 (handshake) ❌ connack timeout');
    console.log('  DAN TEST 5 (kontrol) ✅:');
    console.log('  → BUKAN masalah kode. Broker/firewall memblokir IP Railway.');
    console.log('  → Solusi: minta admin broker (PT PJB) whitelist akses MQTT dari');
    console.log('    public internet, atau pakai MQTT bridge/relay (lihat README).');
  }
  process.exit(failures === 0 ? 0 : 1);
})();
