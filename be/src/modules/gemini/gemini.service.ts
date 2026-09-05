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

  // 1. Check BUY Intent or Historical Portfolio State
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
    const qtyText = isStock ? `${qty} Lot (${qty * 100} lbr)` : `${qty} Unit`;
    const priceFormatted =
      currency === "USD" ? `$${price.toLocaleString()}` : formatRupiah(price);
    const totalFormatted =
      currency === "USD"
        ? `$${(qty * price).toLocaleString()}`
        : formatRupiah((isStock ? qty * 100 : qty) * price);

    executedTools.push({
      toolName: "log_asset_transaction",
      args: { symbol: rawSymbol, asset_type: assetType, action: "BUY", quantity: qty, price },
      result,
    });

    return {
      replyText: `✅ **Transaksi Beli ${assetType} Berhasil Dicatat!**\n\n📌 **Aset:** ${result.transaction.ticker} (${assetType})\n📊 **Jumlah:** ${qtyText}\n💵 **Harga:** ${priceFormatted} / unit\n💰 **Total Nilai:** ${totalFormatted}\n\nPosisi portofolio & alokasi aset Anda telah diperbarui secara otomatis.`,
      toolCallsExecuted: executedTools,
    };
  }

  // 1B. BUDGET DCA / HISTORICAL POSITION ONBOARDING:
  // e.g. "saya memiliki aseet btc sebesar 4.325.000 rp disitu saya mengalami kerugian 20% tolong dicatat"
  // e.g. "beli bbca 5jt", "beli emas 3jt"
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
      const qtyText = isStock
        ? `${tx.lots} Lot (${tx.shares} lbr)`
        : `${tx.quantity} ${assetType === "GOLD" ? "gram" : assetType === "CRYPTO" ? detected.symbol : "unit"}`;
      
      const holding = result.holding;
      const avgBuyPrice = Number(holding?.avg_buy_price || tx.price_per_share);
      const isUSD = tx.currency === "USD";
      
      const priceFormatted = isUSD ? `$${avgBuyPrice.toLocaleString()}` : formatRupiah(avgBuyPrice);
      const totalFormatted = isUSD ? `$${Number(tx.total_amount).toLocaleString()}` : formatRupiah(tx.total_amount);
      const nominalInputFormatted = money.currency === "USD" ? `$${money.amount}` : formatRupiah(money.amount);

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
        const pnlStatus = historicalPnLPercent >= 0 ? "🟢 Keuntungan (Floating Profit)" : "🔴 Kerugian (Floating Loss)";
        return {
          replyText: `🤖 **AI Smart Reconstruction: Posisi Aset Historis Berhasil Dicatat!**\n\n🔍 **Analisis Kondisi Sebelum Pencatatan:**\n• Kondisi Posisi Saat Masuk: **${pnlStatus} ${historicalPnLPercent > 0 ? "+" : ""}${historicalPnLPercent}%**\n• Rekonstruksi Harga Modal Beli (Avg Price): **${priceFormatted} / unit**\n\n📌 **Aset:** ${tx.ticker} (${assetType})\n💰 **Nilai Aset Terkini:** ${nominalInputFormatted}\n📊 **Kuantitas Kepemilikan:** **${qtyText}**\n💵 **Estimasi Total Modal Awal:** ${totalFormatted}\n\nPosisi portofolio dan floating P/L Anda kini telah mencerminkan kondisi riil (${historicalPnLPercent > 0 ? "+" : ""}${historicalPnLPercent}%).`,
          toolCallsExecuted: executedTools,
        };
      }

      return {
        replyText: `🤖 **AI Smart Calculation: Transaksi Beli Berhasil Dicatat!**\n\n💡 *Harga pasar terkini diambil otomatis:* **${priceFormatted} / unit**\n\n📌 **Aset:** ${tx.ticker} (${assetType})\n💰 **Nominal Belanja:** ${nominalInputFormatted}\n📊 **Kuantitas Didapat:** **${qtyText}**\n💵 **Total Realisasi:** ${totalFormatted}\n\nPosisi portofolio & alokasi aset Anda telah diperbarui otomatis dengan harga bursa hari ini.`,
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

  // 3. PORTFOLIO SUMMARY & ALLOCATIONS: e.g. "Portofolio saya", "Cek saldo", "Alokasi aset"
  if (
    lower.includes("portofolio") ||
    lower.includes("portfolio") ||
    lower.includes("saldo") ||
    lower.includes("alokasi") ||
    lower.includes("pnl") ||
    lower.includes("holding") ||
    lower.includes("aset saya")
  ) {
    const summary = await portfolioService.getPortfolioSummary(portfolio.id);
    executedTools.push({ toolName: "get_portfolio_summary", args: {}, result: summary });

    const pnlEmoji = summary.total_floating_pnl >= 0 ? "🟢" : "🔴";
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
        return `• [${h.asset_type}] **${h.ticker}**: ${qtyDisplay} | Now: ${priceDisplay} (${
          h.floating_pnl_percent! >= 0 ? "+" : ""
        }${h.floating_pnl_percent}%)`;
      })
      .join("\n");

    const allocationList = summary.asset_allocations
      ? summary.asset_allocations
          .map((a) => `• ${a.label}: **${a.percentage}%** (${formatRupiah(a.total_value)})`)
          .join("\n")
      : "";

    return {
      replyText: `📊 **Ringkasan Portofolio Multi-Aset (${summary.portfolio_name})**\n\n💰 **Total Nilai Portofolio:** ${formatRupiah(
        summary.total_net_worth
      )}\n💵 **Total Modal Ditanam:** ${formatRupiah(summary.total_invested)}\n${pnlEmoji} **Floating P/L:** ${formatRupiah(
        summary.total_floating_pnl
      )} (${summary.total_floating_pnl_percent >= 0 ? "+" : ""}${summary.total_floating_pnl_percent}%)\n\n🍰 **Alokasi Kelas Aset:**\n${
        allocationList || "*(Belum ada aset aktif)*"
      }\n\n📌 **Daftar Aset Aktif:**\n${holdingsList || "*(Belum ada aset aktif)*"}`,
      toolCallsExecuted: executedTools,
    };
  }

  // 4. CEK HARGA / ANALISIS ASET: e.g. "Harga BTC", "Harga BBCA", "Harga Emas"
  if (
    detected &&
    (lower.includes("harga") ||
      lower.includes("analis") ||
      lower.includes("valuasi") ||
      lower.includes("cek") ||
      lower.includes("berapa"))
  ) {
    const quote = await marketService.getStockQuote(detected.symbol);
    executedTools.push({ toolName: "get_stock_quote", args: { ticker: detected.symbol }, result: quote });

    const changeEmoji = quote.regularMarketChange >= 0 ? "🟢 +" : "🔴 ";
    const priceDisplay =
      quote.currency === "USD"
        ? `$${quote.regularMarketPrice.toLocaleString()}`
        : formatRupiah(quote.regularMarketPrice);

    return {
      replyText: `📈 **Data Harga & Performa: ${quote.name} (${quote.ticker})**\n\n💵 **Harga Terkini:** ${priceDisplay} (${changeEmoji}${quote.regularMarketChangePercent.toFixed(
        2
      )}%)\n📊 **Rentang Harian:** ${
        quote.currency === "USD"
          ? `$${quote.regularMarketDayLow} - $${quote.regularMarketDayHigh}`
          : `${formatRupiah(quote.regularMarketDayLow)} - ${formatRupiah(quote.regularMarketDayHigh)}`
      }\n\n💡 *Buka Web Dashboard untuk grafik visual dan breakdown portofolio lengkap.*`,
      toolCallsExecuted: executedTools,
    };
  }

  // General default message
  return {
    replyText: `🤖 **Halo! Saya Jarvis Multi-Asset Assistant.**\n\nAnda dapat mencatat dan memantau berbagai aset:\n1. **Saham**: *"Beli BBCA 10 lot di 9850"* atau *"Beli BBCA 5 juta"*\n2. **Kripto (Crypto)**: *"Beli BTC 1.100.000 rupiah"* atau *"Beli BTC 0.05 di 64500 USD"*\n3. **Emas / Logam Mulia**: *"Beli Emas Antam 2 juta"* atau *"Beli Emas 10 gram di 1410000"*\n4. **Obligasi / SBN**: *"Beli ORI024 10000000"*\n5. **ETF**: *"Beli SPY 2 unit di 550 USD"*\n6. **Cek Portofolio**: *"Cek portofolio & alokasi aset saya"*\n\nAda yang ingin dicatat atau dicek saat ini?`,
    toolCallsExecuted: [],
  };
}


