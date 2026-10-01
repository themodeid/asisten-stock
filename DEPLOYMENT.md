# 🚀 Panduan Resmi Deployment Produksi Asisten Stock (VPS Linux)

Dokumen ini adalah SOP langkah demi langkah untuk menerapkan aplikasi **Asisten Stock** ke lingkungan produksi (VPS) menggunakan arsitektur Docker Compose dan Caddy Reverse Proxy.

---

## 🏗️ Arsitektur Produksi

```text
               INTERNET PUBLIK
                      │
            [ Port 80 & 443 HTTPS ]
                      ▼
        ┌───────────────────────────┐
        │    CADDY REVERSE PROXY    │ (SSL Otomatis Let's Encrypt)
        └─────────────┬─────────────┘
                      │ Jaringan Internal Docker (asisten-network)
         ┌────────────┴────────────┐
         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│ FRONTEND NEXT.JS │      │  BACKEND EXPRESS │
│   (Port 3051)    │      │   (Port 3050)    │
│ Standalone Build │      │ Socket.IO + Bot  │
└──────────────────┘      └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │    POSTGRESQL    │
                          │   (Port 5432)    │
                          │ Port Tertutup!!  │
                          └──────────────────┘
```

---

## 🧪 Fase 1: Uji Coba Produksi di Komputer Lokal (Zero-Cost Test)

Sebelum sewa VPS, Mas Adam bisa mengetes konfigurasi produksi ini di laptop sendiri:

1. Buat file `.env.production` dari template:
   ```bash
   cp .env.production.example .env.production
   ```
   *(Sesuaikan `APP_DOMAIN=localhost` untuk pengetesan lokal).*

2. Jalankan build produksi:
   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   ```

3. Periksa status kontainer:
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```
   Semua kontainer (`asisten-postgres-prod`, `asisten-backend-prod`, `asisten-frontend-prod`, `asisten-caddy-prod`) harus berstatus `healthy` atau `Up`.

4. Akses melalui browser di `http://localhost`.

---

## ☁️ Fase 2: Menyiapkan Server VPS Baru (Ubuntu 22.04 / 24.04 LTS)

1. **Login ke VPS melalui SSH**:
   ```bash
   ssh root@IP_VPS_ANDA
   ```

2. **Clone repositori Asisten Stock**:
   ```bash
   git clone https://github.com/USERNAME/asisten-stock.git
   cd asisten-stock
   ```

3. **Jalankan Skrip Inisialisasi Otomatis**:
   Skrip ini akan meng-upgrade OS, memasang Docker resmi, dan menyalakan UFW Firewall (hanya port 22, 80, 443 yang dibuka):
   ```bash
   chmod +x scripts/setup-vps.sh
   ./scripts/setup-vps.sh
   ```

---

## 🔒 Fase 3: Konfigurasi Environment & Rilis Produksi

1. **Salin dan isi berkas `.env.production`**:
   ```bash
   cp .env.production.example .env.production
   nano .env.production
   ```
   * **`APP_DOMAIN`**: Isi dengan domain/subdomain Mas Adam (misal `stock.namaanda.com`).
   * **`POSTGRES_PASSWORD`**: Masukkan password acak yang kuat.
   * **`JWT_SECRET`**: Generate token acak (bisa gunakan perintah `openssl rand -hex 32`).
   * **`GEMINI_API_KEY`**: Masukkan API key Google AI Studio.
   * **`TELEGRAM_BOT_TOKEN`**: Masukkan token bot dari @BotFather.

2. **Arahkan DNS Domain ke IP VPS**:
   Di dashboard penyedia domain (Namecheap/Cloudflare/Niagahoster), buat **A Record**:
   * **Name / Host**: `stock` (atau `@` jika domain utama)
   * **Type**: `A`
   * **Value / Target**: `IP_VPS_ANDA`

3. **Nyalakan Layanan Produksi**:
   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   ```

4. **Periksa Log Real-time**:
   ```bash
   docker compose -f docker-compose.prod.yml logs -f
   ```
   Caddy akan otomatis mendaftarkan sertifikat SSL Let's Encrypt ke domainmu. Dalam 1–2 menit, webmu sudah bisa diakses secara aman di `https://stock.domainanda.com`!

---

## 📦 Fase 4: Mengaktifkan Skrip Auto-Backup Database

Agar data transaksi dan portofolio tidak hilang jika server mengalami masalah:

1. Buat skrip backup dapat dieksekusi:
   ```bash
   chmod +x scripts/backup-db.sh
   ```

2. Tambahkan ke jadwal otomatis Linux (`crontab`):
   ```bash
   crontab -e
   ```
   Tambahkan baris berikut di baris paling bawah untuk mengeksekusi backup setiap hari pukul **02.00 WIB**:
   ```cron
   0 2 * * * /bin/bash /root/asisten-stock/scripts/backup-db.sh >> /var/log/asisten_stock_backup.log 2>&1
   ```

---

## 🛠️ Perintah Berguna Operasional Harian

| Kebutuhan | Perintah |
| :--- | :--- |
| **Cek status semua kontainer** | `docker compose -f docker-compose.prod.yml ps` |
| **Lihat log backend real-time** | `docker compose -f docker-compose.prod.yml logs -f backend` |
| **Lihat log Caddy (cek SSL/trafik)** | `docker compose -f docker-compose.prod.yml logs -f caddy` |
| **Restart seluruh layanan** | `docker compose -f docker-compose.prod.yml restart` |
| **Update kodingan baru dari Git** | `git pull && docker compose -f docker-compose.prod.yml up --build -d` |
| **Cek penggunaan RAM server** | `htop` atau `docker stats` |
