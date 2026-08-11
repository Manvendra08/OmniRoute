import { chromium } from 'playwright';

async function main() {
  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const contexts = browser.contexts();
    for (const ctx of contexts) {
      const cookies = await ctx.cookies(['https://chat.qwen.ai']);
      if (cookies.length > 0) {
        console.log('=== QWEN COOKIES FOUND ===');
        const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        console.log(cookieStr);
        await browser.close();
        process.exit(0);
      }
    }
    console.log('No qwen cookies found on CDP context.');
    await browser.close();
  } catch (err) {
    console.error('CDP connect error:', err.message);
  }
}

main();
