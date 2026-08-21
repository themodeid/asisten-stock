# Rancangan Teknis Proyek: Asisten AI Pribadi via Telegram

*(Terinspirasi dari Bantuin - bantuinai.com)*

**Versi MVP** | Node.js + Telegram Bot API + Gemini API

---

## 1. Ringkasan Proyek

Proyek ini bertujuan membangun asisten AI berbasis chat di Telegram yang membantu pengguna mengelola tugas-tugas kecil sehari-hari — mengingatkan jadwal, mencatat keuangan, dan berinteraksi lewat bahasa natural — tanpa perlu menginstal aplikasi tambahan atau menghafal perintah khusus.

Tahap awal difokuskan pada MVP (Minimum Viable Product) dengan 3 fitur inti, sebelum diperluas ke fitur lanjutan seperti pembacaan dokumen dan pencarian informasi web.

## 2. Fitur MVP

- **Reminder / pengingat** — dibuat, diubah, dan dibatalkan lewat kalimat bahasa sehari-hari.
- **Catat keuangan** — mencatat pemasukan dan pengeluaran, dikategorikan otomatis, dengan ringkasan harian/bulanan.
- **Chat umum & pemahaman gambar** — merespons obrolan biasa dan membaca informasi dari foto/struk yang dikirim.

## 3. Arsitektur Sistem

Alur data secara garis besar:

```
User (Telegram)
     |
Telegram Bot API (webhook)
     |
Node.js Backend (Express)
  |-- Message Router                  -> deteksi jenis pesan (teks/gambar)
  |-- Gemini API (function calling)   -> parsing intent + entity
  |-- Scheduler (node-cron / BullMQ)  -> eksekusi reminder
  \-- Database (PostgreSQL / SQLite)
        |-- users
        |-- reminders
        \-- transactions
```

Pola intinya adalah **function calling**: Gemini diberi daftar "tools" seperti `create_reminder(text, datetime)` atau `log_transaction(amount, category, type)`. Pengguna cukup mengetik secara natural, dan model yang menentukan tool mana yang dipanggil beserta data yang diekstrak — pola yang sama digunakan Bantuin.

## 4. Stack Teknis

| Komponen | Pilihan |
| --- | --- |
| Bahasa & runtime | Node.js |
| Bot framework | grammy (disarankan, TypeScript-friendly) atau node-telegram-bot-api |
| LLM | Gemini API (`@google/generative-ai`) dengan function calling |
| Scheduler | node-cron untuk versi sederhana, BullMQ + Redis bila perlu scalable |
| Database | PostgreSQL (mis. Supabase, free tier) atau SQLite untuk versi ringan awal |
| Hosting backend | Railway / Render / VPS kecil, dengan webhook HTTPS aktif |

## 5. Rancangan Skema Database (MVP)

### Tabel: `users`

```sql
id            SERIAL PRIMARY KEY
telegram_id   BIGINT UNIQUE NOT NULL
name          TEXT
timezone      TEXT DEFAULT 'Asia/Jakarta'
created_at    TIMESTAMP DEFAULT NOW()
```

### Tabel: `reminders`

```sql
id            SERIAL PRIMARY KEY
user_id       INTEGER REFERENCES users(id)
message       TEXT NOT NULL
remind_at     TIMESTAMP NOT NULL
status        TEXT DEFAULT 'pending'  -- pending | sent | cancelled
created_at    TIMESTAMP DEFAULT NOW()
```

### Tabel: `transactions`

```sql
id            SERIAL PRIMARY KEY
user_id       INTEGER REFERENCES users(id)
type          TEXT NOT NULL   -- income | expense
amount        NUMERIC NOT NULL
category      TEXT
note          TEXT
created_at    TIMESTAMP DEFAULT NOW()
```

## 6. Contoh Function Calling ke Gemini

Definisi tools yang dikirim ke Gemini agar model bisa memutuskan aksi yang tepat:

```javascript
const tools = [
  {
    name: "create_reminder",
    description: "Buat pengingat baru",
    parameters: {
      type: "object",
      properties: {
        message: { type: "string" },
        datetime_iso: { type: "string" }
      },
      required: ["message", "datetime_iso"]
    }
  },
  {
    name: "log_transaction",
    description: "Catat pemasukan/pengeluaran",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["income", "expense"] },
        amount: { type: "number" },
        category: { type: "string" }
      },
      required: ["type", "amount"]
    }
  }
];
```

## 7. Tahapan Pengembangan

1. **Tahap 1** — Setup bot Telegram, hubungkan webhook, uji kirim-terima pesan dasar.
2. **Tahap 2** — Integrasikan Gemini API dengan satu function call sederhana (`create_reminder`).
3. **Tahap 3** — Tambahkan scheduler untuk mengeksekusi dan mengirim reminder pada waktunya.
4. **Tahap 4** — Tambahkan fitur catat keuangan (`log_transaction`) beserta ringkasan harian/bulanan.
5. **Tahap 5** — Tambahkan pemahaman gambar (Gemini Vision) untuk membaca struk/foto.
6. **Tahap 6** — Uji coba dengan pengguna terbatas, lalu perbaikan berdasarkan feedback.

## 8. Pertimbangan Skalabilitas & Keamanan

- Pisahkan identitas pengguna berdasarkan `telegram_id`, bukan nama, untuk menghindari akun tercampur.
- Simpan API key (Gemini, database) di environment variable, jangan hardcode.
- Gunakan queue (BullMQ) jika jumlah reminder/pengguna mulai besar, agar scheduler tidak membebani proses utama.
- Validasi dan konfirmasi sebelum aksi penting dieksekusi (mis. konfirmasi jumlah transaksi sebelum disimpan).
- Terapkan rate limiting per pengguna untuk mencegah penyalahgunaan kuota API Gemini.