import { chromium } from 'playwright';

async function debug() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    await page.goto('https://www.worldofdoomlings.com/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Scroll a bit to load lazy images
    await page.evaluate(async () => {
        for (let i = 0; i < 5; i++) { window.scrollBy(0, 800); await new Promise(r => setTimeout(r, 200)); }
    });
    await page.waitForTimeout(1000);

    const info = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('.w-dyn-item'));

        // Print all children tag+class+text for first 3 items
        const sample = items.slice(0, 3).map((el, idx) => {
            const children = Array.from(el.querySelectorAll('*')).slice(0, 20).map(c => ({
                tag: c.tagName,
                class: (c.className || '').substring(0, 60),
                text: c.textContent.trim().substring(0, 40),
                src: c.src || c.dataset.src || null,
            }));
            return { idx, outerHTML: el.outerHTML.substring(0, 600), children };
        });

        return { total: items.length, sample };
    });

    console.log('Total items:', info.total);
    info.sample.forEach((item, i) => {
        console.log(`\n--- Item ${i} ---`);
        console.log('outerHTML:', item.outerHTML);
        console.log('Children:');
        item.children.forEach(c => console.log(` <${c.tag}> class="${c.class}" text="${c.text}" src=${c.src}`));
    });

    await browser.close();
}
debug().catch(console.error);
