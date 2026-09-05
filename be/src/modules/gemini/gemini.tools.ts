import { FunctionDeclaration, Type } from "@google/genai";

export const geminiToolDeclarations: FunctionDeclaration[] = [
  {
    name: "log_asset_transaction",
    description: "Catat transaksi pembelian (BUY) atau penjualan (SELL) aset apa saja (Saham, Crypto, ETF, Obligasi/SBN, Emas/Logam Mulia, Reksadana) ke portofolio pengguna.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        symbol: {
          type: Type.STRING,
          description: "Kode ticker atau nama aset (contoh: BBCA, BTC, ETH, SOL, SPY, EMAS, ORI024, AAPL).",
        },
        asset_type: {
          type: Type.STRING,
          enum: ["STOCK", "CRYPTO", "ETF", "BOND", "MUTUAL_FUND", "GOLD", "CASH"],
          description: "Jenis kelas aset: STOCK (saham), CRYPTO (kripto), ETF, BOND (obligasi/SBN), MUTUAL_FUND (reksadana), GOLD (emas), CASH (kas).",
        },
        action: {
          type: Type.STRING,
          enum: ["BUY", "SELL"],
          description: "Jenis aksi: BUY untuk beli, SELL untuk jual.",
        },
        quantity: {
          type: Type.NUMBER,
          description: "Jumlah unit yang ditransaksikan (Lot untuk saham lokal, unit desimal untuk crypto misal 0.05, gram untuk emas misal 10).",
        },
        price_per_unit: {
          type: Type.NUMBER,
          description: "Harga per unit / per lembar / per koin / per gram (opsional jika total_budget atau harga pasar realtime digunakan).",
        },
        total_budget: {
          type: Type.NUMBER,
          description: "Nominal uang total modal atau nilai aset saat ini (misal: 4325000 untuk 4.325.000 IDR).",
        },
        historical_pnl_percent: {
          type: Type.NUMBER,
          description: "Persentase keuntungan/kerugian historis sebelum dicatat (misal: -20 untuk rugi 20%, 15 untuk untung 15%).",
        },
        historical_buy_price: {
          type: Type.NUMBER,
          description: "Harga beli modal historis di masa lalu jika diketahui spesifik.",
        },
        currency: {
          type: Type.STRING,
          enum: ["IDR", "USD"],
          description: "Mata uang transaksi (IDR atau USD).",
        },
        notes: {
          type: Type.STRING,
          description: "Catatan opsional (misal: 'DCA mingguan', 'Portofolio lama rugi 20%').",
        },
      },
      required: ["symbol", "action"],
    },
  },
  {
    name: "log_stock_transaction",
    description: "Catat transaksi pembelian atau penjualan saham spesifik.",
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
          description: "Jumlah lot saham.",
        },
        price_per_share: {
          type: Type.NUMBER,
          description: "Harga per lembar saham.",
        },
        notes: {
          type: Type.STRING,
          description: "Catatan opsional.",
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
