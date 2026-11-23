# RSD CYBERSPORT

## Included files
- `server.js` — registration API, validation, JSON storage and Telegram notifications
- `public/index.html` — website
- `package.json` — dependencies and start command
- `.env.example` — Telegram environment variable names

## Deploy on Render
1. Upload/replace these files in the GitHub repository, keeping `public/index.html` inside the `public` folder.
2. In Render, use **Node** runtime and build command `npm install`.
3. Set start command to `npm start`.
4. In Render Environment, add:
   - `TELEGRAM_BOT_TOKEN` = your Telegram bot token
   - `TELEGRAM_CHAT_ID` = your Telegram chat ID

## Phone field
The form shows the fixed `+374` prefix. The participant enters the remaining 8 digits. The server validates and stores the complete number and includes it in the Telegram notification.

## Important
The current server stores registrations in `data/registrations.json`. On hosting platforms with an ephemeral filesystem, that file may be reset after redeploy/restart unless persistent storage is configured.
