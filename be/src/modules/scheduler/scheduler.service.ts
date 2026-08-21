import cron from "node-cron";
import * as alertService from "../watchlist-alert/alert.service";
import * as marketService from "../market-data/market.service";
import { sendTelegramNotification } from "../telegram/telegram.bot";
import { formatRupiah } from "../../utils/stockHelper";

export const initScheduler = () => {
  console.log("⏰ Initializing Automated Background Scheduler...");

  // Run every 5 minutes (or 1 minute in dev) to check active price alerts
  cron.schedule("*/5 * * * *", async () => {
    try {
      await checkPriceAlerts();
    } catch (err) {
      console.error("❌ Error in price alert cron job:", err);
    }
  });

  console.log("✅ Scheduler active: Price alerts monitoring every 5 minutes.");
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
      }
    } catch (error: any) {
      console.warn(`Failed checking alert ${alert.id} for ${alert.ticker}:`, error.message);
    }
  }
};
