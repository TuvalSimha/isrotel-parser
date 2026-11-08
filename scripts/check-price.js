const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");

// Add stealth plugin to avoid bot detection
puppeteer.use(StealthPlugin());

// USD to ILS exchange rate (update as needed)
const USD_TO_ILS = 3.7;

// Configuration - EL AL flight search
const SEARCHES = [
  {
    id: "tlv-beg-jun-3-6",
    route: "TLV ↔ BEG",
    outbound: "TLV → BEG",
    return: "BEG → TLV",
    outboundHebrew: "תל אביב → בלגרד",
    returnHebrew: "בלגרד → תל אביב",
    outboundDate: "03/06/2027",
    returnDate: "06/06/2027",
    url: "https://booking.elal.com/engine?iT=MzEsMTM5LDgsMCwwLDAsMCwwLDAsMywyMzcsODcsMjA5LDE0NiwxNjIsNTYsMjAsMjUzLDI0LDIwMyw3MSw0NSw2NCw2OCwxMjEsMTc2LDQ0LDQsMjMzLDE5OCw4MSwxNTYsODYsMTkyLDIxNCwxNTEsMTc0LDAsODEsMjEwLDM0LDE4NCwzMywxMDYsMjM1LDIxNSw3OSwyLDEwLDExNiwxMzksMTgxLDUxLDkxLDE4NywxODEsNDcsMjUzLDk2LDc2LDIzOCwxODksNTcsNTcsNTUsMTU2LDE1NSw2NCwzMSw4OSw2MSwxMjAsMzAsNSwyMzgsMTQ3LDEzNSwxNjYsMTA0LDEwMCwyMTYsMjMsMTMxLDU1LDIwOSw3MiwxMTAsODIsMjI3LDE5Nyw5NSwyNCwyMTIsMTA0LDE0NCwxMDEsMTY0LDE3MSw5NiwyMDksODYsMTI5LDI5LDcyLDE2NiwzMCw3MCw2Myw0NiwxNTUsMjE0LDIwMyw4NiwxOTYsMTgyLDExMCw5NSwxNTYsMzksMTI1LDIzMyw1NiwxMjYsMjE5LDE0Miw3MCwxMzUsMTM3LDI0MywxMTQsNCwyMDYsMjQyLDEwNCw2MSwyMzcsMTk3LDE0OSwyMjQsODgsMTQyLDE5NywxNjEsMTc3LDU4LDE4Niw0NCw1LDI0OSwxODAsMTIyLDE1NywxNjAsMTA1LDE1MiwzMiwxMjMsNDMsNzksMTAyLDE0Miw2MCwxNzYsMTgyLDI0MiwxMTYsOTcsMjQzLDYzLDI5LDE5OSw5MiwyMTEsMTU5LDExMCwxNjMsMTQ1LDc5LDk5LDk5LDE4MywxMDEsMTE0LDE5OCwxMjMsMTQwLDIyMCwyMzEsMjQwLDIyOCwyMzcsMTg2LDE5NiwyMywxNTAsMjMxLDI0MSwyMzUsMTM4LDEyMCwxNzMsMjAxLDEwNSwxNjIsNDEsMTY3LDE1MSwxMTksMTU1LDk3LDE1OCwxNTEsMTM5LDI0NiwyMTQsMjEsNTYsNzAsMTIyLDQ5LDExNywyMDQsMTQ5LDE2NSwyNiwxMzcsMTc3LDExLDMsOTUsNTMsMTY0LDEzNywyMjksMTgxLDc3LDEwOSwyMDAsMTU1LDIxOCwyNDIsNjAsODUsNzksMTA0LDI0NSwyNiwxNTYsNDAsMjMwLDEzNSwxMjEsMjE3LDExNCwxOSwyMDMsMjIsMzksMjM5LDEzNCwxODQsMTI2LDEwNSwxOTAsMTA1LDE5MywyMTksMTA1LDE4LDczLDIwMSwxMjgsMTUyLDIzNSwxODMsMTU5LDMxLDEwMCw1OCwxMjYsMjE0LDIwOSwxMjYsNjcsNDYsMjM1LDE1MywyMSwyNTIsMjQ4LDI0OCwyMzUsNTMsMTA2LDIzNSwxMTEsMTUwLDE3MSwxMiwyMzYsOTAsMjIzLDIxMSwxMjMsMTE3LDY1LDExNiwyMjcsMTIwLDEzOSwxNjIsMTQxLDI2LDEzMCwzNiwxMjksNzMsOTMsMjI4LDIzNCw0NSwxMywxMjIsMTEzLDIwLDIzOSwyMDYsMTE3LDY1LDE2MiwxMzEsNjEsMTM0LDU5LDExNiwyMTYsMTAxLDMsMjQ3LDE0NCwxNjAsOCwzOCw3MywxODksNTMsMTYwLDYsMTMwLDIwOSwxNTgsMjA1LDE2LDE5Niw4LDIzNiwzMiwxMTcsMTk5LDcsMjI2LDE5OCwxMzUsMjAwLDE2NywxOTAsMjQsMTYzLDEzLDEzOCwxMCw4Nyw5MywxMDQsMTA3LDI5LDIxOCw0MCwyMjAsMTczLDM5LDE1LDI0MywxNTgsNzQsMjcsMzMsMTE5LDQwLDc0LDIyMiwxOSwyNDIsMTQ0LDExOCwxMTAsMTksMTE1LDE1NSwyNDgsMTA1LDE1NCwyMDQsMjMxLDYxLDI1MywxNzksMTYzLDEwLDE2NSwxNTUsMjE5LDIyOCwxMjMsNDcsMywxNDQsMTg4LDIxNiwxMDMsMTk2LDE3MywxNzcsNjcsNywzMywxMTIsOTcsMTUyLDE2NiwzMywyMzcsNjcsMjI0LDY1LDE5NSwxNzUsMTgzLDE0OCwyMzIsMTYsMTM0LDIwNCwyMywxMjMsMTI4LDE2MCwxNTIsMzcsMjM1LDMzLDExNCw0NiwzOSwxNTUsMTAzLDI0MiwzNyw2OSwxODUsMTM4LDE4MSw5MiwxODIsNzMsMTIsMjAyLDIwNCwyNDYsNDYsMTYzLDIyNCwyMDksMTU3LDM3LDE4NCwxMiw5NSwyMDQsODAsMjI4LDEzOCwxOTYsMTg0LDI0MiwyMjYsMTgzLDIzMyw4Nyw3Miw5OSw3Niw3NywzMiw2OCwzMiw5NywyNDgsNTIsNTMsMTk4LDc4LDU3LDE2Miw5OSw5MywyMDAsMTUyLDI2LDksNiwyMDQsMjUyLDIzMiwyMDksMjUyLDExMyw2Niw5NSwyMjYsMjU1LDEyOCwxMjIsNTQsNTEsMjIxLDEzMiw3MSwxMzksNDIsMTU3LDIyMCwxNjYsMTI0LDM4LDkyLDExMiw0MCwxMTYsMTYzLDE1MSwxMDksOTUsMzIsMTEsOTUsMjM1LDE1OCw4NywxMzcsMjM1LDE2Nyw1LDExMSwyNCwyMTcsMjU1LDU0LDEwOSwxMzcsMjMsMTIwLDU1LDc1LDAsNDgsMjE3LDYyLDEwMiw0Nyw0MywzNyw2NiwxMDUsMTAxLDE3NywxMzUsMTkxLDY0LDM2LDE1MiwxOTUsMzUsMTk2LDMyLDg0LDE2LDIyMiwxOTksMTUyLDM2LDEzMywyMzAsMTI0LDEzMiwxNjEsNzEsMjMyLDEyMCwxMywxOTQsNCwxNjYsMTgxLDgsMTA0LDE4NSwyMSw5OSwyMzksMTI4LDQ5LDE0MCwxODgsMTc5LDE1NCwxNjksMjE2LDI0LDIwNyw1MSwxMDAsMzEsMzgsNCw2OSw1NSwxODksNjIsNDYsMjA2LDE3MCw3NiwxMzksMjUwLDgwLDMxLDIxMyw5NiwxNzcsODUsMTI0LDExNywyNDAsMTczLDE3Miw2LDE5NSwxNjcsMTI3LDkyLDg2LDExNCwyMSwxMTgsOTQsMjI4LDM3LDI1LDE4MSw2MiwyMTUsODEsMTgyLDIzMCwxMjUsMjksMjEsOTIsNzUsMTE1LDE3MSwxMDAsNDQsMjIyLDIxMywyMDksMTA4LDk0LDE3MCwxNjMsMjAsNjMsMTIzLDIwMCwyNDMsMjI1LDEwOCw5NiwyMjgsMjAyLDI0LDEyLDE5OSw3OSw1MSw2OSwxODcsMTcxLDE2NiwxMCwyNTMsMTc4LDM1LDIzOSwxMzksNzgsOTAsMjEsODEsMjIxLDEyMywxNDAsNjYsMTg2LDc2LDE2NiwxMjcsMTkxLDE0Niw5MiwxMTMsMjA0LDg2LDczLDE1NywyMzgsMjM2LDEyNywxNjMsMjAxLDE2MSw2MSwxNjMsNzAsMjA0LDIyNCwxOCwyMjQsMTM0LDIxMiwxNjQsMTYsMTI0LDEyOCw4NywxNTcsMiwxOTQsOTgsNCw3OCwyMzIsNTIsNTYsMTY5LDE5MywxODEsNDQsMTQyLDk0LDc3LDIwMiwxODEsMTA1LDExNCwyOCwxODMsMjAyLDIsMTEsMjEsOTksNzIsMTQsNTYsMjYsMjUyLDI1NCw1LDI0NCwxNzMsMjQxLDExMSwxNDEsMjU1LDE3NSwyNiwyNTUsMjA1LDE3OSwyNDgsMjUxLDY5LDIzMywxNDUsODgsMTkxLDk1LDE0OCwyMDIsMjAzLDEyNCwxOTEsNDAsMjUzLDE1NSw0Nyw3NCw5NSw0NiwzMiwxNjksMjUwLDIsNzQsOTksMjQ3LDU2LDIyMiwxOTcsODcsMCw1NCwxMDAsMjIzLDgyLDIwOSwxMzQsMTUwLDYwLDg1LDI1MCwxMjQsMTY2LDE3OCwyNSwyMTIsMTcyLDEwNCwyMiwyMzcsNDksMjAxLDI2LDE2NiwxMjYsMTgxLDE2OSwyMDcsOTAsMjE4LDE4NywxMjYsNzksMTI5LDM1LDEyLDE3MywyNDMsNjIsMTg5LDIwNSwyMTYsNjEsMjQ2LDE1MCwxMjYsOTgsOSwxOCw3NCwyNDQsMTYsMTI2LDMyLDEyMiwxMjgsMjA0LDMzLDE5Miw5NCw4MCwyMjYsMTI3LDYxLDU0LDM2LDgsMzcsNzgsMTQ0LDE4NSwxMzQsMjM5LDExOCwyMTUsMTMsMTU4LDk1LDI0MywxNDEsMTEwLDg3LDIyNCwyNiwyMzUsNzgsODcsMTUwLDEyOCwyMzUsMjQzLDI5LDIxNSw3NywxNTMsMzQsMTUsMTA2LDQwLDE2MSwxODEsMTIxLDg2LDE1MiwxNjQsNjEsMTQ0LDQsMjEyLDE1OCwxNjQsMTc2LDkwLDE1OCwxNzksNjgsMzMsMjYsOTIsMjE1LDIyNiwzNyw3MCw4OSwxMDAsMTMsMjIzLDIwLDIxOCwxNTcsODUsMTczLDE5MSwyMTksMjQ2LDE0MCwxMTMsMTczLDMxLDEzMCwxNjgsMjMsMTkyLDkwLDEyNywxMzEsMTIzLDE4MSwyNTQsMTU4LDI0NCw1NiwyMTgsMjI2LDE1MiwyNTMsMTMzLDE3Miw5LDIyNiwyOSwyMzYsNSwxMzIsMjM2LDIxNywxNzksMTY4LDExLDg0LDQ1LDI1MCwyMzMsMTE2LDEwNiwxOTQsMTYsMTMyLDc3LDQ3LDE2NiwxNTksMTQ3LDEyMiwwLDQxLDMzLDI5LDE2NSwyMjksNjcsMjI3LDE1LDE2MCwxMDMsMiwxNzksMjE0LDE0Myw5NiwxNDMsMTc1LDI0NSwxLDEwMiwzMiwyMjIsMjE4LDEwMywxMzEsNjEsMjUzLDE2MywxOTAsOTUsMTk3LDE5MCw1MSwyMzMsMjE4LDE1LDAsMA%3D%3D",
  },
];

