# Isrotel Price Monitor

Monitors hotel room prices on Isrotel every 15 minutes and sends Telegram alerts when prices change.

## How It Works

Uses **GitHub Actions** with **Puppeteer** to:
1. Load the Isrotel page in a headless browser
2. Wait for JavaScript to render the prices
3. Compare with the previous price (cached between runs)
4. Send Telegram notification if price changed

## Quick Setup (GitHub Actions)

### 1. Push to GitHub

```bash
git add .
git commit -m "Add price monitor"
git push
```

### 2. Add Secrets

Go to your repo → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:
- `TELEGRAM_BOT_TOKEN`: Your bot token from BotFather
- `TELEGRAM_CHAT_ID`: Your chat ID

### 3. Enable Actions

Go to Actions tab → Enable workflows

### 4. Test It

Click "Run workflow" to test manually, or wait for the next 15-minute interval.

---

## Alternative: Cloudflare Worker (Limited)

## התקנה

### 1. התקן dependencies

```bash
npm install
```

### 2. צור KV Namespace

```bash
npx wrangler kv namespace create PRICE_STORE
```

העתק את ה-ID שמוחזר ועדכן ב-`wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "PRICE_STORE"
id = "YOUR_KV_NAMESPACE_ID"  # <-- הדבק כאן
```

### 3. הגדר Secrets

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
```

### 4. Deploy

```bash
npm run deploy
```

## פיתוח מקומי

צור קובץ `.dev.vars`:

```env
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id
```

הרץ מקומית:

```bash
npm run dev
```

טריגר ידני (בעוד טרמינל):

```bash
npm run trigger
# או
curl http://localhost:8787/check
```

## Endpoints

| Path | תיאור |
|------|-------|
| `/` | דף בית עם מידע |
| `/check` | טריגר ידני לבדיקת מחיר |
| `/status` | הצג את המחיר האחרון שנשמר |

## Cron Schedule

ה-Worker רץ אוטומטית **כל 15 דקות** (`*/15 * * * *`).

לשינוי התדירות, ערוך את `wrangler.toml`:

```toml
[triggers]
crons = ["*/15 * * * *"]  # כל 15 דקות
# crons = ["0 * * * *"]   # כל שעה עגולה
# crons = ["0 8,20 * * *"] # פעמיים ביום - 08:00 ו-20:00
```

## דוגמא להודעה בטלגרם

```
🚨 שינוי מחיר!

קדמא - חדר עם מרפסת ודלת מקשרת
📅 25-27/09/2026

📉 מחיר מועדון: 3,800 ₪ (היה: 4,045 ₪, -245 ₪)

⏰ 24/09/2026, 14:30:00
🔗 להזמנה
```

## הערות

- המחירים נמשכים מה-HTML של הדף
- אם הדף משתנה או משתמש ב-JavaScript דינמי, ייתכן שצריך יהיה לעדכן את הפרסר
