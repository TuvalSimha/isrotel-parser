const puppeteer = require("puppeteer");

const ISROTEL_URL =
  "https://www.isrotel.co.il/searchresult/%D7%97%D7%93%D7%A8-%D7%91%D7%9E%D7%9C%D7%95%D7%9F/?SearchQuery=KD/25-09-2026/27-09-2026/2-0-1/-1/r17008";

async function main() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  // Intercept all network requests
  const apiCalls = [];

  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const url = request.url();
    if (
      url.includes("api") ||
      url.includes("Api") ||
      url.includes("search") ||
      url.includes("Search") ||
      url.includes("room") ||
      url.includes("Room")
    ) {
      apiCalls.push({
        url: url,
        method: request.method(),
        headers: request.headers(),
        postData: request.postData(),
      });
    }
    request.continue();
  });

  // Also capture responses
  const apiResponses = [];
  page.on("response", async (response) => {
    const url = response.url();
    if (
      url.includes("api") ||
      url.includes("Api") ||
      url.includes("search") ||
      url.includes("Search") ||
      url.includes("room") ||
      url.includes("Room")
    ) {
      try {
        const text = await response.text();
        if (text.includes("price") || text.includes("Price") || text.includes("₪") || text.includes("4495")) {
          apiResponses.push({
            url: url,
            status: response.status(),
            sample: text.substring(0, 2000),
          });
        }
      } catch (e) {
        // Ignore errors
      }
    }
  });

  console.log("Loading page and capturing API calls...\n");
  await page.goto(ISROTEL_URL, { waitUntil: "networkidle2", timeout: 60000 });

  // Wait a bit more for any lazy-loaded content
  await new Promise((r) => setTimeout(r, 3000));

  await browser.close();

  console.log("=== API REQUESTS ===\n");
  apiCalls.forEach((call, i) => {
    console.log(`[${i + 1}] ${call.method} ${call.url}`);
    if (call.postData) {
      console.log(`    POST data: ${call.postData.substring(0, 200)}`);
    }
    console.log();
  });

  console.log("\n=== API RESPONSES WITH PRICES ===\n");
  apiResponses.forEach((resp, i) => {
    console.log(`[${i + 1}] ${resp.status} ${resp.url}`);
    console.log(`    Sample: ${resp.sample.substring(0, 500)}`);
    console.log();
  });
}

main().catch(console.error);