const PRICE_FILE = "last_prices.json";

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

function formatUSD(price) {
  return `$${price.toLocaleString("en-US")}`;
}

function formatILS(price) {
  return `${Math.round(price).toLocaleString("he-IL")} ₪`;
}

function formatDiffUSD(diff) {
  const sign = diff > 0 ? "+" : "";
  return `${sign}$${diff.toLocaleString("en-US")}`;
}

async function extractFlightsFromPage(page) {
  const html = await page.content();

  // Save HTML for debugging
  fs.writeFileSync("debug-page.html", html);
  console.log("Saved page HTML for debugging (", html.length, "bytes)");

  // Try to extract USD prices
  const usdPrices = [];
  let match;

  // Pattern: $XXX or $X,XXX
  const usdPattern = /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
  while ((match = usdPattern.exec(html)) !== null) {
    const price = parseFloat(match[1].replace(/,/g, ""));
    if (price > 50 && price < 5000) {
      usdPrices.push(price);
    }
  }

  console.log("USD prices found:", usdPrices);

  // Remove duplicates and sort
  const uniquePrices = [...new Set(usdPrices)].sort((a, b) => a - b);
  console.log("Unique USD prices:", uniquePrices);

  // For round-trip: expect 2 prices (outbound and return)
  // Take the two lowest distinct prices as the likely flight prices
  let outboundPrice = null;
  let returnPrice = null;

  if (uniquePrices.length >= 2) {
    // First two prices are likely outbound and return
    outboundPrice = uniquePrices[0];
    returnPrice = uniquePrices[1];
  } else if (uniquePrices.length === 1) {
    // Only one price found - might be same for both directions
    outboundPrice = uniquePrices[0];
    returnPrice = uniquePrices[0];
  }

  return {
    outboundPrice,
    returnPrice,
    totalUSD: outboundPrice && returnPrice ? outboundPrice + returnPrice : null,
    totalILS: outboundPrice && returnPrice ? Math.round((outboundPrice + returnPrice) * USD_TO_ILS) : null,
  };
}

