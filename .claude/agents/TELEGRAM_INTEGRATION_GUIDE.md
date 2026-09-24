# Telegram Bot Integration Guide

Use this guide to send alerts/messages to your Telegram bot from any external project.

## Prerequisites

You need two things from your existing bot:

| Variable | Description | How to get it |
|----------|-------------|---------------|
| `TELEGRAM_BOT_TOKEN` | Your bot's API token | From [@BotFather](https://t.me/BotFather) on Telegram |
| `TELEGRAM_CHAT_ID` | The chat/channel to send messages to | See [Getting Chat ID](#getting-your-chat-id) below |

---

## Quick Start

### Send a Message (cURL)

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "<YOUR_CHAT_ID>",
    "text": "🚨 Price Alert: Product X dropped to $99!",
    "parse_mode": "HTML"
  }'
```

### Send a Message (JavaScript/TypeScript)

```typescript
async function sendTelegramAlert(message: string): Promise<boolean> {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    }
  );

  const data = await response.json();
  return data.ok;
}

// Usage
await sendTelegramAlert('🚨 <b>Price Drop!</b>\nProduct X is now $99');
```

### Send a Message (Python)

```python
import os
import requests

def send_telegram_alert(message: str) -> bool:
    bot_token = os.environ['TELEGRAM_BOT_TOKEN']
    chat_id = os.environ['TELEGRAM_CHAT_ID']

    response = requests.post(
        f'https://api.telegram.org/bot{bot_token}/sendMessage',
        json={
            'chat_id': chat_id,
            'text': message,
            'parse_mode': 'HTML',
            'disable_web_page_preview': True,
        }
    )

    return response.json().get('ok', False)

# Usage
send_telegram_alert('🚨 <b>Price Drop!</b>\nProduct X is now $99')
```

---

## Message Formatting

### HTML Mode (Recommended)

```html
<b>Bold text</b>
<i>Italic text</i>
<u>Underlined text</u>
<s>Strikethrough</s>
<code>Inline code</code>
<pre>Code block</pre>
<a href="https://example.com">Link text</a>
```

### Example Alert Template

```typescript
const alertMessage = `
🚨 <b>PRICE ALERT</b> 🚨

<b>Product:</b> ${productName}
<b>Store:</b> ${storeName}
<b>Current Price:</b> $${currentPrice}
<b>Previous Price:</b> <s>$${previousPrice}</s>
<b>Discount:</b> ${discountPercent}% off

🔗 <a href="${productUrl}">View Product</a>

⏰ ${new Date().toISOString()}
`;
```

---

## Getting Your Chat ID

### Option 1: Using @userinfobot
1. Search for `@userinfobot` on Telegram
2. Start a chat and send any message
3. It will reply with your user ID (this is your chat ID)

### Option 2: Using your bot
1. Send any message to your bot
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Find the `chat.id` in the response JSON

### Option 3: For Groups/Channels
1. Add your bot to the group/channel
2. Send a message in the group
3. Check `getUpdates` endpoint for the chat ID
4. Group IDs are negative numbers (e.g., `-1001234567890`)

---

## Full Reusable Class

```typescript
// telegram-alert.ts

interface TelegramResponse {
  ok: boolean;
  result?: {
    message_id: number;
    date: number;
  };
  error_code?: number;
  description?: string;
}

export class TelegramAlertService {
  private readonly baseUrl: string;
  private readonly chatId: string;

  constructor(botToken: string, chatId: string) {
    if (!botToken) throw new Error('Bot token is required');
    if (!chatId) throw new Error('Chat ID is required');

    this.baseUrl = `https://api.telegram.org/bot${botToken}`;
    this.chatId = chatId;
  }

  async sendMessage(
    text: string,
    parseMode: 'HTML' | 'MarkdownV2' = 'HTML'
  ): Promise<TelegramResponse> {
    const response = await fetch(`${this.baseUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: this.chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });

    return response.json();
  }

  async sendPriceAlert(
    productName: string,
    currentPrice: number,
    previousPrice: number,
    url: string
  ): Promise<TelegramResponse> {
    const discount = ((previousPrice - currentPrice) / previousPrice * 100).toFixed(1);

    const message = `
🚨 <b>PRICE DROP ALERT</b> 🚨

📦 <b>Product:</b> ${productName}
💰 <b>Price:</b> $${currentPrice} <s>$${previousPrice}</s>
📉 <b>Discount:</b> ${discount}% off

🔗 <a href="${url}">Buy Now</a>
    `.trim();

    return this.sendMessage(message);
  }

  async sendErrorAlert(error: string, context?: string): Promise<TelegramResponse> {
    const message = `
⚠️ <b>ERROR ALERT</b>

<code>${error}</code>
${context ? `\n📍 Context: ${context}` : ''}

⏰ ${new Date().toISOString()}
    `.trim();

    return this.sendMessage(message);
  }
}
```

### Usage in Your Project

```typescript
import { TelegramAlertService } from './telegram-alert';

const telegram = new TelegramAlertService(
  process.env.TELEGRAM_BOT_TOKEN!,
  process.env.TELEGRAM_CHAT_ID!
);

// Send price alert
await telegram.sendPriceAlert(
  'Nike Air Max 90',
  89.99,
  129.99,
  'https://store.com/product/123'
);

// Send custom message
await telegram.sendMessage('✅ Price monitoring started');

// Send error alert
await telegram.sendErrorAlert('Failed to fetch prices', 'Website timeout');
```

---

## Environment Variables

Add these to your `.env` file:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

---

## API Reference

### sendMessage Endpoint

```
POST https://api.telegram.org/bot{token}/sendMessage
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chat_id` | string/number | Yes | Target chat ID |
| `text` | string | Yes | Message text (up to 4096 chars) |
| `parse_mode` | string | No | `HTML` or `MarkdownV2` |
| `disable_web_page_preview` | boolean | No | Disable link previews |
| `disable_notification` | boolean | No | Send silently |

### Response

```json
{
  "ok": true,
  "result": {
    "message_id": 123,
    "date": 1234567890,
    "chat": {
      "id": 1124533515,
      "type": "private"
    },
    "text": "Your message here"
  }
}
```

---

## Rate Limits

Telegram enforces rate limits:
- **1 message per second** to the same chat
- **30 messages per second** overall
- **20 messages per minute** to the same group

For price monitoring, consider batching alerts or adding delays between messages.

---

## Tips for Price Monitoring

1. **Batch similar alerts** - Group multiple price drops into one message
2. **Add thresholds** - Only alert when price drops > 10%
3. **Include timestamps** - Know exactly when the price changed
4. **Add product images** - Use `sendPhoto` for visual alerts
5. **Silent mode** - Use `disable_notification: true` for non-urgent alerts

---

## Need Help?

- [Telegram Bot API Docs](https://core.telegram.org/bots/api)
- [BotFather](https://t.me/BotFather) - Create/manage bots
