# RSD CYBERSPORT

A small Node.js + Express website for PUBG Mobile tournament registrations.

## Included
- Dark esports-style Armenian landing page
- Registration form with PUBG nickname and numeric Player ID
- Saves registrations to `data/registrations.json`
- Sends a private Telegram message to the organizer for each registration
- Live participant count and 99-player cap
- Optional Telegram channel and payment-link buttons configured through environment variables

## Important before launch
1. The Telegram bot token shown in the earlier screenshot must be revoked in @BotFather. Use only the newly generated token.
2. The organizer must open the bot, press Start, and send `/start`.
3. Copy `.env.example` to `.env`, then set the new bot token and private chat ID.
4. Set the Telegram channel invite URL and payment URL if applicable.
5. Confirm the tournament format and paid-entry/prize rules are permitted by PUBG MOBILE and applicable Armenian requirements before accepting money or launching.

## Run locally
Install Node.js 18 or newer, then:

```bash
npm install
cp .env.example .env
```

Fill in `.env`. To obtain your private Telegram chat ID, run:

```bash
npm run get-chat-id
```

The script prints your private chat ID. Copy it into `TELEGRAM_CHAT_ID` in `.env`. Keep `.env private.

Then start:

```bash
npm start
```

Open `http://localhost:3000`.

## Deployment
Deploy this folder to a Node.js hosting provider that supports persistent storage, set the same environment variables in the host dashboard, and enable persistent storage for the `data` directory. Do not commit `.env` to GitHub.

## Notes
- The included payment URL is only a configurable link. This starter does not verify payment automatically.
- Registrations are saved locally in a JSON file. For a production launch with multiple server instances, use a managed database.
- Add your own official tournament rules, contact details, and channel URL before public launch.
