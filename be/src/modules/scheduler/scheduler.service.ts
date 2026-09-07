import cron from "node-cron";
import * as alertService from "../watchlist-alert/alert.service";
import * as marketService from "../market-data/market.service";
import * as portfolioService from "../portfolio/portfolio.service";
import { sendTelegramNotification } from "../telegram/telegram.bot";
import { formatRupiah } from "../../utils/stockHelper";
import { pool } from "../../config/database";
import { emitAlertTriggered, emitMarketBriefing } from "../websocket/socket.service";

export const initScheduler = () => {
  console.log("⏰ Initializing Automated Background Scheduler...");

  // 1. Run every 5 minutes: Check active price alerts & Take Profit / Stop Loss triggers
  cron.schedule("*/5 * * * *", async () => {
    try {
      await checkPriceAlerts();
    } catch (err) {
      console.error("❌ Error in price alert cron job:", err);
    }
  });

  // 2. Morning Briefing: Every Monday-Friday at 08:30 WIB (01:30 UTC)
  cron.schedule("30 1 * * 1-5", async () => {
    try {
      await sendMorningMarketDigest();
    } catch (err) {
      console.error("❌ Error in morning briefing cron job:", err);
    }
  });

  // 3. Market Closing Report: Every Monday-Friday at 16:30 WIB (09:30 UTC)
  cron.schedule("30 9 * * 1-5", async () => {
    try {
      await sendEveningPortfolioDigest();
    } catch (err) {
      console.error("❌ Error in evening portfolio digest cron job:", err);
    }
  });

  console.log("✅ Scheduler active: Price alerts (every 5m), Morning Briefing (08:30 WIB), Closing Report (16:30 WIB).");
};

export const checkPriceAlerts = async () => {
  const activeAlerts = await alertService.getActivePriceAlerts();
  if (activeAlerts.length === 0) return;

  for (const alert of activeAlerts) {
    try {
      const quote = await marketService.getStockQuote(alert.ticker);
      const currentPrice = quote.regularMarketPrice;

      let isTriggered = false;
      if (alert.condition === "ABOVE" && currentPrice >= alert.target_price) {
        isTriggered = true;
      } else if (alert.condition === "BELOW" && currentPrice <= alert.target_price) {
        isTriggered = true;
      }

      if (isTriggered) {
        console.log(
          `🔔 Price Alert Triggered for ${alert.ticker}: Current ${currentPrice}, Target ${alert.target_price} (${alert.condition})`
        );

        // Mark in database
        await alertService.markAlertTriggered(alert.id);

        // Send Telegram alert
        if (alert.telegram_id) {
          const conditionText = alert.condition === "ABOVE" ? "naik di atas" : "turun di bawah";
          const message = `🔔 **PRICE ALERT TRIGGERED!**\n\nHalo ${
            alert.first_name || "Investor"
          },\nSaham **${alert.ticker}** telah ${conditionText} target harga Anda!\n\n💵 **Harga Sekarang:** ${formatRupiah(
            currentPrice
          )}\n🎯 **Target Pemicu:** ${formatRupiah(alert.target_price)}`;

          await sendTelegramNotification(alert.telegram_id, message);
        }

        // Push real-time alert to web dashboard via WebSocket
        emitAlertTriggered({
          ticker: alert.ticker,
          currentPrice,
          targetPrice: alert.target_price,
          condition: alert.condition,
          telegramId: alert.telegram_id,
        });
      }
    } catch (error: any) {
      console.warn(`Failed checking alert ${alert.id} for ${alert.ticker}:`, error.message);
    }
  }
};

/**
 * Morning Market Briefing (08:30 WIB)
 */
export const sendMorningMarketDigest = async () => {
  const usersRes = await pool.query("SELECT id, telegram_id, first_name FROM users WHERE telegram_id IS NOT NULL;");
  if (usersRes.rows.length === 0) return;

  let btcPrice = "$79,500";
  let bbcaPrice = "Rp 9.925";

  try {
    const btc = await marketService.getStockQuote("BTC");
    btcPrice = `$${btc.regularMarketPrice.toLocaleString()}`;
    const bbca = await marketService.getStockQuote("BBCA");
    bbcaPrice = formatRupiah(bbca.regularMarketPrice);
  } catch (e) {
    //
  }

  const message = `🌅 **ASISTEN+STOCK MORNING MARKET BRIEFING (08:30 WIB)**\n\nSelamat pagi! Pasar akan segera dibuka.\n\n📊 **Sentimen Pasar Global & Lokal:**\n• **Bitcoin (BTC):** ${btcPrice}\n• **BBCA (Acuan IHSG):** ${bbcaPrice}\n• **Status:** Pasar bersiap untuk sesi perdagangan reguler.\n\n💡 *Gunakan AI Simulator atau ketik pesan kapan saja untuk mencatat transaksi baru.*`;

  for (const user of usersRes.rows) {
    await sendTelegramNotification(user.telegram_id, message);
  }
};

/**
 * Evening Portfolio Digest (16:30 WIB)
 */
export const sendEveningPortfolioDigest = async () => {
  const usersRes = await pool.query("SELECT id, telegram_id, first_name FROM users WHERE telegram_id IS NOT NULL;");
  if (usersRes.rows.length === 0) return;

  for (const user of usersRes.rows) {
    try {
      const summary = await portfolioService.getPortfolioSummary(user.id);
      const pnlEmoji = summary.total_floating_pnl >= 0 ? "🟢 +" : "🔴 ";
      const message = `🌆 **ASISTEN+STOCK MARKET CLOSING REPORT (16:30 WIB)**\n\nHalo ${user.first_name || "Investor"},\nBerikut rekap penutupan portofolio Anda hari ini:\n\n💰 **Total Nilai Portofolio:** ${formatRupiah(summary.total_net_worth)}\n💵 **Total Modal Ditanam:** ${formatRupiah(summary.total_invested)}\n${pnlEmoji} **Floating P/L:** ${formatRupiah(summary.total_floating_pnl)} (${summary.total_floating_pnl_percent >= 0 ? "+" : ""}${summary.total_floating_pnl_percent}%)\n\n📌 **Posisi Aktif:** ${summary.holdings_count} Aset\n\nSemoga harimu produktif!`;

      await sendTelegramNotification(user.telegram_id, message);
    } catch (e) {
      //
    }
  }
};

