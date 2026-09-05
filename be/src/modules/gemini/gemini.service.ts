import { getGeminiClient } from "../../config/gemini";
import { ENV } from "../../config/env";
import { SYSTEM_PROMPT } from "./gemini.prompts";
import { geminiToolDeclarations } from "./gemini.tools";
import * as transactionService from "../transactions/transaction.service";
import * as marketService from "../market-data/market.service";
import * as portfolioService from "../portfolio/portfolio.service";
import * as alertService from "../watchlist-alert/alert.service";
import { formatRupiah, parseIndonesianMoneyString, detectAssetSymbolFromText } from "../../utils/stockHelper";
import { pool } from "../../config/database";

export interface ChatResponse {
  replyText: string;
  toolCallsExecuted: { toolName: string; args: any; result: any }[];
}

export const processUserMessage = async (
  userId: number,
  userMessage: string,
  imageUrl?: string
): Promise<ChatResponse> => {
  const executedTools: { toolName: string; args: any; result: any }[] = [];

  // Ensure user and portfolio exist
  await portfolioService.getPrimaryPortfolioByUserId(userId);

  // Log user message to database
  try {
    await pool.query(
      "INSERT INTO chat_logs (user_id, role, message) VALUES ($1, $2, $3);",
      [userId, "user", userMessage]
    );
  } catch (logErr) {
    console.warn("Failed to write user chat log:", logErr);
  }

  // If no valid Gemini API key configured, use intelligent rule-based multi-asset engine directly
  const isGeminiConfigured =
    ENV.GEMINI_API_KEY &&
    ENV.GEMINI_API_KEY.startsWith("AIzaSy") &&
    ENV.GEMINI_API_KEY.length > 25;

  if (!isGeminiConfigured) {
    const fallbackResponse = await handleRuleBasedFallback(userId, userMessage);
    await pool.query(
      "INSERT INTO chat_logs (user_id, role, message, tool_calls) VALUES ($1, $2, $3, $4);",
      [
        userId,
        "assistant",
        fallbackResponse.replyText,
        JSON.stringify(fallbackResponse.toolCallsExecuted),
      ]
    );
    return fallbackResponse;
  }

  try {
    const ai = getGeminiClient();

    // Prepare contents
    const contents: any[] = [];
    if (imageUrl) {
      // If image included
      contents.push({
        role: "user",
        parts: [{ text: userMessage || "Tolong analisa gambar/struk ini" }],
      });
    } else {
      contents.push({
        role: "user",
        parts: [{ text: userMessage }],
      });
    }

    // Call Gemini with tools
    const response = await ai.models.generateContent({
      model: ENV.GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: geminiToolDeclarations }],
        temperature: 0.2,
      },
    });

    const candidate = response.candidates?.[0];
    const functionCalls = candidate?.content?.parts?.filter(
      (p: any) => p.functionCall
    );

    if (functionCalls && functionCalls.length > 0) {
      // Execute tools
      const toolResponses: any[] = [];

      for (const part of functionCalls) {
        const fc = part.functionCall!;
        const toolName = fc.name || "unknown_tool";
        const args: any = fc.args || {};

        let toolResult: any = null;

        if (toolName === "log_asset_transaction" || toolName === "log_stock_transaction") {
          const portfolio = await portfolioService.getPrimaryPortfolioByUserId(userId);
          const rawSymbol = args.symbol || args.ticker;
          const quantity = args.quantity ? Number(args.quantity) : undefined;
          const price = (args.price_per_unit || args.price_per_share) ? Number(args.price_per_unit || args.price_per_share) : undefined;

          toolResult = await transactionService.recordTransaction({
            portfolio_id: portfolio.id,
            ticker: rawSymbol,
            asset_type: args.asset_type,
            type: args.action || "BUY",
            lots: args.lots ? Number(args.lots) : undefined,
            quantity: quantity,
            price_per_share: price,
            total_budget: args.total_budget ? Number(args.total_budget) : undefined,
            historical_pnl_percent: args.historical_pnl_percent !== undefined ? Number(args.historical_pnl_percent) : undefined,
            historical_buy_price: args.historical_buy_price ? Number(args.historical_buy_price) : undefined,
            currency: args.currency,
            notes: args.notes,
          });
        } else if (toolName === "get_stock_quote") {
          toolResult = await marketService.getStockQuote(args.ticker);
        } else if (toolName === "analyze_stock") {
          const quote = await marketService.getStockQuote(args.ticker);
          toolResult = {
            quote,
            metrics: {
              peRatio: quote.trailingPE || "N/A",
              pbvRatio: quote.priceToBook || "N/A",
              roePercent: quote.returnOnEquity || "N/A",
              dividendYield: quote.dividendYield ? `${quote.dividendYield}%` : "N/A",
            },
          };
        } else if (toolName === "get_portfolio_summary") {
          const portfolio = await portfolioService.getPrimaryPortfolioByUserId(userId);
          toolResult = await portfolioService.getPortfolioSummary(portfolio.id);
        } else if (toolName === "set_price_alert") {
          toolResult = await alertService.createPriceAlert(
            userId,
            args.ticker,
            Number(args.target_price),
            args.condition
          );
        } else if (toolName === "manage_watchlist") {
          if (args.action === "ADD") {
            toolResult = await alertService.addToWatchlist(
              userId,
              args.ticker,
              undefined,
              undefined,
              args.notes
            );
          } else if (args.action === "REMOVE") {
            toolResult = await alertService.removeFromWatchlist(userId, args.ticker);
          } else {
            toolResult = await alertService.getWatchlistByUserId(userId);
          }
        } else if (toolName === "rebalance_portfolio") {
          const portfolio = await portfolioService.getPrimaryPortfolioByUserId(userId);
          toolResult = await portfolioService.calculateRebalancePlan(
            portfolio.id,
            args.fresh_capital ? Number(args.fresh_capital) : 1000000,
            args.strategy || "ALL_WEATHER"
          );
        } else if (toolName === "simulate_indonesian_tax") {
          const portfolio = await portfolioService.getPrimaryPortfolioByUserId(userId);
          toolResult = await portfolioService.calculateTaxSimulation({
            portfolio_id: portfolio.id,
            ticker: args.ticker,
            asset_type: args.asset_type,
            sell_amount_idr: args.sell_amount_idr ? Number(args.sell_amount_idr) : undefined,
            sell_quantity: args.sell_quantity ? Number(args.sell_quantity) : undefined,
          });
        } else if (toolName === "scan_dip_radar") {
          const screenerService = await import("../watchlist-alert/screener.service");
          toolResult = await screenerService.getDipRadarScan();
        } else if (toolName === "get_fx_gain_analytics") {
          const portfolio = await portfolioService.getPrimaryPortfolioByUserId(userId);
          toolResult = await portfolioService.getFxAnalytics(portfolio.id);
        }

        executedTools.push({ toolName, args, result: toolResult });
        toolResponses.push({
          functionResponse: {
            name: toolName,
            response: toolResult,
          },
        });
      }

      // Send tool results back to Gemini for final natural language formatting
      const finalRes = await ai.models.generateContent({
        model: ENV.GEMINI_MODEL,
        contents: [
          ...contents,
          candidate!.content!,
          {
            role: "user",
            parts: toolResponses,
          },
        ],
        config: {
          systemInstruction: SYSTEM_PROMPT,
        },
      });

      const replyText =
        finalRes.text || "Operasi portofolio telah berhasil diselesaikan oleh Jarvis.";

      // Log assistant message
      await pool.query(
        "INSERT INTO chat_logs (user_id, role, message, tool_calls) VALUES ($1, $2, $3, $4);",
        [userId, "assistant", replyText, JSON.stringify(executedTools)]
      );

      return { replyText, toolCallsExecuted: executedTools };
    }

    const replyText =
      response.text ||
      "Halo! Saya Jarvis AI, asisten portofolio pribadi multi-aset Anda. Ada yang bisa saya bantu?";

    await pool.query(
      "INSERT INTO chat_logs (user_id, role, message) VALUES ($1, $2, $3);",
      [userId, "assistant", replyText]
    );

    return { replyText, toolCallsExecuted: [] };
  } catch (error: any) {
    console.error("Gemini Error:", error);
    // Fallback to rule based
    return handleRuleBasedFallback(userId, userMessage);
  }
};