async function checkSearch(browser, search, isFirst = false) {
  console.log(`\nChecking ${search.route}...`);

  const page = await browser.newPage();

  // Set realistic user agent
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  await page.setExtraHTTPHeaders({
    "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
  });

  await page.setViewport({ width: 1920, height: 1080 });

  try {
    console.log("Navigating to:", search.url);
    await page.goto(search.url, { waitUntil: "networkidle2", timeout: 120000 });

    console.log("Waiting for page to render...");
    await new Promise((r) => setTimeout(r, 15000));

    try {
      await page.waitForSelector('[class*="price"], [class*="fare"], [class*="total"], [class*="amount"]', {
        timeout: 30000,
      });
      console.log("Found price-related elements");
    } catch (e) {
      console.log("No specific price selectors found, continuing...");
    }

    await new Promise((r) => setTimeout(r, 5000));

    // Scroll down to ensure return flight section is loaded
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await new Promise((r) => setTimeout(r, 2000));
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise((r) => setTimeout(r, 2000));
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });

    if (isFirst) {
      await page.screenshot({ path: "debug-screenshot.png", fullPage: true });
      console.log("Screenshot saved");
    }

    const prices = await extractFlightsFromPage(page);
    console.log(`Extracted prices for ${search.route}:`, prices);

    return {
      id: search.id,
      route: search.route,
      outbound: search.outbound,
      return: search.return,
      outboundHebrew: search.outboundHebrew,
      returnHebrew: search.returnHebrew,
      outboundDate: search.outboundDate,
      returnDate: search.returnDate,
      url: search.url,
      outboundPrice: prices.outboundPrice,
      returnPrice: prices.returnPrice,
      totalUSD: prices.totalUSD,
      totalILS: prices.totalILS,
      timestamp: new Date().toISOString(),
    };
  } finally {
    await page.close();
  }
}

