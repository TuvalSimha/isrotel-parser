# ✈️ EL AL Flight Price Monitor

Automated price monitoring for [EL AL](https://www.elal.com/) flights. Get instant Telegram notifications when prices change!

## ✨ Features

- 🔄 **Automatic monitoring** - Checks prices once daily via GitHub Actions
- 📱 **Telegram notifications** - Instant alerts when prices change (up or down)
- 💵 **Multiple currencies** - Tracks prices in USD and ILS
- 🛫 **Multiple routes** - Monitor several flight routes simultaneously

## 📸 Example Notification

```
🔔 היי! יש שינוי במחיר הטיסה!

✈️ EL AL
🛫 מסלול: תל אביב → בלגרד
📅 תאריכים: 03-06/06/2025
━━━━━━━━━━━━━━━

✈️ Economy

📉 ירד:
   לפני: $450
   עכשיו: $380 🔻 -$70

📊 כל המחירים העדכניים:
   ✈️ Economy: $380
   ✈️ Business: $1,200

━━━━━━━━━━━━━━━
👉 לחצו כאן להזמנה
```

## 🚀 Setup Your Own Monitor

### 1. Fork this repository

Click the **Fork** button at the top right of this page.

### 2. Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow the instructions
3. Copy the **Bot Token** (looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 3. Get your Chat ID

1. Search for [@userinfobot](https://t.me/userinfobot) on Telegram
2. Start a chat and send any message
3. Copy your **Chat ID** (a number like `1124533515`)

### 4. Add GitHub Secrets

Go to your forked repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Name | Value |
|------|-------|
| `TELEGRAM_BOT_TOKEN` | Your bot token from BotFather |
| `TELEGRAM_CHAT_ID` | Your chat ID |

### 5. Configure your flight search

Edit `scripts/check-price.js` and update the `SEARCHES` array:

```javascript
const SEARCHES = [
  {
    id: "my-flight",
    route: "TLV → BEG",
    routeHebrew: "תל אביב → בלגרד",
    dates: "03-06/06/2025",
    url: "https://booking.elal.com/engine?...", // Your EL AL search URL
  },
  // Add more routes as needed
];
```

**How to get the URL:**
1. Go to [elal.com](https://www.elal.com/)
2. Search for your desired flight (origin, destination, dates, passengers)
3. Copy the full URL from your browser

### 6. Enable GitHub Actions

Go to **Actions** tab → Click **"I understand my workflows, go ahead and enable them"**

### 7. Done! 🎉

The monitor will check prices once daily (8:00 AM UTC / 11:00 AM Israel) and send you Telegram notifications when prices change.

## ⚙️ Configuration

### Change check frequency

Edit `.github/workflows/check-price.yml`:

```yaml
schedule:
  - cron: '0 8 * * *'     # Once daily at 8:00 AM UTC
  # - cron: '0 */6 * * *'  # Every 6 hours
  # - cron: '0 8,20 * * *' # Twice daily (8 AM and 8 PM UTC)
```

### Manual check

Go to **Actions** → **Check EL AL Flight Price** → **Run workflow**

This will send you a status message even if prices haven't changed.

## 🛠️ How It Works

1. **GitHub Actions** runs the workflow on schedule
2. **Puppeteer** (headless browser) loads the EL AL booking page
3. Waits for JavaScript to render the prices
4. Extracts flight options and their prices
5. Compares with previously saved prices
6. Sends **Telegram notification** if any price changed
7. Saves current prices for next comparison

## 📁 Project Structure

```
├── .github/workflows/
│   └── check-price.yml    # GitHub Actions workflow
├── scripts/
│   └── check-price.js     # Main price checking script
├── README.md
└── package.json
```

## ⚠️ Important Notes

- **Public repo required** - GitHub Actions scheduled workflows don't work reliably on free private repos
- **Dynamic pages** - EL AL uses a complex booking engine; price extraction may need tuning
- **Best effort timing** - Scheduled runs may be delayed during high GitHub load
- **Secrets are safe** - Even in public repos, GitHub Secrets are encrypted and never exposed

## 🔧 Troubleshooting

If prices aren't being detected:
1. Go to **Actions** → Select latest run → Download `debug-screenshot` artifact
2. Check if the page loaded correctly
3. You may need to adjust the wait times or price patterns in `check-price.js`

## 🤝 Contributing

Feel free to open issues or submit pull requests!

## 📄 License

MIT License - feel free to use and modify for your own needs.

---

Made with ❤️ for finding the best flight deals
