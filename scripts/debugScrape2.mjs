import { chromium } from 'playwright';

async function debugCards() {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Navigating to Webflow source...');
    await page.goto('https://www.worldofdoomlings.com/', { waitUntil: 'networkidle' });

    for (let i = 0; i < 20; i++) {
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
                    naturalWidth: img.प्राकृतिकWidth || img.naturalWidth,
                    naturalHeight: img.प्राकृतिकHeight || img.naturalHeight,
                    parentClass: img.parentElement ? img.parentElement.className : ''
                });
            }
        });
        return examples;
    });

    await browser.close();

    const appealing = result.filter(r => r.src.toLowerCase().includes('appealing'));
    console.log('Appealing matches:', appealing);

    const indomitable = result.filter(r => r.src.toLowerCase().includes('indomitable'));
    console.log('Indomitable matches:', indomitable);

    const randomCard = result.filter(r => r.parentClass && r.parentClass.includes('card')).slice(0, 5);
    console.log('Random cards by parentClass containing "card":', randomCard);
}

debugCards().catch(console.error);