function compareSearchResults(current, previous) {
  // If no previous data or previous data has old format (flights array), treat as first run
  if (!previous || !previous.outboundPrice) return null;

  const changes = {};
  let hasChanges = false;

  if (current.outboundPrice && previous.outboundPrice && current.outboundPrice !== previous.outboundPrice) {
    changes.outbound = {
      previous: previous.outboundPrice,
      current: current.outboundPrice,
      diff: current.outboundPrice - previous.outboundPrice,
    };
    hasChanges = true;
  }

  if (current.returnPrice && previous.returnPrice && current.returnPrice !== previous.returnPrice) {
    changes.return = {
      previous: previous.returnPrice,
      current: current.returnPrice,
      diff: current.returnPrice - previous.returnPrice,
    };
    hasChanges = true;
  }

  if (current.totalUSD && previous.totalUSD && current.totalUSD !== previous.totalUSD) {
    changes.total = {
      previousUSD: previous.totalUSD,
      currentUSD: current.totalUSD,
      diffUSD: current.totalUSD - previous.totalUSD,
      previousILS: previous.totalILS,
      currentILS: current.totalILS,
    };
    hasChanges = true;
  }

  return hasChanges ? changes : null;
}

function buildPriceBlock(result) {
  let msg = "";

  if (result.outboundPrice && result.returnPrice) {
    msg += `🛫 <b>טיסת הלוך</b> (${result.outboundHebrew})\n`;
    msg += `   📅 ${result.outboundDate}\n`;
    msg += `   💵 ${formatUSD(result.outboundPrice)}\n\n`;

    msg += `🛬 <b>טיסת חזור</b> (${result.returnHebrew})\n`;
    msg += `   📅 ${result.returnDate}\n`;
    msg += `   💵 ${formatUSD(result.returnPrice)}\n\n`;

    msg += `━━━━━━━━━━━━━━━\n`;
    msg += `💰 <b>סה"כ:</b>\n`;
    msg += `   💵 ${formatUSD(result.totalUSD)}\n`;
    msg += `   💴 ${formatILS(result.totalILS)}\n`;
  } else {
    msg += `   ⚠️ לא נמצאו מחירים\n`;
    msg += `   (ייתכן שהדף לא נטען כראוי)\n`;
  }

  return msg;
}

