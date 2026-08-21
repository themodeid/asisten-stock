import { FunctionDeclaration, Type } from "@google/genai";

export const geminiToolDeclarations: FunctionDeclaration[] = [
  {
    name: "log_stock_transaction",
    description: "Catat transaksi pembelian (BUY) atau penjualan (SELL) saham ke portofolio pengguna.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        ticker: {
          type: Type.STRING,
          description: "Kode ticker saham (contoh: BBCA, BBRI, TLKM, ASII, AAPL).",
        },
        action: {
          type: Type.STRING,
          enum: ["BUY", "SELL"],
          description: "Jenis aksi: BUY untuk beli, SELL untuk jual.",
        },
        lots: {
          type: Type.NUMBER,
          description: "Jumlah lot saham yang ditransaksikan (1 lot = 100 lembar untuk saham Indonesia).",
        },
        price_per_share: {
          type: Type.NUMBER,
          description: "Harga per lembar saham dalam Rupiah/mata uang bersangkutan.",
        },
        notes: {
          type: Type.STRING,
          description: "Catatan opsional (misal: 'TP target 1', 'Average down support').",
        },
      },
      required: ["ticker", "action", "lots", "price_per_share"],
    },
  },
  {
    name: "get_stock_quote",
    description: "Ambil data harga saham terkini (real-time/delay), perubahan harian, volume, dan high/low.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        ticker: {
          type: Type.STRING,
          description: "Kode ticker saham yang ingin dicek (contoh: BBCA, BBRI, TLKM).",
        },
      },
      required: ["ticker"],
    },
  },
  {
    name: "analyze_stock",
    description: "Dapatkan analisis fundamental dan valuasi saham (PER, PBV, ROE, Dividend Yield, Market Cap).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        ticker: {
          type: Type.STRING,
          description: "Kode ticker saham yang akan dianalisis.",
        },
        aspect: {
          type: Type.STRING,
          enum: ["fundamental", "valuation", "dividend", "all"],
          description: "Fokus analisis yang diminta pengguna.",
        },
      },
      required: ["ticker"],
    },
  },
  {
    name: "get_portfolio_summary",
    description: "Dapatkan ringkasan nilai portofolio pengguna saat ini (total modal, nilai pasar, floating profit/loss, dan daftar saham yang dipegang).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        filter: {
          type: Type.STRING,
          description: "Filter opsional (contoh: 'top_gainers', 'top_losers', 'all').",
        },
      },
    },
  },
  {
    name: "set_price_alert",
    description: "Pasang notifikasi pengingat harga saham ketika menyentuh level tertentu.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        ticker: {
          type: Type.STRING,
          description: "Kode ticker saham.",
        },
        target_price: {
          type: Type.NUMBER,
          description: "Target harga pemicu alert.",
        },
        condition: {
          type: Type.STRING,
          enum: ["ABOVE", "BELOW"],
          description: "ABOVE jika ingin diberitahu saat harga naik di atas target, BELOW jika turun di bawah target.",
        },
      },
      required: ["ticker", "target_price", "condition"],
    },
  },
  {
    name: "manage_watchlist",
    description: "Tambah, hapus, atau lihat daftar pantau (watchlist) saham pengguna.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: ["ADD", "REMOVE", "LIST"],
          description: "Aksi: ADD untuk menambah, REMOVE untuk menghapus, LIST untuk melihat.",
        },
        ticker: {
          type: Type.STRING,
          description: "Kode ticker saham (wajib jika action ADD atau REMOVE).",
        },
        notes: {
          type: Type.STRING,
          description: "Catatan target harga atau alasan pantau.",
        },
      },
      required: ["action"],
    },
  },
];
