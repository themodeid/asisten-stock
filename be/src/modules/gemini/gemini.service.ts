import { getGeminiClient } from "../../config/gemini";
import { ENV } from "../../config/env";
import { SYSTEM_PROMPT } from "./gemini.prompts";
import { geminiToolDeclarations } from "./gemini.tools";
import * as transactionService from "../transactions/transaction.service";
import * as marketService from "../market-data/market.service";
import * as portfolioService from "../portfolio/portfolio.service";
import * as alertService from "../watchlist-alert/alert.service";
import { formatRupiah } from "../../utils/stockHelper";
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

  // Log user message to database
  await pool.query(
    "INSERT INTO chat_logs (user_id, role, message) VALUES ($1, $2, $3);",
    [userId, "user", userMessage]
  );

  // If no Gemini API key configured, use intelligent rule-based agentic fallback
  if (!ENV.GEMINI_API_KEY || ENV.GEMINI_API_KEY === "your_gemini_api_key_here") {
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

        if (toolName === "log_stock_transaction") {
          const portfolio = await portfolioService.getPrimaryPortfolioByUserId(userId);
          toolResult = await transactionService.recordTransaction({
            portfolio_id: portfolio.id,
            ticker: args.ticker,
            type: args.action,
            lots: Number(args.lots),
            price_per_share: Number(args.price_per_share),
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
        finalRes.text || "Operasi telah berhasil diselesaikan oleh Jarvis Stock.";

      // Log assistant message
      await pool.query(
        "INSERT INTO chat_logs (user_id, role, message, tool_calls) VALUES ($1, $2, $3, $4);",
        [userId, "assistant", replyText, JSON.stringify(executedTools)]
      );

      return { replyText, toolCallsExecuted: executedTools };
    }

    const replyText =
      response.text ||
      "Halo! Saya Jarvis Stock, asisten portofolio saham pribadi Anda. Ada yang bisa saya bantu?";

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
 * Intelligent regex/keyword fallback handler for instant offline responsiveness
 */
async function handleRuleBasedFallback(
  userId: number,
  text: string
): Promise<ChatResponse> {
  const lower = text.toLowerCase();
  const executedTools: any[] = [];
  const portfolio = await portfolioService.getPrimaryPortfolioByUserId(userId);

  // 1. BUY / BELI Pattern: e.g. "Beli BBCA 10 lot di 9850"
  const buyMatch = text.match(/(?:beli|buy)\s+([a-zA-Z]{4,5})\s+(\d+)\s*(?:lot)?\s*(?:di|harga|@)?\s*(\d+[\d\.]*)/i);
  if (buyMatch) {
    const ticker = buyMatch[1].toUpperCase();
    const lots = Number(buyMatch[2]);
    const price = Number(buyMatch[3].replace(/\./g, ""));

    const result = await transactionService.recordTransaction({
      portfolio_id: portfolio.id,
      ticker,
      type: "BUY",
      lots,
      price_per_share: price,
      notes: "Dicatat via Jarvis Chat",
    });

    executedTools.push({
      toolName: "log_stock_transaction",
      args: { ticker, action: "BUY", lots, price_per_share: price },
      result,
    });

    return {
      replyText: `✅ **Transaksi Beli Berhasil Dicatat!**\n\n📌 **Ticker:** ${ticker}\n📊 **Jumlah:** ${lots} Lot (${lots * 100} lembar)\n💵 **Harga:** ${formatRupiah(price)} / lembar\n💰 **Total Investasi:** ${formatRupiah(lots * 100 * price)}\n\nPosisi holding Anda telah diperbarui secara otomatis.`,
      toolCallsExecuted: executedTools,
    };
  }

  // 2. SELL / JUAL Pattern: e.g. "Jual BBCA 5 lot di 10000"
  const sellMatch = text.match(/(?:jual|sell)\s+([a-zA-Z]{4,5})\s+(\d+)\s*(?:lot)?\s*(?:di|harga|@)?\s*(\d+[\d\.]*)/i);
  if (sellMatch) {
    const ticker = sellMatch[1].toUpperCase();
    const lots = Number(sellMatch[2]);
    const price = Number(sellMatch[3].replace(/\./g, ""));

    try {
      const result = await transactionService.recordTransaction({
        portfolio_id: portfolio.id,
        ticker,
        type: "SELL",
        lots,
        price_per_share: price,
        notes: "Penjualan via Jarvis Chat",
      });

      executedTools.push({
        toolName: "log_stock_transaction",
        args: { ticker, action: "SELL", lots, price_per_share: price },
        result,
      });

      return {
        replyText: `✅ **Transaksi Jual Berhasil Dicatat!**\n\n📌 **Ticker:** ${ticker}\n📊 **Jumlah:** ${lots} Lot\n💵 **Harga Realisasi:** ${formatRupiah(price)}\n💰 **Total Dana Diterima:** ${formatRupiah(lots * 100 * price)}`,
        toolCallsExecuted: executedTools,
      };
    } catch (e: any) {
      return {
        replyText: `❌ Gagal mencatat penjualan: ${e.message}`,
        toolCallsExecuted: [],
      };
    }
  }

  // 3. PORTFOLIO SUMMARY: e.g. "Portofolio saya", "Cek portofolio", "Ringkasan"
  if (lower.includes("portofolio") || lower.includes("portfolio") || lower.includes("saldo") || lower.includes("pnl")) {
    const summary = await portfolioService.getPortfolioSummary(portfolio.id);
    executedTools.push({ toolName: "get_portfolio_summary", args: {}, result: summary });

    const pnlEmoji = summary.total_floating_pnl >= 0 ? "🟢" : "🔴";
    const holdingsList = summary.holdings
      .map(
        (h) =>
          `• **${h.ticker}**: ${h.total_lots} Lot | Avg: ${formatRupiah(h.avg_buy_price)} | Now: ${formatRupiah(h.current_price || h.avg_buy_price)} (${h.floating_pnl_percent! >= 0 ? "+" : ""}${h.floating_pnl_percent}%)`
      )
      .join("\n");

    return {
      replyText: `📊 **Ringkasan Portofolio (${summary.portfolio_name})**\n\n💰 **Total Nilai Portofolio:** ${formatRupiah(summary.total_net_worth)}\n💵 **Total Modal Ditanam:** ${formatRupiah(summary.total_invested)}\n${pnlEmoji} **Floating P/L:** ${formatRupiah(summary.total_floating_pnl)} (${summary.total_floating_pnl_percent >= 0 ? "+" : ""}${summary.total_floating_pnl_percent}%)\n\n📌 **Daftar Saham Aktif:**\n${holdingsList || "*(Belum ada posisi saham aktif)*"}`,
      toolCallsExecuted: executedTools,
    };
  }

  // 4. CEK HARGA / ANALISIS: e.g. "Harga BBCA", "Analisa BBRI", "Valuasi TLKM"
  const tickerMatch = text.match(/\b([a-zA-Z]{4})\b/i);
  if (tickerMatch && (lower.includes("harga") || lower.includes("analis") || lower.includes("valuasi") || lower.includes("cek"))) {
    const ticker = tickerMatch[1].toUpperCase();
    const quote = await marketService.getStockQuote(ticker);
    executedTools.push({ toolName: "analyze_stock", args: { ticker }, result: quote });

    const changeEmoji = quote.regularMarketChange >= 0 ? "🟢 +" : "🔴 ";
    return {
      replyText: `📈 **Data & Analisis Valuasi Saham ${quote.name} (${quote.ticker})**\n\n💵 **Harga Terkini:** ${formatRupiah(quote.regularMarketPrice)} (${changeEmoji}${quote.regularMarketChangePercent.toFixed(2)}%)\n📊 **Rentang Harian:** ${formatRupiah(quote.regularMarketDayLow)} - ${formatRupiah(quote.regularMarketDayHigh)}\n\n🔍 **Rasio Valuasi & Finansial:**\n• **P/E Ratio (PER):** ${quote.trailingPE ? quote.trailingPE.toFixed(1) + "x" : "N/A"}\n• **Price to Book (PBV):** ${quote.priceToBook ? quote.priceToBook.toFixed(1) + "x" : "N/A"}\n• **Return on Equity (ROE):** ${quote.returnOnEquity ? quote.returnOnEquity.toFixed(1) + "%" : "N/A"}\n• **Dividend Yield:** ${quote.dividendYield ? quote.dividendYield.toFixed(1) + "%" : "N/A"}\n\n💡 *Gunakan Web Dashboard untuk grafik teknikal lengkap dan breakdown fundamental mendalam.*`,
      toolCallsExecuted: executedTools,
    };
  }

  // General default message
  return {
    replyText: `🤖 **Halo! Saya Jarvis Stock Assistant.**\n\nAnda dapat meminta saya untuk:\n1. **Catat Beli/Jual**: *"Beli BBCA 10 lot di 9850"* atau *"Jual BBRI 5 lot di 4800"*\n2. **Cek Portofolio**: *"Portofolio saya gimana?"*\n3. **Cek Harga & Valuasi**: *"Analisa valuasi BMRI"* atau *"Cek harga TLKM"*\n4. **Pasang Alert**: *"Ingatkan kalau ASII tembus 5200"*\n\nAda yang bisa saya bantu saat ini?`,
    toolCallsExecuted: [],
  };
}
