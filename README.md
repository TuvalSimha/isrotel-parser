# 🏨 Isrotel Price Monitor

Automated price monitoring for [Isrotel](https://www.isrotel.co.il/) hotel rooms. Get instant Telegram notifications when prices change!

## ✨ Features

- 🔄 **Automatic monitoring** - Checks prices every 5 minutes via GitHub Actions
- 📱 **Telegram notifications** - Instant alerts when prices change (up or down)
- 🏷️ **All price types** - Tracks site price, discount price, and club member price
- 📅 **Multiple dates** - Monitor several date ranges simultaneously
- 🛏️ **Multiple rooms** - Tracks all available room types per date

## 📸 Example Notification

```
🔔 היי! יש שינוי במחיר!

🏨 מלון קדמא
📅 תאריכים: 25-27/09/2026
━━━━━━━━━━━━━━━

🛏️ חדר קדמא עם מרפסת

📉 ירד: מחיר מועדון
   לפני: 4,045 ₪
   עכשיו: 3,800 ₪ 🔻 -245 ₪

📊 כל המחירים העדכניים:
   💵 באתר: 4,200 ₪
   🏷️ עם הנחה: 3,990 ₪
   ⭐ מועדון: 3,800 ₪

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

### 5. Configure your dates and hotel

Edit `scripts/check-price.js` and update the `SEARCHES` array:

```javascript
const SEARCHES = [
  {
    id: "my-trip",
    dates: "25-27/09/2026",
    url: "https://www.isrotel.co.il/searchresult/...", // Your Isrotel search URL
  },
  // Add more date ranges as needed
];

const HOTEL_NAME = "קדמא"; // Update hotel name
```

**How to get the URL:**
1. Go to [isrotel.co.il](https://www.isrotel.co.il/)
2. Search for your desired hotel, dates, and guests
3. Copy the full URL from your browser

### 6. Enable GitHub Actions

Go to **Actions** tab → Click **"I understand my workflows, go ahead and enable them"**

### 7. Done! 🎉

The monitor will check prices every 5 minutes and send you Telegram notifications when prices change.

## ⚙️ Configuration

### Change check frequency

Edit `.github/workflows/check-price.yml`:

```yaml
schedule:
  - cron: '*/5 * * * *'   # Every 5 minutes
  # - cron: '*/15 * * * *' # Every 15 minutes
  # - cron: '0 * * * *'    # Every hour
```

### Manual check

Go to **Actions** → **Check Isrotel Price** → **Run workflow**

This will send you a status message even if prices haven't changed.

## 🛠️ How It Works

1. **GitHub Actions** runs the workflow on schedule
2. **Puppeteer** (headless browser) loads the Isrotel page
3. Waits for JavaScript to render the prices
4. Extracts all room types and their prices
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
- **5-minute minimum** - GitHub Actions doesn't allow schedules more frequent than every 5 minutes
- **Best effort timing** - Scheduled runs may be delayed during high GitHub load
- **Secrets are safe** - Even in public repos, GitHub Secrets are encrypted and never exposed

## 🤝 Contributing

Feel free to open issues or submit pull requests!

## 📄 License

MIT License - feel free to use and modify for your own needs.

---

Made with ❤️ for finding the best hotel deals
