# Dashboard Engine — PLTD Suppa (Web & Android Mobile App)

Dashboard real-time modern untuk memantau parameter engine pembangkit (DG-SET #1 s/d #6 dan unit tambahan dinamis) yang datanya diterima dari broker MQTT. Backend Node.js melakukan subscribe ke broker MQTT dan meneruskan data ke browser / aplikasi Android secara real-time melalui WebSocket (Socket.io).

![Stack](https://img.shields.io/badge/stack-Node.js%20%2B%20Capacitor%20%2B%20MQTT%20%2B%20Socket.io-blue)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Android%20APK-brightgreen)

---

## Fitur Utama

- **Realtime Telemetry DG-SET**: Pemantauan langsung untuk Active Power (kW), Reactive Power (kVAR), Generator Current (A), dan Engine Speed (RPM).
- **Unit Tambahan Dinamis**: Secara otomatis mendeteksi dan merender kartu unit baru saat ada topik MQTT baru yang masuk.
- **Pengaturan MQTT & Server Dinamis di Dalam Aplikasi (⚙️)**:
  - Ubah URL Backend Server kapan saja (bisa diisi IP Wi-Fi laptop `http://192.168.x.x:3000` saat di HP atau Cloud URL Railway).
  - Ubah Host Broker MQTT, Port, Username, dan Password langsung dari UI modal.
  - Kelola Topik MQTT (Tambah dan Hapus topik langganan secara realtime tanpa restart server).
- **Sistem Notifikasi & Batas Ambang / Alarm (🔔)**:
  - Konfigurasi batas **Warning** (Kuning) dan **Critical Danger** (Merah) per parameter.
  - **Audio Alarm Synthesizer**: Bunyi nada peringatan otomatis menggunakan Web Audio API tanpa file audio eksternal.
  - **Notifikasi Push / Lokal HP**: Terintegrasi dengan `@capacitor/local-notifications` untuk notifikasi langsung di smartphone Android.
  - **Alarm History & Log**: Riwayat dan daftar peringatan aktif dapat dilihat kapan saja.
- **Dukungan Aplikasi Android Asli (Capacitor)**:
  - Dibungkus dengan Capacitor 8 untuk di-compile menjadi file `.apk`.
  - UI Mobile Responsive dengan dark theme modern dan *safe-area insets*.

---

## Struktur Proyek

```
dashboard engine/
├── server.js            # Backend: Dynamic MQTT client + Express REST & Socket.io
├── package.json         # Dependencies, scripts, dan Capacitor plugins
├── capacitor.config.json # Konfigurasi Capacitor Android (appId, appName, dll)
├── android/             # Proyek native Android (bisa dibuka di Android Studio)
├── .env                 # Konfigurasi default MQTT & PORT
├── public/
│   ├── index.html       # UI Dashboard, modal pengaturan MQTT & Thresholds
│   ├── style.css        # Styling dark modern, status badge, alarm animation, mobile sheet
│   ├── app.js           # Frontend: Socket client, threshold engine, sound synth, local notif
│   └── logo.png         # Logo header
└── README.md
```

---

## 1. Menjalankan Dashboard (Web / Backend)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Jalankan server:
   ```bash
   npm start
   # atau
   npm run dev
   ```
3. Buka di browser: `http://localhost:3000`

---

## 2. Membuka & Build Aplikasi Android (Capacitor)

### Prasyarat Android:
- Pastikan Anda sudah menginstall [Android Studio](https://developer.android.com/studio) dan Android SDK.

### Langkah Build APK:

1. **Sinkronkan Aset Web ke Android:**
   Setiap kali Anda mengubah file di folder `public/`, jalankan perintah:
   ```bash
   npm run cap:sync
   ```

2. **Buka Proyek di Android Studio:**
   ```bash
   npm run cap:open
   ```
   *Atau buka folder `android/` secara manual melalui menu **File > Open** di Android Studio.*

3. **Build APK / Jalankan di Perangkat:**
   - Di Android Studio, hubungkan HP Android Anda via kabel USB (dengan *USB Debugging* aktif) atau gunakan Emulator.
   - Klik tombol **Run (▶️)** di toolbar Android Studio untuk langsung menginstall ke HP.
   - Untuk membuat file installer APK mandiri:
     Pilih menu **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
     File APK akan terbentuk di folder: `android/app/build/outputs/apk/debug/app-debug.apk`.

4. **Menghubungkan HP ke Backend:**
   - Buka aplikasi di HP.
   - Klik tombol **⚙️ (Pengaturan)** di pojok kanan atas.
   - Masukkan **URL Backend Server**:
     - Jika testing di satu jaringan Wi-Fi: `http://<IP_KOMPUTER_ANDA>:3000` (contoh: `http://192.168.1.15:3000`).
     - Jika backend di-deploy online: `https://your-backend.railway.app`.
   - Klik **Simpan & Sambungkan**.
