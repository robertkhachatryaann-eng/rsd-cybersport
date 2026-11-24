const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "registrations.json");
const MAX_PLAYERS = 99;

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]", "utf8");
  }
}

function readRegistrations() {
  ensureDataFile();

  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Could not read registrations.json:", error.message);
    return [];
  }
}

function saveRegistrations(registrations) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(registrations, null, 2), "utf8");
}

app.get("/api/status", (req, res) => {
  const registrations = readRegistrations();
  const count = registrations.length;

  res.json({
    count,
    maxPlayers: MAX_PLAYERS,
    remaining: Math.max(0, MAX_PLAYERS - count),
    full: count >= MAX_PLAYERS
  });
});

app.post("/api/register", (req, res) => {
  const nickname = String(req.body?.nickname || "").trim();
  const playerId = String(req.body?.playerId || "").trim();
  const phone = String(req.body?.phone || "").trim();

  if (nickname.length < 2 || nickname.length > 24) {
    return res.status(400).json({
      success: false,
      message: "Nickname-ը պետք է լինի 2-24 նիշ։"
    });
  }

  if (!/^\d{5,24}$/.test(playerId)) {
    return res.status(400).json({
      success: false,
      message: "PUBG Player ID-ը պետք է պարունակի 5-24 թվանշան։"
    });
  }

  if (!/^\+374\d{8}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message: "Հեռախոսահամարը պետք է լինի +374 և 8 թվանշան։"
    });
  }

  const registrations = readRegistrations();

  if (registrations.length >= MAX_PLAYERS) {
    return res.status(409).json({
      success: false,
      message: "Գրանցումները լրացել են։"
    });
  }

  const duplicate = registrations.some(
    (entry) => String(entry.playerId) === playerId
  );

  if (duplicate) {
    return res.status(409).json({
      success: false,
      message: "Այս PUBG ID-ով արդեն գրանցում կա։"
    });
  }

  const registration = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    nickname,
    playerId,
    phone,
    createdAt: new Date().toISOString()
  };

  registrations.push(registration);

  try {
    saveRegistrations(registrations);
  } catch (error) {
    console.error("Could not save registration:", error.message);
    return res.status(500).json({
      success: false,
      message: "Գրանցումը չհաջողվեց պահպանել։ Փորձիր կրկին։"
    });
  }

  console.log("");
  console.log("========== RSD CYBERSPORT: NEW REGISTRATION ==========");
  console.log(`Nickname: ${registration.nickname}`);
  console.log(`PUBG ID: ${registration.playerId}`);
  console.log(`Phone: ${registration.phone}`);
  console.log(`Participants: ${registrations.length}/${MAX_PLAYERS}`);
  console.log(`Registration ID: ${registration.id}`);
  console.log(`Created at: ${registration.createdAt}`);
  console.log("======================================================");
  console.log("");

  return res.status(201).json({
    success: true,
    message: "Գրանցումը հաջողությամբ ընդունվեց։",
    count: registrations.length,
    maxPlayers: MAX_PLAYERS,
    remaining: Math.max(0, MAX_PLAYERS - registrations.length)
  });
});

// Serve the website for normal page requests.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`RSD CYBERSPORT server is running on port ${PORT}`);
});
