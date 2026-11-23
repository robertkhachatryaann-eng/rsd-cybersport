require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "registrations.json");
const MAX_PLAYERS = Number(process.env.MAX_PLAYERS || 99);

app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");

function readRegistrations() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch { return []; }
}
function writeRegistrations(items) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), "utf8");
}
function clean(value, max) {
  return String(value || "").trim().replace(/[<>]/g, "").slice(0, max);
}

app.get("/api/status", (req, res) => {
  const registrations = readRegistrations();
  res.json({
    count: registrations.length,
    max: MAX_PLAYERS,
    tournament: process.env.TOURNAMENT_NAME || "ERANGEL #001",
    entryFee: Number(process.env.ENTRY_FEE || 500),
    prize: Number(process.env.PRIZE || 10000),
    channelUrl: process.env.TELEGRAM_CHANNEL_URL || "",
    paymentUrl: process.env.PAYMENT_URL || ""
  });
});

app.post("/api/register", async (req, res) => {
  const nickname = clean(req.body.nickname, 32);
  const playerId = clean(req.body.playerId, 24);

  if (!nickname || !playerId) {
    return res.status(400).json({ error: "Լրացրու երկու դաշտերն էլ։" });
  }
  if (!/^[0-9]{5,24}$/.test(playerId)) {
    return res.status(400).json({ error: "PUBG ID-ն պետք է պարունակի 5–24 թվանշան։" });
  }

  const registrations = readRegistrations();
  if (registrations.length >= MAX_PLAYERS) {
    return res.status(409).json({ error: "Մրցաշարի տեղերը լրացել են։" });
  }
  if (registrations.some(r => r.playerId === playerId)) {
    return res.status(409).json({ error: "Այս PUBG ID-ով արդեն գրանցում կա։" });
  }

  const registration = {
    id: `RSD-${Date.now()}`,
    nickname,
    playerId,
    createdAt: new Date().toISOString()
  };
  registrations.push(registration);
  writeRegistrations(registrations);

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  let telegramSent = false;

  if (token && chatId) {
    const message =
      `🎮 RSD CYBERSPORT — ՆՈՐ ԳՐԱՆՑՈՒՄ\n\n` +
      `🏆 Մրցաշար՝ ${process.env.TOURNAMENT_NAME || "ERANGEL #001"}\n` +
      `👤 Nickname՝ ${nickname}\n` +
      `🆔 PUBG ID՝ ${playerId}\n` +
      `🔖 Գրանցում՝ ${registration.id}\n` +
      `👥 Մասնակիցներ՝ ${registrations.length}/${MAX_PLAYERS}`;

    try {
      const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message })
      });
      telegramSent = tg.ok;
      if (!tg.ok) console.error("Telegram notification failed:", await tg.text());
    } catch (err) {
      console.error("Telegram notification error:", err.message);
    }
  } else {
    console.warn("Telegram is not configured yet; registration saved without notification.");
  }

  res.status(201).json({
    success: true,
    registrationId: registration.id,
    count: registrations.length,
    telegramSent
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`RSD CYBERSPORT running on port ${PORT}`));
