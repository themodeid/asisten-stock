# 🤖 Asisten+Stock: AI Personal Portfolio & Stock Analysis Assistant

Asisten AI Pengelola Portofolio & Analisa Saham multi-channel (Telegram Bot & Web Dashboard) berbasis **Node.js, Express, TypeScript, PostgreSQL, Next.js, Google Gemini AI (Function Calling & Vision), dan node-cron**.

---

## 🌟 Fitur Utama

1. **AI Telegram Bot (Natural Language)**:
   - Catat transaksi beli/jual saham (*"Beli BBCA 10 lot di 9850"*).
   - Analisa saham real-time (*"Analisa valuasi BBRI"*).
   - Cek ringkasan portofolio & floating PnL (*"Portofolio saya gimana?"*).
   - Pasang price alert otomatis (*"Ingatkan kalau ASII tembus 5200"*).
2. **Next.js Web Dashboard**:
   - Visualisasi alokasi aset, chart performa portofolio, dan floating profit/loss.
   - Tabel posisi saham aktif (Average buy, market price, bobot %).
   - Log riwayat transaksi lengkap.
   - AI Research Hub & Simulator interaktif.
3. **Automated Scheduler**:
   - Monitoring alert target harga dan notifikasi via Telegram.

---

## 🚀 Quick Start

### 1. Inisialisasi Environment
```bash
npm run env:init
```
Lalu edit file `.env` di root dan sesuaikan `GEMINI_API_KEY` dan `TELEGRAM_BOT_TOKEN`.

### 2. Menjalankan dengan Docker Compose
```bash
npm run docker:up
```

### 3. Menjalankan Secara Lokal (Manual)
**Backend:**
```bash
cd be
npm install
npm run db:migrate
npm run dev
```

**Frontend:**
```bash
cd fe
npm install
npm run dev
```
Buka Web Dashboard di `http://localhost:3051` dan Backend API di `http://localhost:3050/api`.
