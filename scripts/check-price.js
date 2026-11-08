const puppeteer = require("puppeteer");
const fs = require("fs");

// Configuration - EL AL flight search
const SEARCHES = [
  {
    id: "tlv-beg-jun-3-6",
    route: "TLV → BEG",
    routeHebrew: "תל אביב → בלגרד",
    dates: "03-06/06/2025",
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

function formatPrice(price, currency = "USD") {
  if (currency === "ILS" || currency === "₪") {
    return `${price.toLocaleString("he-IL")} ₪`;
  }
  return `$${price.toLocaleString("en-US")}`;
}

function formatDiff(diff, currency = "USD") {
  const sign = diff > 0 ? "+" : "";
  if (currency === "ILS" || currency === "₪") {
    return `${sign}${diff.toLocaleString("he-IL")} ₪`;
  }
  return `${sign}$${diff.toLocaleString("en-US")}`;
}

async function extractFlightsFromPage(page) {
  const html = await page.content();

  // Save HTML for debugging
  fs.writeFileSync("debug-page.html", html);
  console.log("Saved page HTML for debugging");

  const flights = [];

  // Try multiple price extraction patterns for EL AL
  const allPrices = [];
  let match;

  // Pattern 1: USD prices ($XXX or $X,XXX)
  const usdPattern = /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
  while ((match = usdPattern.exec(html)) !== null) {
    const price = parseFloat(match[1].replace(/,/g, ""));
    if (price > 50 && price < 10000) {
      allPrices.push({ price, currency: "USD" });
    }
  }

  // Pattern 2: ILS prices (₪XXX or XXX ₪)
  const ilsPattern1 = /₪\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
  while ((match = ilsPattern1.exec(html)) !== null) {
    const price = parseFloat(match[1].replace(/,/g, ""));
    if (price > 100 && price < 50000) {
      allPrices.push({ price, currency: "ILS" });
    }
  }

  const ilsPattern2 = /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*₪/g;
  while ((match = ilsPattern2.exec(html)) !== null) {
    const price = parseFloat(match[1].replace(/,/g, ""));
    if (price > 100 && price < 50000) {
      allPrices.push({ price, currency: "ILS" });
    }
  }

  // Pattern 3: Look for price in data attributes or JSON
  const jsonPricePattern = /"price":\s*(\d+(?:\.\d+)?)/g;
  while ((match = jsonPricePattern.exec(html)) !== null) {
    const price = parseFloat(match[1]);
    if (price > 50 && price < 50000) {
      allPrices.push({ price, currency: "USD" });
    }
  }

  // Pattern 4: Total price patterns
  const totalPattern = /total[^>]*>?\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi;
  while ((match = totalPattern.exec(html)) !== null) {
    const price = parseFloat(match[1].replace(/,/g, ""));
    if (price > 50 && price < 10000) {
      allPrices.push({ price, currency: "USD" });
    }
  }

  console.log("All prices found:", allPrices);

  // Remove duplicates and sort
  const uniquePrices = [];
  const seen = new Set();
  for (const p of allPrices) {
    const key = `${p.price}-${p.currency}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniquePrices.push(p);
    }
  }
  uniquePrices.sort((a, b) => a.price - b.price);

  console.log("Unique prices:", uniquePrices);

  // Extract flight class names if available
  const classPatterns = [
    /economy|כלכלית/gi,
    /business|עסקים/gi,
    /premium|פרימיום/gi,
    /lite|לייט/gi,
    /classic|קלאסיק/gi,
    /flex|גמיש/gi,
  ];

  const classNames = [];
  for (const pattern of classPatterns) {
    if (pattern.test(html)) {
      classNames.push(pattern.source.split("|")[0]);
    }
  }

  console.log("Flight classes found:", classNames);

  // Build flight options from prices
  if (uniquePrices.length > 0) {
    // Group by likely fare classes (lowest prices first)
    for (let i = 0; i < Math.min(uniquePrices.length, 5); i++) {
      const p = uniquePrices[i];
      flights.push({
        name: classNames[i] || `Option ${i + 1}`,
        price: p.price,
        currency: p.currency,
      });
    }
  }

  return flights;
}

async function checkSearch(browser, search, isFirst = false) {
  console.log(`\nChecking ${search.route} (${search.dates})...`);

  const page = await browser.newPage();

  await page.setExtraHTTPHeaders({
    "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
  });

  // Set viewport to ensure full page renders
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    console.log("Navigating to:", search.url);
    await page.goto(search.url, { waitUntil: "networkidle2", timeout: 90000 });

    // Wait for page to fully load
    console.log("Waiting for page to render...");
    await new Promise((r) => setTimeout(r, 10000));

    // Try to wait for price elements
    try {
      await page.waitForSelector('[class*="price"], [class*="fare"], [class*="total"]', { timeout: 20000 });
      console.log("Found price-related elements");
    } catch (e) {
      console.log("No specific price selectors found, continuing...");
    }

    // Additional wait for dynamic content
    await new Promise((r) => setTimeout(r, 5000));

    // Take screenshot
    if (isFirst) {
      await page.screenshot({ path: "debug-screenshot.png", fullPage: true });
      console.log("Screenshot saved");
    }

    // Extract flights and prices
    const flights = await extractFlightsFromPage(page);
    console.log(`Found ${flights.length} flight options for ${search.route}:`, flights);

    return {
      id: search.id,
      route: search.route,
      routeHebrew: search.routeHebrew,
      dates: search.dates,
      url: search.url,
      flights: flights,
      timestamp: new Date().toISOString(),
    };
  } finally {
    await page.close();
  }
}

function compareSearchResults(current, previous) {
  const changes = [];

  if (!previous) return changes;

  const prevFlightsMap = new Map(previous.flights.map((f) => [f.name, f]));

  for (const flight of current.flights) {
    const prevFlight = prevFlightsMap.get(flight.name);

    if (!prevFlight) {
      changes.push({
        flightName: flight.name,
        type: "new",
        current: flight,
      });
      continue;
    }

    if (flight.price !== prevFlight.price) {
      changes.push({
        flightName: flight.name,
        type: "changed",
        current: flight.price,
        previous: prevFlight.price,
        currency: flight.currency,
        diff: flight.price - prevFlight.price,
      });
    }
  }

  return changes;
}

function buildChangeMessage(result, changes) {
  let msg = `🔔 <b>היי! יש שינוי במחיר הטיסה!</b>\n\n`;
  msg += `✈️ <b>EL AL</b>\n`;
  msg += `🛫 מסלול: <b>${result.routeHebrew}</b>\n`;
  msg += `📅 תאריכים: <b>${result.dates}</b>\n`;
  msg += `━━━━━━━━━━━━━━━\n\n`;

  for (const change of changes) {
    if (change.type === "new") {
      msg += `🆕 <b>${change.flightName}</b> (אפשרות חדשה!)\n`;
      msg += `   💵 מחיר: ${formatPrice(change.current.price, change.current.currency)}\n\n`;
    } else {
      const emoji = change.diff > 0 ? "📈 עלה" : "📉 ירד";
      const diffEmoji = change.diff > 0 ? "🔺" : "🔻";
      msg += `✈️ <b>${change.flightName}</b>\n\n`;
      msg += `${emoji}:\n`;
      msg += `   לפני: <s>${formatPrice(change.previous, change.currency)}</s>\n`;
      msg += `   עכשיו: <b>${formatPrice(change.current, change.currency)}</b> ${diffEmoji} ${formatDiff(change.diff, change.currency)}\n\n`;
    }
  }

  // Show all current prices
  msg += `📊 <b>כל המחירים העדכניים:</b>\n`;
  for (const flight of result.flights) {
    msg += `   ✈️ ${flight.name}: <b>${formatPrice(flight.price, flight.currency)}</b>\n`;
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
    msg += `🛫 <b>${result.routeHebrew}</b>\n`;
    msg += `📅 ${result.dates}\n\n`;

    if (result.flights.length === 0) {
      msg += `   ⚠️ לא נמצאו טיסות זמינות\n\n`;
      continue;
    }

    for (const flight of result.flights) {
      msg += `   ✈️ ${flight.name}: <b>${formatPrice(flight.price, flight.currency)}</b>\n`;
    }
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
    msg += `🛫 <b>${result.routeHebrew}</b>\n`;
    msg += `📅 ${result.dates}\n\n`;

    if (result.flights.length === 0) {
      msg += `   ⚠️ לא נמצאו טיסות זמינות\n`;
      msg += `   (ייתכן שהדף לא נטען כראוי - נסה שוב)\n\n`;
      continue;
    }

    for (const flight of result.flights) {
      msg += `   ✈️ ${flight.name}: <b>${formatPrice(flight.price, flight.currency)}</b>\n`;
    }
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
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
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

      if (changes.length > 0) {
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
