const puppeteer = require("puppeteer");
const fs = require("fs");

// Configuration - Add your date ranges here
const SEARCHES = [
  {
    id: "25-27-sep",
    dates: "25-27/09/2026",
    url: "https://www.isrotel.co.il/searchresult/%D7%97%D7%93%D7%A8-%D7%91%D7%9E%D7%9C%D7%95%D7%9F/?SearchQuery=KD/25-09-2026/27-09-2026/2-0-1/-1/r17008",
  },
  {
    id: "28-30-sep",
    dates: "28-30/09/2026",
    url: "https://www.isrotel.co.il/searchresult/%D7%97%D7%93%D7%A8-%D7%91%D7%9E%D7%9C%D7%95%D7%9F/?SearchQuery=KD/28-09-2026/30-09-2026/2-0-1/-1",
  },
  {
    id: "29-sep-01-oct",
    dates: "29/09-01/10/2026",
    url: "https://www.isrotel.co.il/searchresult/%D7%97%D7%93%D7%A8-%D7%91%D7%9E%D7%9C%D7%95%D7%9F/?SearchQuery=KD/29-09-2026/01-10-2026/2-0-1/-1",
  },
];

const HOTEL_NAME = "קדמא";
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

function formatPrice(price) {
  return `${price.toLocaleString("he-IL")} ₪`;
}

function formatDiff(diff) {
  const sign = diff > 0 ? "+" : "";
  return `${sign}${diff.toLocaleString("he-IL")} ₪`;
}

