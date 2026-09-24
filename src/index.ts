interface Env {
  PRICE_STORE: KVNamespace;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

interface PriceData {
  sitePrice: number;
  discountPrice: number;
  clubPrice: number;
  timestamp: string;
}

const ISROTEL_URL =
  "https://www.isrotel.co.il/searchresult/%D7%97%D7%93%D7%A8-%D7%91%D7%9E%D7%9C%D7%95%D7%9F/?SearchQuery=KD/25-09-2026/27-09-2026/2-0-1/-1/r17008";

const HOTEL_NAME = "קדמא - חדר עם מרפסת ודלת מקשרת";
const DATES = "25-27/09/2026";

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(checkPriceAndNotify(env));
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Manual trigger endpoint
    if (url.pathname === "/check") {
      await checkPriceAndNotify(env);
      return new Response("Price check completed. Check Telegram for updates.");
    }

    // Status endpoint
    if (url.pathname === "/status") {
      const lastPrice = await env.PRICE_STORE.get("last_price");
      return new Response(
        JSON.stringify({
          lastPrice: lastPrice ? JSON.parse(lastPrice) : null,
          monitoredUrl: ISROTEL_URL,
          hotel: HOTEL_NAME,
          dates: DATES,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Test the Isrotel API directly
    if (url.pathname === "/test-api") {
      try {
        // Step 1: Load the main page to get cookies
        const pageResponse = await fetch(ISROTEL_URL, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });

        const cookies = pageResponse.headers.get("set-cookie") || "";

        // Step 2: Call the API with cookies
        const apiUrl = "https://www.isrotel.co.il/umbraco/Surface/Search/GetSingleHotelSearchResults";
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "*/*",
            "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            Origin: "https://www.isrotel.co.il",
            Referer: ISROTEL_URL,
            Cookie: cookies.split(",").map((c) => c.split(";")[0]).join("; "),
          },
          body: "SearchQuery=KD/25-09-2026/27-09-2026/2-0-1/-1/r17008",
        });

        const text = await response.text();

        // Try to find prices in the response
        const pricePattern = /(\d{1,3}(?:,\d{3})*)\s*₪/g;
        const matches = [...text.matchAll(pricePattern)];
        const prices = matches.map((m) => m[1]);

        return new Response(
          JSON.stringify({
            status: response.status,
            contentType: response.headers.get("content-type"),
            responseLength: text.length,
            cookies: cookies.substring(0, 300),
            foundPrices: prices.slice(0, 20),
            sample: text.substring(0, 3000),
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Debug endpoint - fetch and show raw response info
    if (url.pathname === "/debug") {
      try {
        const response = await fetch(ISROTEL_URL, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
          },
        });
        const html = await response.text();

        // Find all prices in the HTML
        const pricePattern = /(\d{1,3}(?:,\d{3})*)\s*₪/g;
        const matches = [...html.matchAll(pricePattern)];
        const prices = matches.map((m) => m[1]);

        // Look for JSON price data
        const jsonPricePattern = /"price"\s*:\s*(\d+)/g;
        const jsonMatches = [...html.matchAll(jsonPricePattern)];
        const jsonPrices = jsonMatches.map((m) => m[1]);

        // Search for API endpoints or data in script tags
        const apiPattern = /umbraco\/[^"'\s]*/gi;
        const apiMatches = [...new Set([...html.matchAll(apiPattern)].map((m) => m[0]))];

        // Look for SearchQuery or room data
        const dataPattern = /SearchQuery[^<]*/gi;
        const dataMatches = [...html.matchAll(dataPattern)].map((m) => m[0].substring(0, 200));

        // Find ALL script tags and search for room/hotel data
        const scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/gi;
        const scriptContents: string[] = [];
        const allScriptsPreview: string[] = [];
        let match;
        while ((match = scriptPattern.exec(html)) !== null) {
          const content = match[1].trim();
          if (content.length > 50) {
            allScriptsPreview.push(content.substring(0, 150));
          }
          if (
            content.includes("hotelRooms") ||
            content.includes("roomData") ||
            content.includes("searchResult") ||
            content.includes("4495") ||
            content.includes("4,495") ||
            content.includes("4270") ||
            content.includes("4045")
          ) {
            scriptContents.push(content.substring(0, 1000));
          }
        }

        // Search for data attributes with prices
        const dataAttrPattern = /data-[^=]*price[^=]*="([^"]*)"/gi;
        const dataAttrs = [...html.matchAll(dataAttrPattern)].map((m) => m[0]);

        return new Response(
          JSON.stringify({
            status: response.status,
            statusText: response.statusText,
            htmlLength: html.length,
            foundPrices: prices.slice(0, 20),
            jsonPrices: jsonPrices.slice(0, 10),
            apiEndpoints: apiMatches.slice(0, 10),
            dataMatches: dataMatches.slice(0, 5),
            scriptsWithPrice: scriptContents.slice(0, 3),
            dataAttributes: dataAttrs.slice(0, 10),
            totalScripts: allScriptsPreview.length,
            scriptPreviews: allScriptsPreview.slice(0, 10),
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      `Isrotel Price Monitor\n\nEndpoints:\n- /check - Trigger manual price check\n- /status - View last recorded price`,
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  },
};

async function checkPriceAndNotify(env: Env): Promise<void> {
  try {
    const currentPrice = await fetchPrice();

    if (!currentPrice) {
      await sendTelegramMessage(
        env,
        `⚠️ <b>שגיאה</b>\n\nלא הצלחתי למשוך מחיר מהאתר.\nייתכן שהעמוד השתנה.\n\n🔗 <a href="${ISROTEL_URL}">בדוק ידנית</a>`
      );
      return;
    }

    const lastPriceJson = await env.PRICE_STORE.get("last_price");
    const lastPrice: PriceData | null = lastPriceJson ? JSON.parse(lastPriceJson) : null;

    // Save current price
    await env.PRICE_STORE.put("last_price", JSON.stringify(currentPrice));

    // First run - just save and notify
    if (!lastPrice) {
      await sendTelegramMessage(
        env,
        `🏨 <b>התחלתי לעקוב!</b>\n\n` +
          `<b>${HOTEL_NAME}</b>\n` +
          `📅 ${DATES}\n\n` +
          `💰 מחיר אתר: <b>${formatPrice(currentPrice.sitePrice)}</b>\n` +
          `💰 מחיר עם הנחה: <b>${formatPrice(currentPrice.discountPrice)}</b>\n` +
          `💰 מחיר מועדון: <b>${formatPrice(currentPrice.clubPrice)}</b>\n\n` +
          `🔗 <a href="${ISROTEL_URL}">לעמוד ההזמנה</a>`
      );
      return;
    }

    // Check for changes
    const changes: string[] = [];

    if (currentPrice.sitePrice !== lastPrice.sitePrice) {
      const diff = currentPrice.sitePrice - lastPrice.sitePrice;
      const emoji = diff > 0 ? "📈" : "📉";
      changes.push(
        `${emoji} מחיר אתר: <b>${formatPrice(currentPrice.sitePrice)}</b> (היה: <s>${formatPrice(lastPrice.sitePrice)}</s>, ${formatDiff(diff)})`
      );
    }

    if (currentPrice.discountPrice !== lastPrice.discountPrice) {
      const diff = currentPrice.discountPrice - lastPrice.discountPrice;
      const emoji = diff > 0 ? "📈" : "📉";
      changes.push(
        `${emoji} מחיר הנחה: <b>${formatPrice(currentPrice.discountPrice)}</b> (היה: <s>${formatPrice(lastPrice.discountPrice)}</s>, ${formatDiff(diff)})`
      );
    }

    if (currentPrice.clubPrice !== lastPrice.clubPrice) {
      const diff = currentPrice.clubPrice - lastPrice.clubPrice;
      const emoji = diff > 0 ? "📈" : "📉";
      changes.push(
        `${emoji} מחיר מועדון: <b>${formatPrice(currentPrice.clubPrice)}</b> (היה: <s>${formatPrice(lastPrice.clubPrice)}</s>, ${formatDiff(diff)})`
      );
    }

    if (changes.length > 0) {
      await sendTelegramMessage(
        env,
        `🚨 <b>שינוי מחיר!</b>\n\n` +
          `<b>${HOTEL_NAME}</b>\n` +
          `📅 ${DATES}\n\n` +
          changes.join("\n") +
          `\n\n⏰ ${formatDateTime()}\n` +
          `🔗 <a href="${ISROTEL_URL}">להזמנה</a>`
      );
    }
  } catch (error) {
    console.error("Error checking price:", error);
    await sendTelegramMessage(
      env,
      `⚠️ <b>שגיאה בבדיקת מחיר</b>\n\n<code>${error instanceof Error ? error.message : "Unknown error"}</code>`
    );
  }
}

async function fetchPrice(): Promise<PriceData | null> {
  // Fetch the page HTML with browser-like headers
  const response = await fetch(ISROTEL_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"macOS"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  // Debug: log the HTML length
  console.log(`Fetched HTML length: ${html.length} chars`);

  // Try to find prices in the HTML
  // Looking for patterns like "4,495 ₪" or "4495"
  const pricePattern = /(\d{1,3}(?:,\d{3})*)\s*₪/g;
  const matches = [...html.matchAll(pricePattern)];

  if (matches.length === 0) {
    // Try alternative: look for JSON data in script tags
    const jsonPricePattern = /"price"\s*:\s*(\d+)/g;
    const jsonMatches = [...html.matchAll(jsonPricePattern)];

    if (jsonMatches.length > 0) {
      const prices = jsonMatches.map((m) => parseInt(m[1]));
      return {
        sitePrice: prices[0] || 0,
        discountPrice: prices[1] || prices[0] || 0,
        clubPrice: prices[2] || prices[1] || prices[0] || 0,
        timestamp: new Date().toISOString(),
      };
    }

    return null;
  }

  // Parse found prices
  const prices = matches
    .map((m) => parseInt(m[1].replace(/,/g, "")))
    .filter((p) => p > 1000 && p < 50000) // Filter reasonable hotel prices
    .sort((a, b) => b - a); // Sort descending (highest first)

  if (prices.length === 0) {
    return null;
  }

  // Remove duplicates
  const uniquePrices = [...new Set(prices)];

  return {
    sitePrice: uniquePrices[0] || 0,
    discountPrice: uniquePrices[1] || uniquePrices[0] || 0,
    clubPrice: uniquePrices[2] || uniquePrices[1] || uniquePrices[0] || 0,
    timestamp: new Date().toISOString(),
  };
}

async function sendTelegramMessage(env: Env, text: string): Promise<boolean> {
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  const data = (await response.json()) as { ok: boolean };
  return data.ok;
}

function formatPrice(price: number): string {
  return `${price.toLocaleString("he-IL")} ₪`;
}

function formatDiff(diff: number): string {
  const sign = diff > 0 ? "+" : "";
  return `${sign}${diff.toLocaleString("he-IL")} ₪`;
}

function formatDateTime(): string {
  return new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
}
