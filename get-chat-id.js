require("dotenv").config();

(async () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("Set TELEGRAM_BOT_TOKEN in your .env file first.");
    process.exit(1);
  }
  const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
  const data = await response.json();
  if (!data.ok || !data.result.length) {
    console.log("No updates found. Open your bot in Telegram, press START, send /start, then run this command again.");
    return;
  }
  const chats = new Map();
  for (const update of data.result) {
    const msg = update.message || update.edited_message;
    if (msg && msg.chat && msg.chat.type === "private") {
      chats.set(String(msg.chat.id), {
        id: msg.chat.id,
        firstName: msg.chat.first_name || "",
        username: msg.chat.username || ""
      });
    }
  }
  if (!chats.size) {
    console.log("No private chat found. Open your bot, press START, send /start, then retry.");
    return;
  }
  console.log("Private chat(s) found. Put your chat id in TELEGRAM_CHAT_ID in .env:");
  for (const chat of chats.values()) console.log(JSON.stringify(chat));
})();