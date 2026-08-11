import { chromium } from 'playwright';
import path from 'node:path';
import os from 'node:os';

const OMNIROUTE_API_KEY = "sk-11873e733d5b44c5-f93252-04599a95";

(async () => {
  // Use your real Google Chrome User Data folder
  const chromeUserDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
  
  console.log("Launching using your real Chrome profile...");
  let context;
  try {
    context = await chromium.launchPersistentContext(chromeUserDataDir, {
      channel: 'chrome',
      headless: false,
      viewport: { width: 1280, height: 720 },
      args: ['--profile-directory=Default']
    });
  } catch (err) {
    console.log("\n⚠️ NOTE: If Google Chrome is already open, please close Chrome and re-run this script!");
    console.error("Error opening profile:", err.message);
    return;
  }

  const page = await context.newPage();
  console.log("Navigating to arena.ai...");
  await page.goto('https://arena.ai/side-by-side');

  // Wait a few seconds for page load
  await page.waitForTimeout(5000);

  // Extract cookies from your actual Chrome profile
  const cookies = await context.cookies(['https://arena.ai', 'https://help.arena.ai', 'https://clerk.arena.ai']);
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

  if (!cookieHeader.includes('arena-auth-prod')) {
    console.log("⚠️ No active session found. Please log in to arena.ai in Chrome.");
    await context.close();
    return;
  }

  console.log("✅ Successfully extracted session cookies from your Chrome profile!");

  // Send the cookies to OmniRoute with API key auth
  const payload = {
    provider: "lmarena",
    entries: [
      {
        name: "My Chrome Profile Session",
        credential: cookieHeader
      }
    ]
  };

  console.log("Syncing with OmniRoute on port 20128...");
  try {
    const response = await fetch("http://localhost:20128/api/providers/bulk-web-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OMNIROUTE_API_KEY}`,
        "x-api-key": OMNIROUTE_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      console.log("🎉 Successfully synced your Chrome profile Arena session to OmniRoute!", data);
    } else {
      const errorText = await response.text();
      console.error(`❌ Sync failed! Server returned ${response.status}:`, errorText);
    }
  } catch (err) {
    console.error("❌ Failed to connect to OmniRoute. Is it running on port 20128?", err.message);
  }

  await context.close();
})();
