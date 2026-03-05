import { chromium } from 'playwright';

async function debugCards() {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Navigating to Webflow source...');
    await page.goto('https://www.worldofdoomlings.com/', { waitUntil: 'networkidle' });

    for (let i = 0; i < 50; i++) {
        await page.keyboard.press('PageDown');
        await page.waitForTimeout(50);
    }

    const result = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        const examples = [];
        images.forEach(img => {
            const src = img.src;
            if (src && src.includes('cdn.prod.website-files.com')) {
                examples.push({
                    src: src.substring(src.lastIndexOf('/') + 1),
                    className: img.className,
                    alt: img.alt,
                    width: img.width,
                    height: img.height,
                    parentClass: img.parentElement ? img.parentElement.className : ''
                });
            }
        });
        return examples;
    });

    await browser.close();

    // Find "Legendary"
    const legendaryMatches = result.filter(r => r.src.toLowerCase().includes('legendary'));
    console.log('Legendary matches:', legendaryMatches);

    // Find "Astronauts"
    const astronautsMatches = result.filter(r => r.src.toLowerCase().includes('astronauts'));
    console.log('Astronauts matches:', astronautsMatches);

    // Some general cards to see their classes
    console.log('Sample cards:', result.slice(0, 5));
}

debugCards().catch(console.error);
