const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "registrations.json");
const MAX_PLAYERS = 99;

app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

function readRegistrations() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Could not read registrations:", error);
    return [];
  }
}

function saveRegistrations(registrations) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(registrations, null, 2), "utf8");
}

async function sendTelegram(registration, count) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const message = [
    "🟢 ՆՈՐ ԳՐԱՆՑՈՒՄ — RSD CYBERSPORT",
    "",
    `🎮 Nickname: ${registration.nickname}`,
    `🆔 PUBG ID: ${registration.playerId}`,
    `📞 Հեռախոս: ${registration.phone}`,
    `👥 Մասնակիցներ: ${count}/${MAX_PLAYERS}`,
    `🔖 Գրանցման համար: ${registration.id}`
  ].join("\n");

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message })
    });
    if (!response.ok) {
      const body = await response.text();
      console.error("Telegram notification failed:", body);
    }
  } catch (error) {
    console.error("Telegram notification error:", error);
  }
}

app.get("/api/status", (req, res) => {
  const registrations = readRegistrations();
  res.json({
    count: registrations.length,
    maxPlayers: MAX_PLAYERS,
    remaining: Math.max(0, MAX_PLAYERS - registrations.length),
    full: registrations.length >= MAX_PLAYERS
  });
});

app.post("/api/register", async (req, res) => {
  const nickname = String(req.body?.nickname || "").trim();
  const playerId = String(req.body?.playerId || "").trim();
  const phone = String(req.body?.phone || "").replace(/[^\d+]/g, "");

  if (nickname.length < 2 || nickname.length > 24) {
    return res.status(400).json({ success: false, message: "Nickname-ը պետք է լինի 2-24 նիշ։" });
  }
  if (!/^\d{5,24}$/.test(playerId)) {
    return res.status(400).json({ success: false, message: "PUBG ID-ն պետք է պարունակի 5-24 թիվ։" });
  }
  if (!/^\+374\d{8}$/.test(phone)) {
    return res.status(400).json({ success: false, message: "Մուտքագրեք ճիշտ հայկական հեռախոսահամար՝ +374 և 8 թվանշան։" });
  }

  const registrations = readRegistrations();
  if (registrations.some(item => String(item.playerId) === playerId)) {
    return res.status(409).json({ success: false, message: "Այս PUBG ID-ով արդեն գրանցում կա։" });
  }
  if (registrations.length >= MAX_PLAYERS) {
    return res.status(409).json({ success: false, message: "Գրանցման տեղերն ավարտվել են։" });
  }

  const registration = {
    id: `RSD-${Date.now()}`,
    nickname,
    playerId,
    phone,
    createdAt: new Date().toISOString()
  };

  registrations.push(registration);
  try {
    saveRegistrations(registrations);
  } catch (error) {
    console.error("Could not save registration:", error);
    return res.status(500).json({ success: false, message: "Գրանցումը չհաջողվեց պահպանել։ Փորձեք կրկին։" });
  }

  await sendTelegram(registration, registrations.length);
  return res.status(201).json({
    success: true,
    message: "Գրանցումը հաջողությամբ ընդունվեց։",
    count: registrations.length,
    maxPlayers: MAX_PLAYERS
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`RSD CYBERSPORT is running on port ${PORT}`));