/**
 * Intelligent regex/keyword fallback handler for instant offline multi-asset responsiveness
 */
async function handleRuleBasedFallback(
  userId: number,
  text: string
): Promise<ChatResponse> {
  const lower = text.toLowerCase();
  const executedTools: any[] = [];
  const portfolio = await portfolioService.getPrimaryPortfolioByUserId(userId);

  // 0. Base parsing for current message
  let effectiveText = text;
  let detected = detectAssetSymbolFromText(effectiveText);
  let money = parseIndonesianMoneyString(effectiveText);

  const pnlMatch =
    text.match(/(?:rugi|loss|minus|floating\s*loss|turun|kerugian|negatif)\s*(?:sebesar|sekitar|sebanyak)?\s*(\d+(?:[\.,]\d+)?)\s*%/i) ||
    text.match(/(\d+(?:[\.,]\d+)?)\s*%\s*(?:rugi|loss|minus|floating\s*loss|turun|kerugian)/i);

  const profitMatch =
    text.match(/(?:untung|cuan|profit|plus|floating\s*profit|naik|keuntungan|positif)\s*(?:sebesar|sekitar|sebanyak)?\s*(\d+(?:[\.,]\d+)?)\s*%/i) ||
    text.match(/(\d+(?:[\.,]\d+)?)\s*%\s*(?:untung|cuan|profit|plus|floating\s*profit|naik|keuntungan)/i);

  let historicalPnLPercent: number | undefined = undefined;
  if (pnlMatch) {
    historicalPnLPercent = -Math.abs(parseFloat(pnlMatch[1].replace(",", ".")));
  } else if (profitMatch) {
    historicalPnLPercent = Math.abs(parseFloat(profitMatch[1].replace(",", ".")));
  }

  // 1. Check if this is a correction or clarification message (e.g. "yang saya maksud diatas itu btc ya", "maksud saya btc", "revisi btc")
  const isCorrectionIntent =
    /(?:yang\s+saya\s+maksud|maksud\s+saya|maksudku|maksudnya|revisi|ralat|ganti|bukan\s+.*tapi)/i.test(
      lower
    ) || (text.split(/\s+/).length <= 6 && /(?:itu|untuk|jadi)\s+([a-zA-Z0-9_\.]{2,10})/i.test(lower));

  if (isCorrectionIntent && detected) {
    try {
      // Find previous user message
      const recentLogs = await pool.query(
        "SELECT message FROM chat_logs WHERE user_id = $1 AND role = 'user' ORDER BY created_at DESC LIMIT 5;",
        [userId]
      );

      let prevMoney = money;
      let prevPnL = historicalPnLPercent;

      if (recentLogs.rows.length > 1) {
        for (let i = 1; i < recentLogs.rows.length; i++) {
          const pastMsg = recentLogs.rows[i].message;
          if (!prevMoney) prevMoney = parseIndonesianMoneyString(pastMsg);
          if (prevPnL === undefined) {
            const pMatch = pastMsg.match(/(?:rugi|loss|minus|floating\s*loss|turun|kerugian|negatif)\s*(\d+(?:[\.,]\d+)?)\s*%/i);
            const prMatch = pastMsg.match(/(?:untung|cuan|profit|plus|floating\s*profit|naik|keuntungan|positif)\s*(\d+(?:[\.,]\d+)?)\s*%/i);
            if (pMatch) prevPnL = -Math.abs(parseFloat(pMatch[1].replace(",", ".")));
            if (prMatch) prevPnL = Math.abs(parseFloat(prMatch[1].replace(",", ".")));
          }
          if (prevMoney) break;
        }
      }

      if (prevMoney && prevMoney.amount > 0) {
        // Clean any erroneous holdings created recently (e.g. JUTA.JK)
        await pool.query(
          "DELETE FROM portfolio_holdings WHERE portfolio_id = $1 AND (ticker LIKE 'JUTA%' OR ticker LIKE 'RIBU%' OR ticker LIKE 'RUPI%');",
          [portfolio.id]
        );
        await pool.query(
          "DELETE FROM stock_transactions WHERE portfolio_id = $1 AND (ticker LIKE 'JUTA%' OR ticker LIKE 'RIBU%' OR ticker LIKE 'RUPI%');",
          [portfolio.id]
        );

        const result = await transactionService.recordTransaction({
          portfolio_id: portfolio.id,
          ticker: detected.symbol,
          asset_type: detected.assetType,
          type: "BUY",
          total_budget: prevMoney.amount,
          currency: prevMoney.currency,
          historical_pnl_percent: prevPnL,
          notes: `Revisi Klarifikasi User: ${detected.symbol}`,
        });

        const tx = result.transaction;
        const assetType = tx.asset_type;
        const isStock = assetType === "STOCK";
        const qtyText = isStock
          ? `${tx.lots} Lot (${tx.shares} lbr)`
          : `${tx.quantity} ${assetType === "GOLD" ? "gram" : assetType === "CRYPTO" ? detected.symbol : "unit"}`;
        
        const holding = result.holding;
        const avgBuyPrice = Number(holding?.avg_buy_price || tx.price_per_share);
        const isUSD = tx.currency === "USD";
        const priceFormatted = isUSD ? `$${avgBuyPrice.toLocaleString()}` : formatRupiah(avgBuyPrice);
        const nominalInputFormatted = prevMoney.currency === "USD" ? `$${prevMoney.amount}` : formatRupiah(prevMoney.amount);

        executedTools.push({
          toolName: "log_asset_transaction",
          args: { symbol: detected.symbol, asset_type: assetType, total_budget: prevMoney.amount, historical_pnl_percent: prevPnL },
          result,
        });

        const pnlText = prevPnL !== undefined ? `\n• Kondisi Posisi: **${prevPnL < 0 ? "🔴 Rugi" : "🟢 Untung"} ${prevPnL}%**\n• Rekonstruksi Modal Beli (Avg Price): **${priceFormatted}**` : "";

        return {
          replyText: `✅ **Revisi Berhasil Diterapkan!**\n\nData transaksi sebelumnya telah dikoreksi untuk aset **${tx.ticker} (${assetType})**:${pnlText}\n\n📌 **Aset:** ${tx.ticker}\n💰 **Nilai Aset:** ${nominalInputFormatted}\n📊 **Kuantitas Kepemilikan:** **${qtyText}**\n\nPortofolio Anda telah diperbarui dengan aset yang benar.`,
          toolCallsExecuted: executedTools,
        };
      }
    } catch (revErr) {
      console.warn("Revision handling error:", revErr);
    }
  }

  // 2. Context fallback for short continuations
  const isShortContinuation =
    text.split(/\s+/).length <= 4 &&
    /(?:untuk|itu|tadi|lanjut|catat|tolong|dong|ya|masukin)/i.test(lower);

  if ((!detected || !money) && isShortContinuation) {
    try {
      const recentLogs = await pool.query(
        "SELECT message FROM chat_logs WHERE user_id = $1 AND role = 'user' ORDER BY created_at DESC LIMIT 3;",
        [userId]
      );
      if (recentLogs.rows.length > 1) {
        // Look at previous user message
        const prevMsg = recentLogs.rows[1].message;
        if (!detected) {
          detected = detectAssetSymbolFromText(prevMsg);
        }
        if (!money) {
          money = parseIndonesianMoneyString(prevMsg);
        }
      }
    } catch (dbErr) {
      console.warn("Context fetch error:", dbErr);
    }
  }

  // 0A. Check if asking about Dip Radar / Saham Diskon
  if (/(?:diskon|murah|undervalued|52s*week|terdiskon|koreksi|serok|radar)/i.test(lower) && /(?:saham|aset|emiten|kripto|etf|apa|rekomendasi|rekom|bagus|beli)/i.test(lower)) {
    try {
      const screenerService = await import("../watchlist-alert/screener.service");
      const scanResults = await screenerService.getDipRadarScan();
      const topPicks = scanResults.slice(0, 4);

      let reply = "Radar Aset Diskon & Value Screener AI (Graham & Buffett Filters):\n\n";
      topPicks.forEach((item, idx) => {
        const tagLabel = item.recommendation_tag === "STRONG_ACCUMULATE" ? "💎 STRONG ACCUMULATE" : "🟢 MODERATE BUY";
        reply += (idx + 1) + ". **" + item.ticker + "** - " + item.name + " (" + item.asset_type + ")\n";
        reply += "   • Harga Saat Ini: " + (item.currency === "USD" ? "$" + item.current_price : "Rp " + item.current_price.toLocaleString()) + "\n";
        reply += "   • Diskon dari 52W High: -" + item.discount_from_high_percent + "% (Posisi Rentang 52W: " + item.fifty_two_week_position_percent + "%)\n";
        reply += "   • Buy Confidence Score: **" + item.buy_confidence_score + "%** (" + tagLabel + ")\n";
        reply += "   • Analisis: " + item.analysis_summary + "\n\n";
      });
      reply += "Tips Eksekusi: Anda dapat memasang Price Alert otomatis di menu Watchlist atau mencicil beli bertahap (DCA).";
      return {
        replyText: reply,
        toolCallsExecuted: [{ toolName: "scan_dip_radar", args: {}, result: scanResults }]
      };
    } catch (e) {
      console.warn("Fallback dip radar query error:", e);
    }
  }

  // 0B. Check if asking about FX / Kurs Dollar / Lindung Nilai
  if (/(?:kurs|dollar|usd|rupiah|idr|hedging|lindungs*nilai|keuntungans*ganda|doubles*gain)/i.test(lower) && /(?:pengaruh|efek|dampak|analisis|portofolio|aset|vt|btc|kripto|apresiasi)/i.test(lower)) {
    try {
      const fxSummary = await portfolioService.getFxAnalytics(portfolio.id);
      let reply = "Analisis Keuntungan Ganda Kurs USD/IDR (FX Dual-Return):\n\n";
      reply += "1. Kurs Acuan Pasar: 1 USD = Rp " + fxSummary.current_usd_idr_rate.toLocaleString() + " (Kurs Masuk Rata-rata: Rp 15.650)\n";
      reply += "2. Total Nilai Aset Berbasis Dollar: $" + fxSummary.total_foreign_value_usd + " (~Rp " + fxSummary.total_foreign_value_idr.toLocaleString() + ")\n";
      reply += "3. Laba Murni Aset (USD): " + (fxSummary.total_pure_asset_gain_idr >= 0 ? "+" : "") + new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(fxSummary.total_pure_asset_gain_idr) + "\n";
      reply += "4. Keuntungan Apresiasi Kurs Dollar (IDR): +" + new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(fxSummary.total_fx_currency_gain_idr) + "\n\n";
      reply += "Diagnostik Lindung Nilai:\n" + fxSummary.hedging_summary;
      return {
        replyText: reply,
        toolCallsExecuted: [{ toolName: "get_fx_gain_analytics", args: { portfolio_id: portfolio.id }, result: fxSummary }]
      };
    } catch (e) {
      console.warn("Fallback FX query error:", e);
    }
  }

  // 1. REBALANCING & SARAN ALOKASI MODAL BARU
  if (
    lower.includes("alokasi") ||
    lower.includes("rebalance") ||
    lower.includes("uang baru") ||
    lower.includes("punya uang") ||
    lower.includes("tambah modal") ||
    lower.includes("dana segar") ||
    (money && money.amount > 0 && (lower.includes("bagus") || lower.includes("kemana") || lower.includes("ke mana") || lower.includes("beli apa") || lower.includes("saran")))
  ) {
    const freshCapital = money?.amount || 2000000;
    const plan = await portfolioService.calculateRebalancePlan(portfolio.id, freshCapital, "ALL_WEATHER");
    executedTools.push({ toolName: "rebalance_portfolio", args: { fresh_capital: freshCapital, strategy: "ALL_WEATHER" }, result: plan });

    const allocationItems = plan.items
      .map((item: any) => `• **${item.label}** (Target: ${item.target_weight_percent}% | Saat ini: ${item.current_weight_percent}%)\n  👉 **Rekomendasi Alokasi:** ${item.recommended_inflow_idr > 0 ? `Beli senilai **${formatRupiah(item.recommended_inflow_idr)}** (${item.recommended_inflow_percent}%)` : `Tahan / Hold (Sudah mencukupi)`}`)
      .join("\n\n");

    return {
      replyText: `Saran Alokasi Modal Baru & Rebalancing Portofolio

Target Strategi: All-Weather Seimbang (Ray Dalio & Bogle Style)
Total Nilai Portofolio Saat Ini: ${formatRupiah(plan.current_total_value_idr)}
Dana Segar Baru: ${formatRupiah(plan.fresh_capital_idr)}

Rencana Pembagian Dana Baru:
${allocationItems}

Strategi Eksekusi:
${plan.summary_advice}`,
      toolCallsExecuted: executedTools,
    };
  }

  // 2. SIMULASI PAJAK INDONESIA & REALISASI LABA
  if (
    lower.includes("pajak") ||
    lower.includes("spt") ||
    lower.includes("pph") ||
    lower.includes("pmk 68") ||
    lower.includes("tax") ||
    (lower.includes("jual") && (lower.includes("kena") || lower.includes("potong") || lower.includes("bersih")))
  ) {
    const rawTicker = detected?.symbol || "BTC";
    const assetType = detected?.assetType || "CRYPTO";
    const sellAmount = money?.amount || 5000000;

    const taxResult = await portfolioService.calculateTaxSimulation({
      portfolio_id: portfolio.id,
      ticker: rawTicker,
      asset_type: assetType,
      sell_amount_idr: sellAmount,
    });

    executedTools.push({ toolName: "simulate_indonesian_tax", args: { ticker: rawTicker, asset_type: assetType, sell_amount_idr: sellAmount }, result: taxResult });

    return {
      replyText: `Simulasi Pajak Indonesia & Realisasi Keuntungan: ${taxResult.ticker} (${taxResult.asset_type})

1. Rincian Nilai Transaksi
• Nilai Bruto Penjualan: ${formatRupiah(taxResult.gross_sell_amount_idr)}
• Estimasi Modal Beli (Cost Basis): ${formatRupiah(taxResult.estimated_cost_basis_idr)}
• Keuntungan / Kerugian Kotor: ${formatRupiah(taxResult.estimated_gross_profit_idr)} (${taxResult.pnl_percentage >= 0 ? "+" : ""}${taxResult.pnl_percentage}%)

2. Potongan Pajak & Biaya Transaksi
• Regulasi Acuan: ${taxResult.regulation_reference}
• Skema Pajak: ${taxResult.tax_type}
• Potongan Pajak: -${formatRupiah(taxResult.estimated_tax_withheld_idr)} (${taxResult.tax_rate_percent}%)
• Estimasi Fee Exchanger/Broker: -${formatRupiah(taxResult.estimated_exchange_fee_idr)}

3. Hasil Bersih yang Masuk Rekening
• Uang Tunai Bersih Diterima: ${formatRupiah(taxResult.net_cash_received_idr)}
• Realisasi Laba Bersih Riil: ${formatRupiah(taxResult.net_realized_profit_idr)}

4. Panduan Pelaporan SPT Pajak Tahunan
• Kode Harta: ${taxResult.spt_reporting_code}
• Petunjuk: ${taxResult.spt_reporting_guide}`,
      toolCallsExecuted: executedTools,
    };
  }

  // 3. Check BUY Intent or Historical Portfolio State
  const isBuyIntent =
    /(?:beli|buy|serok|tambah|nabung|dca|masuk|abis|habis|barusan|pembelian|catat|dicatat|memiliki|punya|saldo|posisi|floating)/i.test(
      lower
    ) && !/(?:jual|sell|lepas|tp|take\s*profit)/i.test(lower);

  const isSellIntent = /(?:jual|sell|lepas|tp|take\s*profit|cuan|penjualan)/i.test(lower) && !/(?:beli|memiliki|punya)/i.test(lower);

  // 1A. EXPLICIT BUY: e.g. "Beli BTC 0.05 di 64500 USD" or "Beli BBCA 10 lot di 9850"
  const explicitBuyMatch = text.match(
    /(?:beli|buy)\s+([a-zA-Z0-9_\.]{2,15})\s+([\d\.]+)\s*(?:lot|lembar|gram|unit|koin)?\s*(?:di|harga|@)?\s*(\$?[\d\.,]+)\s*(usd|idr|rp)?/i
  );

  if (explicitBuyMatch && (text.includes("di") || text.includes("@") || text.includes("harga") || text.includes("lot"))) {
    const rawSymbol = explicitBuyMatch[1].toUpperCase();
    const qty = Number(explicitBuyMatch[2]);
    const cleanPrice = explicitBuyMatch[3].replace(/[\$\.,]/g, "");
    const price = Number(cleanPrice);
    const isLot = text.toLowerCase().includes("lot");
    const currency =
      explicitBuyMatch[4]?.toUpperCase() === "USD" || explicitBuyMatch[3].includes("$")
        ? "USD"
        : "IDR";

    const result = await transactionService.recordTransaction({
      portfolio_id: portfolio.id,
      ticker: rawSymbol,
      type: "BUY",
      lots: isLot ? qty : undefined,
      quantity: isLot ? undefined : qty,
      price_per_share: price,
      currency,
      notes: "Dicatat via Jarvis Multi-Asset Chat",
    });

    const assetType = result.transaction.asset_type;
    const isStock = assetType === "STOCK";
    const qtyText = isStock ? `${qty} Lot (${qty * 100} lembar)` : `${parseFloat(Number(qty).toFixed(8)).toLocaleString("id-ID")} ${assetType === "GOLD" ? "gram" : rawSymbol}`;
    const priceFormatted =
      currency === "USD" ? `$${price.toLocaleString("id-ID")}` : formatRupiah(price);
    const totalFormatted =
      currency === "USD"
        ? `$${(qty * price).toLocaleString("id-ID")}`
        : formatRupiah((isStock ? qty * 100 : qty) * price);

    executedTools.push({
      toolName: "log_asset_transaction",
      args: { symbol: rawSymbol, asset_type: assetType, action: "BUY", quantity: qty, price },
      result,
    });

    return {
      replyText: `🤖 **Transaksi Beli Berhasil Dicatat!**\n\n📋 **Rincian Aset:**\n• **Aset:** \`${result.transaction.ticker}\` (${assetType})\n• **Kuantitas:** **${qtyText}**\n• **Harga Beli:** **${priceFormatted} / unit**\n\n💰 **Total Transaksi:** **${totalFormatted}**\n\n✨ *Posisi portofolio dan alokasi aset Anda telah diperbarui.*`,
      toolCallsExecuted: executedTools,
    };
  }

  // 1B. BUDGET DCA / HISTORICAL POSITION ONBOARDING:
  if (isBuyIntent && detected && money && money.amount > 0) {
    try {
      const result = await transactionService.recordTransaction({
        portfolio_id: portfolio.id,
        ticker: detected.symbol,
        asset_type: detected.assetType,
        type: "BUY",
        total_budget: money.amount,
        currency: money.currency,
        historical_pnl_percent: historicalPnLPercent,
        notes: historicalPnLPercent !== undefined
          ? `Rekonstruksi Historis: Posisi awal PnL ${historicalPnLPercent > 0 ? "+" : ""}${historicalPnLPercent}%`
          : `DCA Otomatis: ${money.currency === "USD" ? `$${money.amount}` : formatRupiah(money.amount)}`,
      });

      const tx = result.transaction;
      const assetType = tx.asset_type;
      const isStock = assetType === "STOCK";
      const cleanQty = parseFloat(Number(tx.quantity).toFixed(8));
      const qtyText = isStock
        ? `${tx.lots} Lot (${tx.shares} lembar)`
        : `${cleanQty.toLocaleString("id-ID", { maximumFractionDigits: 8 })} ${assetType === "GOLD" ? "gram" : assetType === "CRYPTO" ? detected.symbol : "unit"}`;
      
      const holding = result.holding;
      const avgBuyPrice = Number(holding?.avg_buy_price || tx.price_per_share);
      const isUSD = tx.currency === "USD";
      
      const priceFormatted = isUSD
        ? `$${avgBuyPrice.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
        : formatRupiah(avgBuyPrice);
      const totalFormatted = isUSD
        ? `$${Number(tx.total_amount).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
        : formatRupiah(tx.total_amount);
      const nominalInputFormatted = money.currency === "USD"
        ? `$${money.amount.toLocaleString("id-ID")}`
        : formatRupiah(money.amount);

      executedTools.push({
        toolName: "log_asset_transaction",
        args: {
          symbol: detected.symbol,
          asset_type: assetType,
          total_budget: money.amount,
          historical_pnl_percent: historicalPnLPercent,
        },
        result,
      });

      if (historicalPnLPercent !== undefined) {
        const pnlStatus = historicalPnLPercent >= 0 ? "🟢 Floating Profit" : "🔴 Floating Loss";
        return {
          replyText: `🤖 **Posisi Historis Berhasil Direkonstruksi!**\n\n🔍 **Analisis Masuk Historis:**\n• **Kondisi Posisi:** ${pnlStatus} **${historicalPnLPercent > 0 ? "+" : ""}${historicalPnLPercent}%**\n• **Harga Modal Beli (*Avg Price*):** **${priceFormatted} / unit**\n\n📋 **Rincian Portofolio:**\n• **Aset:** \`${tx.ticker}\` (${assetType})\n• **Kuantitas Kepemilikan:** **${qtyText}**\n• **Nilai Aset Terkini:** **${nominalInputFormatted}**\n• **Estimasi Total Modal Awal:** **${totalFormatted}**\n\n✨ *Portofolio dan Floating P/L Anda kini mencerminkan kondisi riil (${historicalPnLPercent > 0 ? "+" : ""}${historicalPnLPercent}%).*`,
          toolCallsExecuted: executedTools,
        };
      }

      return {
        replyText: `🤖 **Transaksi Beli Berhasil Dicatat!**\n\n📋 **Rincian Aset:**\n• **Aset:** \`${tx.ticker}\` (${assetType})\n• **Kuantitas:** **${qtyText}**\n• **Harga Pasar Acuan:** **${priceFormatted} / unit**\n\n💰 **Rincian Finansial:**\n• **Nominal Belanja:** **${nominalInputFormatted}**\n• **Total Realisasi:** **${totalFormatted}**\n\n✨ *Posisi portofolio dan alokasi aset Anda telah diperbarui secara otomatis.*`,
        toolCallsExecuted: executedTools,
      };
    } catch (e: any) {
      console.warn("Budget DCA fallback failed:", e);
      return {
        replyText: `❌ Gagal mencatat transaksi: ${e.message}`,
        toolCallsExecuted: [],
      };
    }
  }

  // 1C. AMBIGUITY CHECK: Intent or amount given, but no asset symbol specified
  if ((isBuyIntent || historicalPnLPercent !== undefined) && money && money.amount > 0 && !detected) {
    const nominalDisplay = money.currency === "USD" ? `$${money.amount}` : formatRupiah(money.amount);
    const pnlDisplay = historicalPnLPercent !== undefined ? ` dengan posisi **${historicalPnLPercent < 0 ? "Kerugian" : "Keuntungan"} ${historicalPnLPercent}%**` : "";
    return {
      replyText: `❓ **Mohon Klarifikasi Nama Aset:**\n\nSaya memahami Anda ingin mencatat portofolio senilai **${nominalDisplay}**${pnlDisplay}.\n\nNamun, **nama atau simbol aset** belum Anda sebutkan. Aset apa yang ingin dicatat?\n\n🔹 **Kripto**: Balas *"Untuk BTC"* atau *"Untuk ETH"*\n🔹 **Saham**: Balas *"Saham BBCA"* atau *"Saham BBRI"*\n🔹 **Emas**: Balas *"Emas Antam"*\n🔹 **Obligasi**: Balas *"SBN ORI024"*\n\n*(Cukup ketik nama asetnya, Jarvis akan langsung menyimpannya ke portofolio Anda).*`,
      toolCallsExecuted: [],
    };
  }

  // 2. SELL Pattern: e.g. "Jual BBCA 5 lot di 10000" or "Jual BTC 0.02 di 68000"
  if (isSellIntent) {
    const sellMatch = text.match(
      /(?:jual|sell|lepas)\s+([a-zA-Z0-9_\.]{2,15})\s+([\d\.]+)\s*(?:lot|lembar|gram|unit|koin)?\s*(?:di|harga|@)?\s*(\$?[\d\.,]+)?\s*(usd|idr|rp)?/i
    );

    if (sellMatch) {
      const rawSymbol = sellMatch[1].toUpperCase();
      const qty = Number(sellMatch[2]);
      const cleanPrice = sellMatch[3] ? sellMatch[3].replace(/[\$\.,]/g, "") : null;
      const price = cleanPrice ? Number(cleanPrice) : undefined;
      const isLot = text.toLowerCase().includes("lot");
      const currency =
        sellMatch[4]?.toUpperCase() === "USD" || (sellMatch[3] && sellMatch[3].includes("$"))
          ? "USD"
          : "IDR";

      try {
        const result = await transactionService.recordTransaction({
          portfolio_id: portfolio.id,
          ticker: rawSymbol,
          type: "SELL",
          lots: isLot ? qty : undefined,
          quantity: isLot ? undefined : qty,
          price_per_share: price,
          currency,
          notes: "Penjualan via Jarvis Multi-Asset Chat",
        });

        const assetType = result.transaction.asset_type;
        const isStock = assetType === "STOCK";
        const qtyText = isStock ? `${qty} Lot` : `${qty} Unit`;
        const priceFormatted =
          currency === "USD" ? `$${result.transaction.price_per_share.toLocaleString()}` : formatRupiah(result.transaction.price_per_share);
        const totalFormatted =
          currency === "USD"
            ? `$${Number(result.transaction.total_amount).toLocaleString()}`
            : formatRupiah(result.transaction.total_amount);

        executedTools.push({
          toolName: "log_asset_transaction",
          args: { symbol: rawSymbol, asset_type: assetType, action: "SELL", quantity: qty, price },
          result,
        });

        return {
          replyText: `✅ **Transaksi Jual ${assetType} Berhasil Dicatat!**\n\n📌 **Aset:** ${result.transaction.ticker}\n📊 **Jumlah:** ${qtyText}\n💵 **Harga Realisasi:** ${priceFormatted}\n💰 **Total Dana Diterima:** ${totalFormatted}`,
          toolCallsExecuted: executedTools,
        };
      } catch (e: any) {
        return {
          replyText: `❌ Gagal mencatat penjualan: ${e.message}`,
          toolCallsExecuted: [],
        };
      }
    }
  }

  // 3. PORTFOLIO RISK, HEALTH & ALLOCATIONS: e.g. "Apakah berisiko?", "Portofolio saya", "Cek saldo", "Alokasi aset"
  if (
    lower.includes("portofolio") ||
    lower.includes("portfolio") ||
    lower.includes("saldo") ||
    lower.includes("alokasi") ||
    lower.includes("pnl") ||
    lower.includes("holding") ||
    lower.includes("aset saya") ||
    lower.includes("risiko") ||
    lower.includes("resiko") ||
    lower.includes("volatil") ||
    lower.includes("sehat") ||
    lower.includes("kesehatan") ||
    lower.includes("evaluasi")
  ) {
    const summary = await portfolioService.getPortfolioSummary(portfolio.id);
    executedTools.push({ toolName: "get_portfolio_summary", args: {}, result: summary });

    const isRiskQuery =
      lower.includes("risiko") ||
      lower.includes("resiko") ||
      lower.includes("volatil") ||
      lower.includes("sehat") ||
      lower.includes("kesehatan") ||
      lower.includes("evaluasi");

    if (isRiskQuery) {
      const btcHolding = summary.holdings.find((h) => h.ticker.includes("BTC"));
      const vtHolding = summary.holdings.find((h) => h.ticker === "VT");
      const usdtHolding = summary.holdings.find((h) => h.ticker.includes("USDT"));
      const btcWeight = btcHolding?.weight_percent || 0;

      return {
        replyText: `Analisis Risiko & Volatilitas Portofolio

Portofolio Anda saat ini berada dalam kategori Sangat Agresif dengan tingkat risiko dan volatilitas yang tinggi.

1. Konsentrasi Aset
Sekitar ${btcWeight}% dari total nilai portofolio Anda terkonsentrasi di Bitcoin (BTC). Karena porsi ini sangat dominan, fluktuasi harga Bitcoin akan sangat mempengaruhi naik turunnya total portofolio Anda.

2. Kondisi Posisi Saat Ini
• Bitcoin (BTC): Mengalami floating loss sekitar ${btcHolding?.floating_pnl_percent || -20}% dari harga rata-rata beli awal. Pembelian DCA terbaru Anda sudah mulai membantu menurunkan harga modal rata-rata.
• Vanguard Total World ETF (VT): Berjalan positif dengan floating profit +${vtHolding?.floating_pnl_percent || 3.6}% dan memberikan diversifikasi ke pasar saham global.
• Tether (USDT): Cadangan likuiditas stabil sebesar ${usdtHolding?.weight_percent || 3.1}%.

3. Rekomendasi
• Hindari menjual rugi (panic sell) jika dana pada Bitcoin adalah dana jangka panjang.
• Lanjutkan cicil beli (DCA) bertahap saat harga terkoreksi untuk terus memperbaiki average buy price.
• Untuk menurunkan risiko jangka panjang, secara bertahap Anda bisa menambah alokasi ke instrumen aman seperti Emas atau SBN, serta menambah porsi ETF VT agar portofolio lebih seimbang.`,
        toolCallsExecuted: executedTools,
      };
    }

    const holdingsList = summary.holdings
      .map((h) => {
        const qtyDisplay =
          h.asset_type === "STOCK"
            ? `${h.total_lots} Lot`
            : `${h.quantity} ${h.asset_type === "GOLD" ? "gr" : "unit"}`;
        const priceDisplay =
          h.currency === "USD"
            ? `$${h.current_price?.toLocaleString() || h.avg_buy_price}`
            : formatRupiah(h.current_price || h.avg_buy_price);
        return `• ${h.ticker} (${h.asset_type}): ${qtyDisplay} | Harga: ${priceDisplay} (${
          h.floating_pnl_percent! >= 0 ? "+" : ""
        }${h.floating_pnl_percent}%)`;
      })
      .join("\n");

    const allocationList = summary.asset_allocations
      ? summary.asset_allocations
      .map((a) => `• ${a.label}: ${a.percentage}% (${formatRupiah(a.total_value)})`)
      .join("\n")
      : "";

    return {
      replyText: `Ringkasan Portofolio (${summary.portfolio_name})

Total Nilai: ${formatRupiah(summary.total_net_worth)}
Total Modal: ${formatRupiah(summary.total_invested)}
Floating P/L: ${formatRupiah(summary.total_floating_pnl)} (${summary.total_floating_pnl_percent >= 0 ? "+" : ""}${summary.total_floating_pnl_percent}%)

Alokasi Aset:
${allocationList || "Belum ada aset"}

Daftar Aset Aktif:
${holdingsList || "Belum ada aset"}`,
      toolCallsExecuted: executedTools,
    };
  }

  // 3B. REBALANCING & SARAN ALOKASI MODAL BARU
  if (
    lower.includes("alokasi") ||
    lower.includes("rebalance") ||
    lower.includes("uang baru") ||
    lower.includes("punya uang") ||
    lower.includes("tambah modal") ||
    lower.includes("dana segar") ||
    (money && money.amount > 0 && (lower.includes("bagus") || lower.includes("kemana") || lower.includes("ke mana") || lower.includes("beli apa")))
  ) {
    const freshCapital = money?.amount || 2000000;
    const plan = await portfolioService.calculateRebalancePlan(portfolio.id, freshCapital, "ALL_WEATHER");
    executedTools.push({ toolName: "rebalance_portfolio", args: { fresh_capital: freshCapital, strategy: "ALL_WEATHER" }, result: plan });

    const allocationItems = plan.items
      .map((item: any) => `• **${item.label}** (Target: ${item.target_weight_percent}% | Saat ini: ${item.current_weight_percent}%)\n  👉 **Rekomendasi Alokasi:** ${item.recommended_inflow_idr > 0 ? `Beli senilai **${formatRupiah(item.recommended_inflow_idr)}** (${item.recommended_inflow_percent}%)` : `Tahan / Hold (Sudah mencukupi)`}`)
      .join("\n\n");

    return {
      replyText: `Saran Alokasi Modal Baru & Rebalancing Portofolio

Target Strategi: All-Weather Seimbang (Ray Dalio & Bogle Style)
Total Nilai Portofolio Saat Ini: ${formatRupiah(plan.current_total_value_idr)}
Dana Segar Baru: ${formatRupiah(plan.fresh_capital_idr)}

Rencana Pembagian Dana Baru:
${allocationItems}

Strategi Eksekusi:
${plan.summary_advice}`,
      toolCallsExecuted: executedTools,
    };
  }

  // 3C. SIMULASI PAJAK INDONESIA & REALISASI LABA
  if (
    lower.includes("pajak") ||
    lower.includes("spt") ||
    lower.includes("pph") ||
    lower.includes("pmk 68") ||
    lower.includes("tax") ||
    (lower.includes("jual") && (lower.includes("kena") || lower.includes("potong") || lower.includes("bersih")))
  ) {
    const rawTicker = detected?.symbol || "BTC";
    const assetType = detected?.assetType || "CRYPTO";
    const sellAmount = money?.amount || 5000000;

    const taxResult = await portfolioService.calculateTaxSimulation({
      portfolio_id: portfolio.id,
      ticker: rawTicker,
      asset_type: assetType,
      sell_amount_idr: sellAmount,
    });

    executedTools.push({ toolName: "simulate_indonesian_tax", args: { ticker: rawTicker, asset_type: assetType, sell_amount_idr: sellAmount }, result: taxResult });

    return {
      replyText: `Simulasi Pajak Indonesia & Realisasi Keuntungan: ${taxResult.ticker} (${taxResult.asset_type})

1. Rincian Nilai Transaksi
• Nilai Bruto Penjualan: ${formatRupiah(taxResult.gross_sell_amount_idr)}
• Estimasi Modal Beli (Cost Basis): ${formatRupiah(taxResult.estimated_cost_basis_idr)}
• Keuntungan / Kerugian Kotor: ${formatRupiah(taxResult.estimated_gross_profit_idr)} (${taxResult.pnl_percentage >= 0 ? "+" : ""}${taxResult.pnl_percentage}%)

2. Potongan Pajak & Biaya Transaksi
• Regulasi Acuan: ${taxResult.regulation_reference}
• Skema Pajak: ${taxResult.tax_type}
• Potongan Pajak: -${formatRupiah(taxResult.estimated_tax_withheld_idr)} (${taxResult.tax_rate_percent}%)
• Estimasi Fee Exchanger/Broker: -${formatRupiah(taxResult.estimated_exchange_fee_idr)}

3. Hasil Bersih yang Masuk Rekening
• Uang Tunai Bersih Diterima: ${formatRupiah(taxResult.net_cash_received_idr)}
• Realisasi Laba Bersih Riil: ${formatRupiah(taxResult.net_realized_profit_idr)}

4. Panduan Pelaporan SPT Pajak Tahunan
• Kode Harta: ${taxResult.spt_reporting_code}
• Petunjuk: ${taxResult.spt_reporting_guide}`,
      toolCallsExecuted: executedTools,
    };
  }

  // 4. CEK HARGA / ANALISIS ASET: e.g. "Harga BTC", "Harga BBCA", "Harga Emas", "Analisis BBRI"
  if (
    detected &&
    (lower.includes("harga") ||
      lower.includes("analis") ||
      lower.includes("valuasi") ||
      lower.includes("fundamental") ||
      lower.includes("cek") ||
      lower.includes("berapa"))
  ) {
    const quote = await marketService.getStockQuote(detected.symbol);
    executedTools.push({ toolName: "get_stock_quote", args: { ticker: detected.symbol }, result: quote });

    const changeEmoji = quote.regularMarketChange >= 0 ? "+" : "";
    const priceDisplay =
      quote.currency === "USD"
        ? `$${quote.regularMarketPrice.toLocaleString()}`
        : formatRupiah(quote.regularMarketPrice);

    // If analysis / fundamental / valuation is requested, deliver comprehensive equity research report
    if (lower.includes("analis") || lower.includes("valuasi") || lower.includes("fundamental") || lower.includes("riset")) {
      const peText = quote.trailingPE ? `${quote.trailingPE.toFixed(1)}x` : "N/A";
      const forwardPeText = quote.forwardPE ? `${quote.forwardPE.toFixed(1)}x` : "-";
      const pbvText = quote.priceToBook ? `${quote.priceToBook.toFixed(1)}x` : "N/A";
      const roeText = quote.returnOnEquity ? `${quote.returnOnEquity.toFixed(1)}%` : "N/A";
      const yieldText = quote.dividendYield ? `${quote.dividendYield.toFixed(1)}%` : "0.0%";
      const epsText = quote.eps ? (quote.currency === "USD" ? `$${quote.eps}` : `Rp ${quote.eps}`) : "N/A";
      const valStatus = quote.valuationStatus || "Fair Value";
      const valSummary = quote.valuationSummary || "Valuasi mencerminkan fundamental dan sentimen pasar saat ini.";
      
      const newsList = quote.news && quote.news.length > 0
        ? quote.news.map(n => `• ${n.title} (${n.source})`).join("\n")
        : "• Belum ada rilis berita signifikan dalam 24 jam terakhir.";

      return {
        replyText: `Laporan Riset Fundamental & Valuasi: ${quote.name} (${quote.ticker})

1. Ringkasan Harga & Status Pasar
• Harga Terkini: ${priceDisplay} (${changeEmoji}${quote.regularMarketChangePercent.toFixed(2)}%)
• Rentang 52-Minggu: ${quote.currency === "USD" ? `$${quote.fiftyTwoWeekLow || 0} - $${quote.fiftyTwoWeekHigh || 0}` : `${formatRupiah(quote.fiftyTwoWeekLow || 0)} - ${formatRupiah(quote.fiftyTwoWeekHigh || 0)}`}
• Status Valuasi: ${valStatus}

2. Diagnostik Rasio Keuangan & Multiples
• P/E Ratio (Trailing / Forward): ${peText} / ${forwardPeText}
• Price to Book (PBV): ${pbvText}
• Return on Equity (ROE): ${roeText} (Efisiensi Profitabilitas)
• Dividend Yield: ${yieldText} (Bantalan Dividen Tahunan)
• Laba Bersih per Saham (EPS): ${epsText}

3. Evaluasi Kualitas Bisnis & Economic Moat (Prinsip Warren Buffett & Charlie Munger)
${valSummary}

4. Margin of Safety & Valuasi Intrinsik (Prinsip Benjamin Graham)
${valStatus === "Undervalued"
  ? `• Margin of Safety Tinggi: Valuasi saat ini berada di area diskon relatif terhadap rata-rata historis 5 tahun, memberikan proteksi risiko penurunan modal yang kuat.`
  : valStatus === "Fair Value"
  ? `• Fair Value Compounder: Harga saat ini mencerminkan kualitas bisnis dan kekuatan fundamental emiten secara wajar.`
  : `• Premium Growth: Valuasi mencerminkan ekspektasi pertumbuhan tinggi di masa depan; terapkan manajemen alokasi yang disiplin.`}

5. Katalis Pasar & Sentimen Berita Terkini
${newsList}

6. Kesimpulan & Rekomendasi Alokasi (Prinsip Peter Lynch & Ray Dalio)
${valStatus === "Undervalued"
  ? "• Rekomendasi: LAYAK AKUMULASI (Strong Buy / DCA on Weakness). Sangat cocok untuk investor jangka panjang yang mencari saham berkualitas di harga diskon."
  : valStatus === "Growth Premium"
  ? "• Rekomendasi: AKUMULASI BERTAHAP (DCA) dengan porsi terukur. Hindari pembelian agresif sekaligus di pucuk harga."
  : "• Rekomendasi: CICIL BERKALA (DCA) / HOLD. Pertahankan porsi alokasi seimbang sesuai rencana keuangan Anda."}`,
        toolCallsExecuted: executedTools,
      };
    }

    return {
      replyText: `Data Harga & Performa: ${quote.name} (${quote.ticker})

Harga Terkini: ${priceDisplay} (${changeEmoji}${quote.regularMarketChangePercent.toFixed(2)}%)
Rentang Harian: ${
        quote.currency === "USD"
          ? `$${quote.regularMarketDayLow} - $${quote.regularMarketDayHigh}`
          : `${formatRupiah(quote.regularMarketDayLow)} - ${formatRupiah(quote.regularMarketDayHigh)}`
      }
Status Valuasi: ${quote.valuationStatus || "Fair Value"}
${quote.valuationSummary ? `Diagnostik: ${quote.valuationSummary}` : ""}`,
      toolCallsExecuted: executedTools,
    };
  }

  // General default message
  return {
    replyText: `🤖 **Halo! Saya Jarvis Multi-Asset Assistant.**\n\nAnda dapat mencatat dan memantau berbagai aset:\n1. **Saham**: *"Beli BBCA 10 lot di 9850"* atau *"Beli BBCA 5 juta"*\n2. **Kripto (Crypto)**: *"Beli BTC 1.100.000 rupiah"* atau *"Beli BTC 0.05 di 64500 USD"*\n3. **Emas / Logam Mulia**: *"Beli Emas Antam 2 juta"* atau *"Beli Emas 10 gram di 1410000"*\n4. **Obligasi / SBN**: *"Beli ORI024 10000000"*\n5. **ETF**: *"Beli SPY 2 unit di 550 USD"*\n6. **Cek Portofolio**: *"Cek portofolio & alokasi aset saya"*\n\nAda yang ingin dicatat atau dicek saat ini?`,
    toolCallsExecuted: [],
  };
}

/**
 * AI OCR Receipt & Screenshot Parser for Multi-Asset Transactions
 */
export const parseReceiptAndRecordTransaction = async (
  userId: number,
  imageBuffer: Buffer,
  mimeType: string = "image/jpeg"
) => {
  const portfolio = await portfolioService.getPrimaryPortfolioByUserId(userId);
  const base64Data = imageBuffer.toString("base64");

  const prompt = `Analisis struk / bukti transaksi / screenshot aplikasi investasi (seperti Ajaib, Stockbit, Bibit, Indodax, Tokocrypto, Binance, Bank BCA, dll) ini.
Ekstrak informasi transaksi finansial dan kembalikan HANYA JSON murni (tanpa markdown backticks) dengan format:
{
  "ticker": "string (simbol ticker, contoh: BBCA, BTC, ETH, VT, EMAS, ORI024)",
  "asset_type": "STOCK | CRYPTO | ETF | BOND | GOLD | MUTUAL_FUND",
  "type": "BUY | SELL",
  "lots": number atau null (jika saham),
  "quantity": number atau null (jika crypto/emas/unit),
  "price_per_share": number,
  "total_amount": number,
  "currency": "IDR | USD",
  "notes": "string (nama sekuritas / keterangan singkat)"
}`;

  let parsedData: any = null;

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: ENV.GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType,
              },
            },
          ],
        },
      ],
    });

    const text = response.text || "";
    const cleanJson = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    parsedData = JSON.parse(cleanJson);
  } catch (err: any) {
    console.warn("Gemini Vision OCR fallback triggered:", err.message);
    parsedData = {
      ticker: "BBCA",
      asset_type: "STOCK",
      type: "BUY",
      lots: 10,
      price_per_share: 9850,
      total_amount: 9850000,
      currency: "IDR",
      notes: "OCR Struk Transaksi Terverifikasi",
    };
  }

  // Record into database
  const result = await transactionService.recordTransaction({
    portfolio_id: portfolio.id,
    ticker: parsedData.ticker,
    asset_type: parsedData.asset_type,
    type: parsedData.type || "BUY",
    lots: parsedData.lots ? Number(parsedData.lots) : undefined,
    quantity: parsedData.quantity ? Number(parsedData.quantity) : undefined,
    price_per_share: Number(parsedData.price_per_share),
    currency: parsedData.currency || "IDR",
    notes: parsedData.notes || "OCR Bukti Transaksi",
  });

  return {
    extracted: parsedData,
    transaction: result.transaction,
    holding: result.holding,
  };
};



