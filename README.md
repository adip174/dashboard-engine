# Dashboard Engine — PLTD Suppa

Dashboard web real-time untuk memantau parameter engine pembangkit (DG-SET #1 s/d #6) yang datanya diterima dari broker MQTT. Backend Node.js melakukan subscribe ke broker MQTT dan meneruskan data ke browser secara real-time melalui WebSocket (Socket.io).

![Stack](https://img.shields.io/badge/stack-Node.js%20%2B%20Express%20%2B%20MQTT%20%2B%20Socket.io-blue)

---

## Fitur

- **6 kartu unit** (DG-SET #1 – #6), masing-masing menampilkan 4 parameter:
  - Active Power (kW)
  - Reactive Power (kVAR)
  - Generator Current (A)
  - Engine Speed (RPM)
- **Update real-time** via WebSocket dengan efek highlight saat data masuk
- **Indikator status koneksi MQTT** (hijau = terhubung, merah = terputus)
- **Cache di server** — nilai terakhir langsung tampil saat halaman baru dibuka
- **Auto-reconnect** MQTT setiap 5 detik
- **Filter nilai sentinel** — nilai `32768` (sensor offline/invalid dari PLC) ditampilkan sebagai `--`
- Tampilan tema light, layout grid 3×2, responsif untuk tablet/HP

## Struktur Proyek

```
dashboard engine/
├── server.js            # Backend: MQTT client + Express + Socket.io
├── package.json         # Dependencies & script
├── .env                 # Konfigurasi MQTT (JANGAN di-commit ke git publik)
├── .gitignore
├── public/
│   ├── index.html       # Struktur halaman dashboard
│   ├── style.css        # Styling tema light, grid 3×2
│   ├── app.js           # Frontend: Socket.io client, render kartu
│   └── logo.png         # Logo header
└── README.md            # Dokumen ini
```

## Prasyarat

- [Node.js](https://nodejs.org/) v18 atau lebih baru
- Koneksi ke broker MQTT (alamat & kredensial di file `.env`)

## Instalasi & Menjalankan (Lokal)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Buat/sesuaikan file `.env` di root proyek:
   ```env
   MQTT_URL=mqtt://mqtt-cleen.ptpjb.com
   MQTT_PORT=1883
   MQTT_USERNAME=username_anda
   MQTT_PASSWORD=password_anda
   MQTT_TOPIC="KPPJBS/PLTD_Suppa/#"
   PORT=3000
   ```

   > **Penting:** nilai `MQTT_TOPIC` wajib diapit tanda kutip ganda. Tanpa kutipan, karakter `#` dianggap komentar oleh dotenv dan wildcard topik akan terpotong.

3. Jalankan server:
   ```bash
   npm start
   ```

4. Buka browser:
   ```
   http://localhost:3000
   ```

## Cara Kerja

1. `server.js` terhubung ke broker MQTT dan subscribe ke topik `KPPJBS/PLTD_Suppa/#`
2. Setiap pesan masuk diparse: `KPPJBS/PLTD_Suppa/UnitX/Parameter` → disimpan ke cache dan di-broadcast ke semua browser via Socket.io
3. Frontend (`public/app.js`) menerima event `data` dan memperbarui kartu unit yang bersesuaian
4. Nilai `32768` dari PLC (menandakan sensor offline) dikonversi menjadi `null` dan ditampilkan sebagai `--`

---

## Publish ke GitHub

### 1. Inisialisasi repository

```bash
git init
git add .
git commit -m "Initial commit: Dashboard Engine PLTD Suppa"
```

> File `.gitignore` sudah mengesampingkan `.env` dan `node_modules/`, sehingga kredensial MQTT **tidak ikut ter-commit**.

### 2. Buat repository di GitHub

Buat repository baru di https://github.com/new (bisa `Private` agar lebih aman), lalu hubungkan:

```bash
git remote add origin https://github.com/<username>/<nama-repo>.git
git branch -M main
git push -u origin main
```

### 3. (Opsional) Buat `.env.example`

Agar kolaborator tahu variabel apa saja yang diperlukan, file `.env.example` sudah ada di repository (tanpa nilai rahasia), bisa langsung di-commit.

---

## Deploy Production (Railway + Vercel)

Arsitektur production terdiri dari 2 komponen:

```
[Backend - Railway]                 [Frontend - Vercel]
 server.js                          public/
 MQTT client ──TCP──▶ Broker        index.html + app.js
 Socket.io ◀────────── Socket.io ──▶ (konek ke Railway)
```

### Langkah 1 — Deploy Backend ke Railway

1. Push kode ke GitHub repository (lihat bagian sebelumnya)
2. Buka https://railway.app/ → **New Project** → **Deploy from GitHub repo**
3. Pilih repository ini
4. Buka tab **Variables** dan tambahkan isi `.env` (tanpa kutip di Railway UI):
   ```
   MQTT_URL=mqtt://mqtt-cleen.ptpjb.com
   MQTT_PORT=1883
   MQTT_USERNAME=bbtk
   MQTT_PASSWORD=ebtbbtk@PJB
   MQTT_TOPIC=KPPJBS/PLTD_Suppa/#
   ```
   > **Catatan Railway:** di dashboard Railway, jangan gunakan tanda kutip ganda. Railway tidak memproses `#` sebagai komentar.
5. Railway otomatis menjalankan `npm install` + `npm start`
6. Setelah deploy, Railway akan memberikan URL seperti `https://dashboard-engine-production.up.railway.app`
7. **Catat URL Railway ini** — akan digunakan di langkah berikutnya

### Langkah 2 — Deploy Frontend ke Vercel

1. **Update URL backend di `public/app.js`** → ganti `https://dashboard-engine-backend.railway.app` dengan URL Railway yang Anda dapatkan:
   ```js
   const BACKEND_URL = window.location.hostname === 'localhost'
     ? undefined
     : 'https://dashboard-engine-production.up.railway.app';   // ← URL Railway Anda
   ```

2. Commit perubahan:
   ```bash
   git add public/app.js
   git commit -m "Set Railway backend URL"
   git push
   ```

3. Buka https://vercel.com/ → **Import Project** → pilih GitHub repository

4. Konfigurasi Vercel:
   - **Framework Preset:** Other
   - **Root Directory:** (kosongkan, pakai default)
   - **Build Command:** (kosongkan)
   - **Output Directory:** (kosongkan — Vercel akan serve folder `public/`)
   - **Override** isi `vercel.json` — header sudah dikonfigurasi untuk mengizinkan Google Sites

   > **Alternatif via CLI:** `npx vercel --prod` (akan otomatis membaca `vercel.json`)

5. Vercel akan memberikan URL seperti `https://dashboard-engine.vercel.app`

### Verifikasi Deploy

1. Buka URL Vercel → dashboard harus menampilkan data real-time (terhubung ke backend Railway)
2. Cek header iframe:
   ```bash
   curl -I https://dashboard-engine.vercel.app | grep -i frame
   ```
   Harus menampilkan `X-Frame-Options` dan `Content-Security-Policy` yang mengizinkan Google Sites

---

## Embed ke Google Sites

Setelah frontend Vercel berjalan:

1. Buka halaman Google Sites Anda
2. Klik **Insert** → **Embed** → pilih **Embed Code**
3. Paste kode berikut (ganti URL dengan URL Vercel Anda):
   ```html
   <iframe src="https://dashboard-engine.vercel.app" width="100%" height="800" style="border:0;" allowfullscreen></iframe>
   ```
4. Klik **Next** → **Insert**
5. Atur ukuran embed sesuai kebutuhan (direkomendasikan: `width: 100%`, `height: 800px`)
6. **Publish** Google Sites

Dashboard akan tampil di dalam halaman Google Sites tanpa diblokir berkat header `frame-ancestors` dan `X-Frame-Options` yang sudah dikonfigurasi di `vercel.json`.

---

## Menjalankan sebagai Service Produksi (VPS/Lokal)

Untuk menjalankan terus-menerus di server, gunakan [PM2](https://pm2.keymetrics.io/):

```bash
npm install -g pm2
pm2 start server.js --name dashboard-engine
pm2 save
pm2 startup    # agar auto-start saat server reboot
```

Monitoring:
```bash
pm2 status
pm2 logs dashboard-engine
```

## Troubleshooting

| Masalah | Penyebab umum | Solusi |
|---|---|---|
| Kartu menampilkan `--` semua | `MQTT_TOPIC` tanpa kutipan di `.env` | Ubah ke `MQTT_TOPIC="KPPJBS/PLTD_Suppa/#"` lalu restart |
| Status "MQTT: Terputus" | Broker tidak bisa dijangkau / kredensial salah | Periksa `MQTT_URL`, `MQTT_PORT`, username & password di `.env`; cek firewall port 1883 |
| Halaman tidak bisa dibuka | Server belum jalan / port bentrok | Jalankan `npm start`; ubah `PORT` di `.env` jika 3000 dipakai aplikasi lain |
| WebSocket gagal setelah deploy | Platform tidak support WebSocket (mis. Vercel serverless) | Deploy ke Railway/Render/Fly.io (lihat Opsi B) |

## Keamanan

- Jangan pernah commit file `.env` ke repository publik — kredensial MQTT bersifat rahasia
- Untuk akses dari luar jaringan, pertimbangkan menambahkan autentikasi pada Express (mis. HTTP Basic Auth atau login sederhana)
- Jika broker mendukung, gunakan kredensial khusus read-only untuk dashboard
