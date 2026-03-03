import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('https://www.worldofdoomlings.com/');
    const items = await page.$$eval('.w-dyn-item', els =>
        els.map(e => e.innerHTML).filter(h => h.includes('img') && h.includes('src'))
    );
    console.log(items.length, 'items found with images.');
    if (items.length > 0) console.log(items[0].substring(0, 1000));
    await browser.close();
})();