async function extractRoomsFromPage(page) {
  // Get full page HTML
  const html = await page.content();

  // Debug: Show sample of HTML around price area
  const priceAreaMatch = html.match(/מחיר[^]*?{0,500}/);
  if (priceAreaMatch) {
    console.log("Sample HTML near 'מחיר':", priceAreaMatch[0].substring(0, 300));
  }

  // Find all prices - try multiple patterns
  const allPrices = [];
  let match;

  // Pattern 1: X,XXX ₪ (with shekel symbol)
  const pattern1 = /(\d{1,3},\d{3})\s*₪/g;
  while ((match = pattern1.exec(html)) !== null) {
    allPrices.push(parseInt(match[1].replace(/,/g, "")));
  }

  // Pattern 2: X,XXX with HTML entity for shekel
  const pattern2 = /(\d{1,3},\d{3})\s*(?:&#8362;|&shekel;)/g;
  while ((match = pattern2.exec(html)) !== null) {
    allPrices.push(parseInt(match[1].replace(/,/g, "")));
  }

  // Pattern 3: Look for numbers 3000-9999 that might be prices
  const pattern3 = />(\d{1},\d{3})</g;
  while ((match = pattern3.exec(html)) !== null) {
    const price = parseInt(match[1].replace(/,/g, ""));
    if (price > 2000 && price < 10000) {
      allPrices.push(price);
    }
  }

  // Pattern 4: Numbers with nbsp or other whitespace before ₪
  const pattern4 = /(\d{1,3},\d{3})[\s\u00A0]*₪/g;
  while ((match = pattern4.exec(html)) !== null) {
    allPrices.push(parseInt(match[1].replace(/,/g, "")));
  }

  console.log("All prices found:", allPrices);

  // Find room names
  const roomNamePattern = /(חדר קדמא[^<\n]*|סטודיו קדמא[^<\n]*)/g;
  const roomNames = [];
  while ((match = roomNamePattern.exec(html)) !== null) {
    const name = match[1].trim();
    if (name.length < 50 && !roomNames.includes(name)) {
      roomNames.push(name);
    }
  }

  console.log("Room names found:", roomNames);

  // Remove duplicate prices and sort descending
  const uniquePrices = [...new Set(allPrices)].sort((a, b) => b - a);
  console.log("Unique prices:", uniquePrices);

  const rooms = [];

  // Each room has 3 prices (site, discount, club) - sorted high to low
  // Group prices by 3
  const numRooms = Math.floor(uniquePrices.length / 3);

  for (let i = 0; i < numRooms; i++) {
    const roomName = roomNames[i] || `חדר אפשרות ${i + 1}`;
    const priceIndex = i * 3;

    rooms.push({
      name: roomName,
      sitePrice: uniquePrices[priceIndex],
      discountPrice: uniquePrices[priceIndex + 1],
      clubPrice: uniquePrices[priceIndex + 2],
    });
  }

  return rooms;
}

async function checkSearch(browser, search, isFirst = false) {
  console.log(`\nChecking ${search.dates}...`);

  const page = await browser.newPage();

  await page.setExtraHTTPHeaders({
    "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
  });

  try {
    await page.goto(search.url, { waitUntil: "networkidle2", timeout: 60000 });

    // Wait for content to load
    await new Promise((r) => setTimeout(r, 5000));

    try {
      await page.waitForSelector('[class*="room"], [class*="price"], .card', { timeout: 15000 });
    } catch (e) {
      console.log("Waiting for generic content...");
    }

    await new Promise((r) => setTimeout(r, 3000));

    // Take screenshot for first search (for debugging)
    if (isFirst) {
      await page.screenshot({ path: "debug-screenshot.png", fullPage: true });
      console.log("Screenshot saved");
    }

    // Extract rooms and prices
    const rooms = await extractRoomsFromPage(page);
    console.log(`Found ${rooms.length} rooms for ${search.dates}:`, rooms);

    return {
      id: search.id,
      dates: search.dates,
      url: search.url,
      rooms: rooms,
      timestamp: new Date().toISOString(),
    };
  } finally {
    await page.close();
  }
}

function compareSearchResults(current, previous) {
  const changes = [];

  if (!previous) return changes;

  const prevRoomsMap = new Map(previous.rooms.map((r) => [r.name, r]));

  for (const room of current.rooms) {
    const prevRoom = prevRoomsMap.get(room.name);

    if (!prevRoom) {
      // New room appeared
      changes.push({
        roomName: room.name,
        type: "new",
        current: room,
      });
      continue;
    }

    const roomChanges = [];

    if (room.sitePrice !== prevRoom.sitePrice) {
      roomChanges.push({
        label: "מחיר באתר",
        current: room.sitePrice,
        previous: prevRoom.sitePrice,
        diff: room.sitePrice - prevRoom.sitePrice,
      });
    }

    if (room.discountPrice !== prevRoom.discountPrice) {
      roomChanges.push({
        label: "מחיר עם הנחה",
        current: room.discountPrice,
        previous: prevRoom.discountPrice,
        diff: room.discountPrice - prevRoom.discountPrice,
      });
    }

    if (room.clubPrice !== prevRoom.clubPrice) {
      roomChanges.push({
        label: "מחיר מועדון",
        current: room.clubPrice,
        previous: prevRoom.clubPrice,
        diff: room.clubPrice - prevRoom.clubPrice,
      });
    }

    if (roomChanges.length > 0) {
      changes.push({
        roomName: room.name,
        type: "changed",
        priceChanges: roomChanges,
      });
    }
  }

  return changes;
}

function buildChangeMessage(dates, url, changes) {
  let msg = `🚨 <b>שינוי מחיר!</b>\n\n`;
  msg += `🏨 <b>${HOTEL_NAME}</b>\n`;
  msg += `📅 ${dates}\n\n`;

  for (const change of changes) {
    if (change.type === "new") {
      msg += `🆕 <b>${change.roomName}</b>\n`;
      msg += `   מחיר מועדון: ${formatPrice(change.current.clubPrice)}\n\n`;
    } else {
      msg += `<b>${change.roomName}</b>\n`;
      for (const pc of change.priceChanges) {
        const emoji = pc.diff > 0 ? "📈" : "📉";
        msg += `${emoji} ${pc.label}: <b>${formatPrice(pc.current)}</b> (היה: <s>${formatPrice(pc.previous)}</s>, ${formatDiff(pc.diff)})\n`;
      }
      msg += "\n";
    }
  }

  msg += `⏰ ${new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })}\n`;
  msg += `🔗 <a href="${url}">להזמנה</a>`;

  return msg;
}

function buildStatusMessage(results) {
  let msg = `✅ <b>סטטוס מחירים - ${HOTEL_NAME}</b>\n\n`;

  for (const result of results) {
    msg += `📅 <b>${result.dates}</b>\n`;

    if (result.rooms.length === 0) {
      msg += `   ⚠️ לא נמצאו חדרים\n\n`;
      continue;
    }

    for (const room of result.rooms) {
      msg += `   <b>${room.name}</b>\n`;
      msg += `   💰 מועדון: ${formatPrice(room.clubPrice)}\n`;
    }
    msg += "\n";
  }

  msg += `⏰ ${new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })}`;

  return msg;
}

function buildFirstRunMessage(results) {
  let msg = `🏨 <b>התחלתי לעקוב אחרי המחירים!</b>\n\n`;
  msg += `<b>${HOTEL_NAME}</b>\n\n`;

  for (const result of results) {
    msg += `📅 <b>${result.dates}</b>\n`;

    if (result.rooms.length === 0) {
      msg += `   ⚠️ לא נמצאו חדרים\n\n`;
      continue;
    }

    for (const room of result.rooms) {
      msg += `   <b>${room.name}</b>\n`;
      msg += `   💰 באתר: ${formatPrice(room.sitePrice)} → הנחה: ${formatPrice(room.discountPrice)} → מועדון: ${formatPrice(room.clubPrice)}\n`;
    }
    msg += "\n";
  }

  msg += `🔄 בודק כל 15 דקות`;

  return msg;
}

async function main() {
  console.log("Starting price check...");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    // Check all searches
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
        const msg = buildChangeMessage(result.dates, result.url, changes);
        await sendTelegramMessage(msg);
        console.log(`Sent change notification for ${result.dates}`);
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
