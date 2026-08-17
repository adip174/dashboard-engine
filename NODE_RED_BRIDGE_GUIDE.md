# MQTT Bridge dengan Node-RED ke HiveMQ Cloud

Panduan lengkap setup Node-RED di PC kantor untuk forward data MQTT dari broker PJB ke HiveMQ Cloud, sehingga aplikasi Railway bisa mendapatkan data real-time meski broker internal diblokir firewall.

---

## 📋 Daftar Periksa Cepat

- [ ] Install Node.js di PC kantor
- [ ] Install Node-RED (`npm install -g node-red`)
- [ ] Setup Windows Service (NSSM) agar auto-start
- [ ] Import flow bridge (file `nodered-bridge-flow.json`)
- [ ] Edit credentials broker PJB dan HiveMQ di flow
- [ ] Deploy flow di Node-RED (klik ikon 💾)
- [ ] Update Railway `.env` dengan HiveMQ host/port/credentials
- [ ] Test end-to-end: Railway → dashboard web → live data!

---

## 🔧 Bagian 1: Setup HiveMQ Cloud

### Buat Credentials

1. Login: https://console.hivemq.cloud
2. Klik cluster Anda → tab **Access Management** → **Add Credentials**
3. Isi:
   - **Username**: `railway-dashboard`
   - **Password**: (buat kuat, simpan sekarang!)
   - **Permissions**: pilih "Read/Write" untuk topic `KPPJBS/#`
4. Catat hasilnya:
   ```
   HIVEMQ_HOST=xxx.s1.eu.hivemq.cloud
   HIVEMQ_PORT=8883
   HIVEMQ_USERNAME=railway-dashboard
   HIVEMQ_PASSWORD=<password_anda>
   ```

---

## 💻 Bagian 2: Install Node-RED di PC Kantor (Windows)

### 2.1 Install Node.js

1. Download: https://nodejs.org/en/download/
2. Pilih **Windows Installer (.msi)** → x64 → Install
3. Verifikasi di Command Prompt:
   ```
   node --version
   npm --version
   ```

### 2.2 Install Node-RED

1. Command Prompt (jalankan sebagai Administrator):
   ```
   npm install -g node-red
   ```
2. Start Node-RED:
   ```
   node-red-start
   ```
3. Buka browser: http://localhost:1880

### 2.3 Setup Windows Service (Auto-Start)

Gunakan NSSM (Non-Sucking Service Manager):

1. Download: https://nssm.cc/download → extract ke folder
2. Jalankan `nssm.exe` sebagai Administrator
3. Klik tab **Install**:
   - **Name**: `NodeRED Bridge`
   - **Application path**: `C:\Program Files\nodejs\node.exe`
   - **Arguments**: `node-red`
   - **Startup directory**: `C:\Users\<Anda>\.node-red`
4. Klik **Install service**
5. Cek di `services.msc`: cari "NodeRED Bridge" → status **Running**

---

## 🔁 Bagian 3: Import Flow Bridge ke Node-RED

### 3.1 Download File Flow

File: `nodered-bridge-flow.json` (sudah ada di repo ini)

### 3.2 Import ke Node-RED

1. Buka http://localhost:1880
2. Menu **Import** → **Choose file** → pilih `nodered-bridge-flow.json` → **Import**
3. Atau paste JSON langsung:
   ```json
   [paste-isifile-json-di-sini]
   ```

### 3.3 Edit Credentials

Setelah import, klik setiap node untuk edit:

**Node "Broker PJB":**
- Broker: `mqtt-cleen.ptpjb.com`
- Port: `1883`
- Username: `bbtk`
- Password: `ebtbbtk@PJB`

**Node "HiveMQ Cloud":**
- Broker: `<HIVEMQ_HOST>` (contoh: `xxx.s1.eu.hivemq.cloud`)
- Port: `8883`
- Username: `railway-dashboard`
- Password: `<HIVEMQ_PASSWORD>`
- **WAJIB TLS** → URL pakai `mqtts://` (dengan 's')

**Node "mqtt in":**
- Topic: `KPPJBS/PLTD_Suppa/#`

**Node "mqtt out":**
- Topic: `` (kosong, agar topik asli dipertahankan)

### 3.4 Deploy

1. Klik ikon **Deploy** (💾) di kanan atas
2. Lihat panel **Debug** → harus muncul pesan masuk dari PJB dan forwarded ke HiveMQ

---

## 🌐 Bagian 4: Update Railway Variables

Buka Railway Dashboard → Project → **Variables** tab:

| Variable | Nilai Baru |
|----------|-------------|
| `MQTT_URL` | `mqtts://<HIVEMQ_HOST>` |
| `MQTT_PORT` | `8883` |
| `MQTT_USERNAME` | `railway-dashboard` |
| `MQTT_PASSWORD` | `<HIVEMQ_PASSWORD>` |
| `MQTT_TOPIC` | `KPPJBS/PLTD_Suppa/#` |

⚠️ **PENTING:** HiveMQ pakai TLS → URL harus `mqtts://` (dengan 's')

---

## ✅ Bagian 5: Verifikasi End-to-End

### Test 1: HiveMQ Web Client (tanpa Node-RED)

1. Buka https://console.hivemq.cloud → Connect / Web Client
2. Connect dengan `railway-dashboard` credentials
3. Subscribe ke `KPPJBS/#`
4. **Belum ada data** → normal, karena Node-RED belum jalan

### Test 2: Jalankan Node-RED Bridge

1. PC kantor: pastikan Node-RED service running (`services.msc` → "NodeRED Bridge" → Running)
2. Buka http://localhost:1880 → pastikan flow di **Deploy** (hijau)
3. Di HiveMQ Web Client → sekarang muncul data live!

### Test 3: Dashboard Railway

1. Buka `https://<project>.up.railway.app`
2. Lihat badge **MQTT: Terhubung**
3. Parameter mesin streaming real-time

---

## 🐛 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Node-RED tidak bisa connect ke PJB | Cek koneksi internet lokal, username/password benar |
| Node-RED tidak bisa connect ke HiveMQ | Cek URL `mqtts://` benar, port 8883, TLS aktif |
| Firewall Windows block | Allow inbound/outbound port 8883 untuk Node.js |
| Data tidak muncul di HiveMQ | Cek flow deployed, topic subscription benar |
| Railway tidak konek | Cek variables di Railway tab, URL `mqtts://` benar |

---

## 📚 Referensi

- Node-RED Docs: https://nodered.org/docs/
- HiveMQ Cloud Docs: https://docs.hivemq.com/cloud/
- MQTT.js: https://github.com/mqttjs/MQTT.js