function buildChangeMessage(result, changes) {
  let msg = `🔔 <b>היי! יש שינוי במחיר הטיסה!</b>\n\n`;
  msg += `✈️ <b>EL AL</b> | ${result.route}\n`;
  msg += `━━━━━━━━━━━━━━━\n\n`;

  if (changes.outbound) {
    const emoji = changes.outbound.diff > 0 ? "📈" : "📉";
    const diffEmoji = changes.outbound.diff > 0 ? "🔺" : "🔻";
    msg += `🛫 <b>טיסת הלוך</b> (${result.outboundHebrew})\n`;
    msg += `   📅 ${result.outboundDate}\n`;
    msg += `   ${emoji} לפני: <s>${formatUSD(changes.outbound.previous)}</s>\n`;
    msg += `   ${emoji} עכשיו: <b>${formatUSD(changes.outbound.current)}</b> ${diffEmoji} ${formatDiffUSD(changes.outbound.diff)}\n\n`;
  } else if (result.outboundPrice) {
    msg += `🛫 <b>טיסת הלוך</b> (${result.outboundHebrew})\n`;
    msg += `   📅 ${result.outboundDate}\n`;
    msg += `   💵 ${formatUSD(result.outboundPrice)} (ללא שינוי)\n\n`;
  }

  if (changes.return) {
    const emoji = changes.return.diff > 0 ? "📈" : "📉";
    const diffEmoji = changes.return.diff > 0 ? "🔺" : "🔻";
    msg += `🛬 <b>טיסת חזור</b> (${result.returnHebrew})\n`;
    msg += `   📅 ${result.returnDate}\n`;
    msg += `   ${emoji} לפני: <s>${formatUSD(changes.return.previous)}</s>\n`;
    msg += `   ${emoji} עכשיו: <b>${formatUSD(changes.return.current)}</b> ${diffEmoji} ${formatDiffUSD(changes.return.diff)}\n\n`;
  } else if (result.returnPrice) {
    msg += `🛬 <b>טיסת חזור</b> (${result.returnHebrew})\n`;
    msg += `   📅 ${result.returnDate}\n`;
    msg += `   💵 ${formatUSD(result.returnPrice)} (ללא שינוי)\n\n`;
  }

  msg += `━━━━━━━━━━━━━━━\n`;
  msg += `💰 <b>סה"כ:</b>\n`;
  msg += `   💵 <b>${formatUSD(result.totalUSD)}</b>\n`;
  msg += `   💴 <b>${formatILS(result.totalILS)}</b>\n`;

  if (changes.total) {
    const diffEmoji = changes.total.diffUSD > 0 ? "🔺" : "🔻";
    msg += `   ${diffEmoji} הפרש: ${formatDiffUSD(changes.total.diffUSD)}\n`;
  }

  msg += `\n━━━━━━━━━━━━━━━\n`;
  msg += `⏰ ${new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })}\n`;
  msg += `👉 <a href="${result.url}">לחצו כאן להזמנה</a>`;

  return msg;
}

