import TelegramBot from "node-telegram-bot-api";
import { ENV } from "../../config/env";
import * as userService from "../users/user.service";
import * as geminiService from "../gemini/gemini.service";

let bot: TelegramBot | null = null;

export const initTelegramBot = (): TelegramBot | null => {
  if (!ENV.TELEGRAM_BOT_TOKEN || ENV.TELEGRAM_BOT_TOKEN === "your_telegram_bot_token_here") {
    console.log("ℹ️ TELEGRAM_BOT_TOKEN not configured. Telegram bot is in standby mode.");
    return null;
  }

  try {
    if (ENV.TELEGRAM_USE_POLLING) {
      bot = new TelegramBot(ENV.TELEGRAM_BOT_TOKEN, { polling: true });
      console.log("🤖 Telegram Bot initialized with Long Polling");
    } else {
      bot = new TelegramBot(ENV.TELEGRAM_BOT_TOKEN);
      if (ENV.TELEGRAM_WEBHOOK_URL) {
        bot.setWebHook(ENV.TELEGRAM_WEBHOOK_URL);
        console.log(`🤖 Telegram Bot Webhook set to: ${ENV.TELEGRAM_WEBHOOK_URL}`);
      }
    }

    // Message handler
    bot.on("message", async (msg) => {
      if (!msg.text && !msg.photo) return;
      await handleTelegramMessage(msg);
    });

    bot.on("polling_error", (error) => {
      console.warn("⚠️ Telegram Polling Error:", error.message);
    });

    return bot;
  } catch (error: any) {
    console.error("❌ Failed to initialize Telegram Bot:", error.message);
    return null;
  }
};

export const getTelegramBot = (): TelegramBot | null => bot;

export const handleTelegramMessage = async (msg: TelegramBot.Message) => {
  if (!bot) return;

  const telegramId = msg.from?.id;
  if (!telegramId) return;

  try {
    // 1. Sync / Get User
    const user = await userService.getOrCreateUserByTelegramId({
      telegram_id: telegramId,
      first_name: msg.from?.first_name,
      username: msg.from?.username,
    });

    const chatId = msg.chat.id;
    const text = msg.text || msg.caption || "";

    // Show typing status
    bot.sendChatAction(chatId, "typing");

    // 2. Process message via Gemini
    const response = await geminiService.processUserMessage(user.id, text);

    // 3. Reply to user
    await bot.sendMessage(chatId, response.replyText, {
      parse_mode: "Markdown",
    });
  } catch (err: any) {
    console.error("Error processing telegram message:", err);
    if (msg.chat.id) {
      await bot.sendMessage(
        msg.chat.id,
        `Maaf, terjadi kesalahan saat memproses permintaan Anda: ${err.message}`
      );
    }
  }
};

export const sendTelegramNotification = async (
  telegramId: number,
  message: string
): Promise<boolean> => {
  if (!bot) return false;
  try {
    await bot.sendMessage(telegramId, message, { parse_mode: "Markdown" });
    return true;
  } catch (error: any) {
    console.error(`Failed to send telegram notification to ${telegramId}:`, error.message);
    return false;
  }
};
