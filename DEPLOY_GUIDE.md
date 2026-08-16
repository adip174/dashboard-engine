# Panduan Lengkap Deploy Backend Dashboard Engine

Panduan langkah-demi-langkah untuk melakukan hosting / deploy server backend Dashboard Engine ke **Railway** atau **Render**, sehingga aplikasi di HP Android dan Web dapat diakses secara online 24/7 dari mana saja (tanpa perlu laptop menyala).

---

## 📋 Persiapan Awal: Push Kode ke GitHub

Layanan cloud seperti Railway dan Render membaca kode dari repository **GitHub**.

1. Buka [github.com](https://github.com/) dan buat repository baru, misal bernama: `dashboard-engine-suppa` (pilih status *Private* atau *Public*).
2. Buka terminal di folder project Anda (`d:\Project\dashboard engine`), jalankan perintah:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for deployment"
   git branch -M main
   git remote add origin https://github.com/USERNAME_ANDA/dashboard-engine-suppa.git
   git push -u origin main
   ```

---

## 🚀 Pilihan 1: Deploy ke Railway (Sangat Direkomendasikan ⭐)

Railway sangat stabil untuk koneksi realtime WebSocket (Socket.io) dan protokol MQTT.

### Langkah 1: Buat Akun & Project Baru di Railway
1. Kunjungi [railway.app](https://railway.app/) dan klik **Login** dengan akun **GitHub** Anda.
2. Klik tombol **"+ New Project"**.
3. Pilih **"Deploy from GitHub repo"**.
4. Pilih repository Anda (`dashboard-engine-suppa`).
5. Klik **"Deploy Now"**.

### Langkah 2: Atur Environment Variables di Railway
1. Klik kartu service Anda di dashboard Railway.
2. Buka tab **"Variables"**, lalu klik **"Add Variable"** dan masukkan konfigurasi berikut:
   - `MQTT_URL` = `mqtt://mqtt-cleen.ptpjb.com` *(atau alamat IP/broker Anda)*
   - `MQTT_PORT` = `1883`
   - `MQTT_USERNAME` = `bbtk` *(jika ada user)*
   - `MQTT_PASSWORD` = *(password broker jika ada)*
   - `MQTT_TOPIC` = `KPPJBS/PLTD_Suppa/#`
3. Railway akan otomatis me-restart server dengan konfigurasi baru.

### Langkah 3: Dapatkan Domain Publik HTTPS
1. Buka tab **"Settings"** pada service Anda.
2. Gulir ke bagian **"Networking"** -> klik tombol **"Generate Domain"**.
3. Anda akan mendapatkan URL publik, contohnya:
   ```
   https://dashboard-engine-suppa-production.up.railway.app
   ```

---

## 🌐 Pilihan 2: Deploy ke Render (Render.com)

### Langkah 1: Buat Akun & Web Service di Render
1. Kunjungi [render.com](https://render.com/) dan daftar menggunakan akun **GitHub**.
2. Di dashboard Render, klik tombol **"New +"** -> pilih **"Web Service"**.
3. Hubungkan repository GitHub Anda (`dashboard-engine-suppa`).

### Langkah 2: Konfigurasi Service
Isi formulir dengan detail berikut:
- **Name:** `dashboard-engine-suppa`
- **Region:** `Singapore (Southeast Asia)` *(paling cepat untuk Indonesia)*
- **Branch:** `main`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Instance Type:** `Free`

### Langkah 3: Masukkan Environment Variables di Render
Gulir ke bawah ke bagian **"Environment Variables"**, tambahkan:
- `MQTT_URL` : `mqtt://mqtt-cleen.ptpjb.com`
- `MQTT_PORT` : `1883`
- `MQTT_USERNAME` : `bbtk`
- `MQTT_TOPIC` : `KPPJBS/PLTD_Suppa/#`

Klik **"Create Web Service"**. Tunggu hingga status menjadi **"Live"**.
URL aplikasi Anda akan tampil di bagian atas (contoh: `https://dashboard-engine-suppa.onrender.com`).

---

## 📱 Langkah Terakhir: Sambungkan Aplikasi di HP Android ke Cloud

Setelah mendapatkan URL dari Railway atau Render:

1. Buka aplikasi Dashboard Engine di smartphone HP Android Anda.
2. Di bilah menu bawah, klik ikon **⚙️ Koneksi**.
3. Pada tab **Server Backend**, masukkan URL domain cloud yang sudah Anda dapatkan:
   ```
   https://dashboard-engine-suppa-production.up.railway.app
   ```
4. Klik **"Simpan & Sambungkan"**.
5. Status server di header atas akan langsung berubah menjadi hijau **Server: Terhubung** dan **MQTT: Terhubung**.

> [!TIP]
> Sekarang Anda dapat memantau telemetri seluruh Unit DG-SET secara realtime dari mana saja menggunakan koneksi internet data seluler HP (4G/5G/Wi-Fi) tanpa perlu laptop menyala.