function buildStatusMessage(results) {
  let msg = `👋 <b>היי! הנה סטטוס מחירי הטיסות</b>\n\n`;
  msg += `✈️ <b>EL AL</b>\n`;
  msg += `━━━━━━━━━━━━━━━\n\n`;

  for (const result of results) {
    msg += buildPriceBlock(result);
    msg += `\n🔗 <a href="${result.url}">להזמנה</a>\n`;
    msg += `━━━━━━━━━━━━━━━\n\n`;
  }

  msg += `✅ אין שינוי מהבדיקה הקודמת\n`;
  msg += `⏰ ${new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })}`;

  return msg;
}

function buildFirstRunMessage(results) {
  let msg = `🎉 <b>שלום! התחלתי לעקוב אחרי מחירי הטיסות עבורך!</b>\n\n`;
  msg += `✈️ <b>EL AL</b>\n`;
  msg += `━━━━━━━━━━━━━━━\n\n`;

  for (const result of results) {
    msg += buildPriceBlock(result);
    msg += `\n🔗 <a href="${result.url}">להזמנה</a>\n`;
    msg += `━━━━━━━━━━━━━━━\n\n`;
  }

  msg += `🔄 אני בודק את המחירים פעם ביום\n`;
  msg += `📬 אשלח לך הודעה ברגע שיהיה שינוי!\n\n`;
  msg += `💡 <i>טיפ: אפשר להפעיל אותי ידנית מתי שתרצה לראות את המחירים העדכניים</i>`;

  return msg;
}

async function main() {
  console.log("Starting EL AL flight price check...");

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
      "--window-size=1920,1080",
      "--start-maximized",
    ],
  });

  try {
    const results = [];
    for (let i = 0; i < SEARCHES.length; i++) {
      const result = await checkSearch(browser, SEARCHES[i], i === 0);
      results.push(result);
    }

    // Load previous prices
    let previousData = null;
    if (fs.existsSync(PRICE_FILE)) {
      try {
        previousData = JSON.parse(fs.readFileSync(PRICE_FILE, "utf8"));
        console.log("Loaded previous prices");
      } catch (e) {
        console.log("Could not read previous prices file");
      }
    }

    // Save current prices
    fs.writeFileSync(PRICE_FILE, JSON.stringify(results, null, 2));
    console.log("Saved current prices");

    // First run - send initial status
    if (!previousData) {
      const msg = buildFirstRunMessage(results);
      await sendTelegramMessage(msg);
      console.log("First run - sent initial status");
      return;
    }

    // Check for changes
    const prevMap = new Map(previousData.map((p) => [p.id, p]));
    let hasChanges = false;

    for (const result of results) {
      const prev = prevMap.get(result.id);
      const changes = compareSearchResults(result, prev);

      if (changes) {
        hasChanges = true;
        const msg = buildChangeMessage(result, changes);
        await sendTelegramMessage(msg);
        console.log(`Sent change notification for ${result.route}`);
      }
    }

    // Manual trigger - send status even if no changes
    if (!hasChanges && process.env.MANUAL_TRIGGER === "true") {
      const msg = buildStatusMessage(results);
      await sendTelegramMessage(msg);
      console.log("Manual trigger - sent status");
    } else if (!hasChanges) {
      console.log("No price changes detected");
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
