# Isrotel Price Monitor

מעקב אחר מחירי חדרים בישרוטל כל 15 דקות עם התראות בטלגרם.

## איך זה עובד

משתמש ב-**GitHub Actions** עם **Puppeteer** כדי:
1. לטעון את עמוד ישרוטל בדפדפן headless
2. לחכות ש-JavaScript יטען את המחירים
3. להשוות למחיר הקודם (שמור ב-cache)
4. לשלוח הודעת טלגרם אם המחיר השתנה

## התקנה

### 1. העלה ל-GitHub

```bash
git add .
git commit -m "Update"
git push
```

### 2. הוסף Secrets

לך ל-repo → Settings → Secrets and variables → Actions → New repository secret

הוסף:
- `TELEGRAM_BOT_TOKEN`: הטוקן מ-BotFather
- `TELEGRAM_CHAT_ID`: ה-Chat ID שלך

### 3. הפעל

לך ל-Actions → Enable workflows

ה-workflow רץ **אוטומטית כל 15 דקות**.

## דוגמת הודעה

```
🚨 שינוי מחיר!

קדמא - חדר עם מרפסת ודלת מקשרת
📅 25-27/09/2026

📉 מחיר מועדון: 3,800 ₪ (היה: 4,045 ₪, -245 ₪)

⏰ 24/09/2026, 14:30:00
🔗 להזמנה
```

## הרצה ידנית

אפשר להריץ ידנית מ-Actions → Check Isrotel Price → Run workflow
