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
  {
    name: "rebalance_portfolio",
    description: "Hitung saran alokasi modal baru (fresh cash) atau rebalancing aset agar portofolio seimbang sesuai profil risiko target.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        fresh_capital: {
          type: Type.NUMBER,
          description: "Nominal uang baru yang ingin dimasukkan (misal 1000000 untuk 1 juta IDR).",
        },
        strategy: {
          type: Type.STRING,
          enum: ["ALL_WEATHER", "BALANCED_GROWTH", "CONSERVATIVE", "HIGH_ALPHA"],
          description: "Pilihan strategi: ALL_WEATHER (50% ETF, 20% Saham, 20% Emas, 10% Kripto), BALANCED_GROWTH (40% ETF, 30% Saham, 20% Kripto, 10% Emas), CONSERVATIVE (40% Emas, 35% ETF, 20% Saham, 5% Kripto), HIGH_ALPHA (45% Kripto, 35% ETF, 15% Saham, 5% Emas).",
        },
      },
    },
  },
  {
    name: "simulate_indonesian_tax",
    description: "Hitung simulasi potongan pajak resmi di Indonesia (PPh Final PMK 68 Kripto 0.1%, Saham BEI 0.1%, Emas PPh 22, US ETF Withholding Tax) dan keuntungan bersih yang masuk rekening saat menjual aset.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        ticker: {
          type: Type.STRING,
          description: "Simbol aset (contoh: BTC, BBCA, VT, EMAS).",
        },
        asset_type: {
          type: Type.STRING,
          enum: ["CRYPTO", "STOCK", "ETF", "GOLD"],
          description: "Jenis kelas aset.",
        },
        sell_amount_idr: {
          type: Type.NUMBER,
          description: "Total nilai rupiah yang ingin dijual (misal 5000000 untuk 5 juta rupiah).",
        },
        sell_quantity: {
          type: Type.NUMBER,
          description: "Jumlah kuantitas unit/koin/lembar yang ingin dijual.",
        },
      },
      required: ["ticker"],
    },
  },
  {
    name: "scan_dip_radar",
    description: "Pindai saham atau aset yang sedang terdiskon lebar / dekat 52-week low dengan fundamental kuat (Graham & Buffett screener).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        asset_type: {
          type: Type.STRING,
          enum: ["ALL", "STOCK", "ETF", "CRYPTO"],
          description: "Filter kelas aset yang ingin dipindai.",
        },
      },
    },
  },
  {
    name: "get_fx_gain_analytics",
    description: "Dapatkan analisis keuntungan ganda kurs USD/IDR (Double Gain) dan efektivitas lindung nilai (hedging) pada aset berdenominasi dollar (VT, BTC, USDT).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        portfolio_id: {
          type: Type.NUMBER,
          description: "ID portofolio (default: 1).",
        },
      },
    },
  },
];
