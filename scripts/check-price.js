const puppeteer = require("puppeteer");

const ISROTEL_URL =
  "https://www.isrotel.co.il/searchresult/%D7%97%D7%93%D7%A8-%D7%91%D7%9E%D7%9C%D7%95%D7%9F/?SearchQuery=KD/25-09-2026/27-09-2026/2-0-1/-1/r17008";

const HOTEL_NAME = "קדמא - חדר עם מרפסת ודלת מקשרת";
const DATES = "25-27/09/2026";

async function sendTelegramMessage(message) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return false;
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  const data = await response.json();
  console.log("Telegram response:", data.ok ? "Success" : data.description);
  return data.ok;
}

function formatPrice(price) {
  return `${price.toLocaleString("he-IL")} ₪`;
}

function formatDiff(diff) {
  const sign = diff > 0 ? "+" : "";
  return `${sign}${diff.toLocaleString("he-IL")} ₪`;
}

async function main() {
  console.log("Starting price check...");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // Set Hebrew locale
    await page.setExtraHTTPHeaders({
      "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
    });

    console.log("Loading page...");
    await page.goto(ISROTEL_URL, { waitUntil: "networkidle2", timeout: 60000 });

    // Wait for the room results to load - look for common patterns
    console.log("Waiting for room content to load...");

    // Wait longer for dynamic content
    await new Promise(r => setTimeout(r, 5000));

    // Try waiting for specific elements
    try {
      await page.waitForSelector('.room-option, .price-value, .room-price, [data-price], .total-price', { timeout: 15000 });
    } catch (e) {
      console.log("Specific selectors not found, trying generic approach...");
    }

    // Wait a bit more for any AJAX calls
    await new Promise(r => setTimeout(r, 3000));

    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
    console.log("Screenshot saved as debug-screenshot.png");

    // Get full page HTML for debugging
    const pageContent = await page.content();
    console.log("Page length:", pageContent.length);

    // Search for price patterns in the full HTML
    const htmlPriceMatches = pageContent.match(/(\d{1,3}(?:,\d{3})+)\s*₪/g) || [];
    console.log("Prices found in HTML:", htmlPriceMatches.slice(0, 10));

    // Extract prices from the page
    const prices = await page.evaluate(() => {
      const results = [];

      // Method 1: Find all text containing prices (format: X,XXX ₪)
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      while (walker.nextNode()) {
        const text = walker.currentNode.textContent.trim();
        const match = text.match(/(\d{1,3}(?:,\d{3})*)\s*₪/);
        if (match) {
          const price = parseInt(match[1].replace(/,/g, ""));
          if (price > 1000 && price < 50000) {
            results.push(price);
          }
        }
      }

      // Method 2: Look for specific price containers
      const priceSelectors = [
        '.price', '.room-price', '.total-price', '.price-value',
        '[class*="price"]', '[class*="Price"]', '[data-price]'
      ];

      priceSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          const text = el.textContent || el.getAttribute('data-price') || '';
          const match = text.match(/(\d{1,3}(?:,\d{3})*)/);
          if (match) {
            const price = parseInt(match[1].replace(/,/g, ""));
            if (price > 1000 && price < 50000) {
              results.push(price);
            }
          }
        });
      });

      // Method 3: Check innerHTML for hidden price data
      const bodyHtml = document.body.innerHTML;
      const htmlMatches = bodyHtml.match(/(\d{1,3},\d{3})\s*₪/g) || [];
      htmlMatches.forEach(match => {
        const price = parseInt(match.replace(/[,₪\s]/g, ""));
        if (price > 1000 && price < 50000) {
          results.push(price);
        }
      });

      return [...new Set(results)].sort((a, b) => b - a);
    });

    console.log("Found prices:", prices);

    if (prices.length === 0) {
      console.log("No prices found - check the debug screenshot");
      await sendTelegramMessage(
        `⚠️ <b>Warning</b>\n\nCouldn't find prices on the page.\nCheck the GitHub Actions artifacts for a screenshot.\n\n🔗 <a href="${ISROTEL_URL}">Check manually</a>`
      );
      // Don't exit with error - let the workflow complete so we can see the screenshot
      return;
    }

    const currentPrice = {
      sitePrice: prices[0] || 0,
      discountPrice: prices[1] || prices[0] || 0,
      clubPrice: prices[2] || prices[1] || prices[0] || 0,
      timestamp: new Date().toISOString(),
    };

    console.log("Current prices:", currentPrice);

    // Read previous price from file (GitHub Actions cache)
    const fs = require("fs");
    const priceFile = "last_price.json";
    let lastPrice = null;

    if (fs.existsSync(priceFile)) {
      try {
        lastPrice = JSON.parse(fs.readFileSync(priceFile, "utf8"));
        console.log("Previous prices:", lastPrice);
      } catch (e) {
        console.log("Could not read previous price file");
      }
    }

    // Save current price
    fs.writeFileSync(priceFile, JSON.stringify(currentPrice, null, 2));

    // First run - notify start
    if (!lastPrice) {
      await sendTelegramMessage(
        `🏨 <b>Started monitoring!</b>\n\n` +
          `<b>${HOTEL_NAME}</b>\n` +
          `📅 ${DATES}\n\n` +
          `💰 Site price: <b>${formatPrice(currentPrice.sitePrice)}</b>\n` +
          `💰 Discount price: <b>${formatPrice(currentPrice.discountPrice)}</b>\n` +
          `💰 Club price: <b>${formatPrice(currentPrice.clubPrice)}</b>\n\n` +
          `🔗 <a href="${ISROTEL_URL}">Book now</a>`
      );
      return;
    }

    // Check for changes
    const changes = [];

    if (currentPrice.sitePrice !== lastPrice.sitePrice) {
      const diff = currentPrice.sitePrice - lastPrice.sitePrice;
      const emoji = diff > 0 ? "📈" : "📉";
      changes.push(
        `${emoji} Site price: <b>${formatPrice(currentPrice.sitePrice)}</b> (was: <s>${formatPrice(lastPrice.sitePrice)}</s>, ${formatDiff(diff)})`
      );
    }

    if (currentPrice.discountPrice !== lastPrice.discountPrice) {
      const diff = currentPrice.discountPrice - lastPrice.discountPrice;
      const emoji = diff > 0 ? "📈" : "📉";
      changes.push(
        `${emoji} Discount price: <b>${formatPrice(currentPrice.discountPrice)}</b> (was: <s>${formatPrice(lastPrice.discountPrice)}</s>, ${formatDiff(diff)})`
      );
    }

    if (currentPrice.clubPrice !== lastPrice.clubPrice) {
      const diff = currentPrice.clubPrice - lastPrice.clubPrice;
      const emoji = diff > 0 ? "📈" : "📉";
      changes.push(
        `${emoji} Club price: <b>${formatPrice(currentPrice.clubPrice)}</b> (was: <s>${formatPrice(lastPrice.clubPrice)}</s>, ${formatDiff(diff)})`
      );
    }

    if (changes.length > 0) {
      await sendTelegramMessage(
        `🚨 <b>Price changed!</b>\n\n` +
          `<b>${HOTEL_NAME}</b>\n` +
          `📅 ${DATES}\n\n` +
          changes.join("\n") +
          `\n\n⏰ ${new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })}\n` +
          `🔗 <a href="${ISROTEL_URL}">Book now</a>`
      );
      console.log("Price change notification sent!");
    } else {
      console.log("No price changes detected.");
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
