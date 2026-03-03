import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function scrapeCards() {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Navigating to Webflow source...');
    // The actual Webflow site is www.worldofdoomlings.com
    await page.goto('https://www.worldofdoomlings.com/', { waitUntil: 'networkidle' });

    // Scroll to bottom multiple times to trigger all lazy loading or infinite scrolling
    // Use keyboard PageDown which is often more reliable for triggering intersection observers
    for (let i = 0; i < 150; i++) {
        await page.keyboard.press('PageDown');
        await page.waitForTimeout(150);
    }

    // Brief pause for any last images to load
    await page.waitForTimeout(2000);

    // Also check if there's a "Load More" button and click it if it exists
    let loadMoreVisible = true;
    while (loadMoreVisible) {
        try {
            // Look for a common "Load More", "Next Page" or "Show More" button.
            // Easiest is just click any button inside a pagination wrapper
            const loadMoreBtn = await page.$('.jetboost-pagination-load-more, .load-more-btn, a:has-text("Load More")');
            if (loadMoreBtn && await loadMoreBtn.isVisible()) {
                console.log('Clicking Load More...');
                await loadMoreBtn.click();
                await page.waitForTimeout(1000);
            } else {
                loadMoreVisible = false;
            }
        } catch {
            loadMoreVisible = false;
        }
    }

    // Scroll a bit more just in case
    for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollBy(0, 1000));
        await page.waitForTimeout(500);
    }

    const result = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img')).map(img => img.src);
        const results = {};

        // Filter Webflow CDN images that look like cards (e.g. 1234_CardName.png)
        images.forEach(src => {
            if (src && src.includes('cdn.prod.website-files.com') && !src.includes('Logo') && !src.includes('Icon')) {
                // Try to extract the name from the url, e.g. "foo_Attentive.png"
                const match = src.match(/_([A-Za-z0-9%-]+)\.(png|jpg|jpeg)/i);
                if (match) {
                    let name = decodeURIComponent(match[1]).replace(/-/g, ' ');
                    // Basic cleanup
                    if (name.length > 2) {
                        results[name.toLowerCase()] = { name, image: src, description: '', rawText: name };
                    }
                }
            }
        });

        return { error: null, docs: results };
    });

    await browser.close();

    console.log('Browser scraping finished.');

    if (result.error) {
        console.warn(`Encountered error during scrape: ${result.error}`);
    }

    const cards = result.docs;
    const count = Object.keys(cards).length;
    console.log(`Finished scraping! Found ${count} unique cards.`);

    if (count > 0) {
        const outputPath = path.join(__dirname, '..', 'public', 'data', 'scrapedCards.json');
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(cards, null, 2));
        console.log(`Saved cards database to ${outputPath}`);

        // --- Merge missing cards logic here ---
        console.log('Checking for missing cards in local data...');
        const dataDir = path.join(__dirname, '..', 'public', 'data');
        const dataFilesToCheck = [
            'ageData.json',
            'catastropheData.json',
            'dominantData.json',
            'meaningOfLifeData.json',
            'merchantAgeData.json',
            'trinketData.json'
        ];

        const normalizeName = (name) => {
            if (!name) return '';
            return name.toLowerCase().replace(/[^a-z0-9]/g, '');
        };

        const knownNames = new Set();

        for (const file of dataFilesToCheck) {
            const filePath = path.join(dataDir, file);
            if (fs.existsSync(filePath)) {
                try {
                    const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    if (Array.isArray(fileData)) {
                        fileData.forEach(card => {
                            if (card.name) knownNames.add(normalizeName(card.name));
                        });
                    } else {
                        for (const key of Object.keys(fileData)) {
                            const card = fileData[key];
                            if (card.name) knownNames.add(normalizeName(card.name));
                            else knownNames.add(normalizeName(key));
                        }
                    }
                } catch (e) {
                    console.error(`Error reading ${file}:`, e);
                }
            }
        }

        const extendedCardsPath = path.join(dataDir, 'extendedCards.json');
        if (fs.existsSync(extendedCardsPath)) {
            try {
                const extData = JSON.parse(fs.readFileSync(extendedCardsPath, 'utf8'));
                if (Array.isArray(extData)) {
                    extData.forEach(card => {
                        if (card.name) knownNames.add(normalizeName(card.name));
                    });
                }
            } catch (e) {
                console.error(`Error reading extendedCards.json:`, e);
            }
        }

        const missingCards = [];

        for (const [scrapedKey, scrapedData] of Object.entries(cards)) {
            const scrapedName = scrapedData.name;
            if (!scrapedName) continue;

            const normalized = normalizeName(scrapedName);

            if (normalized.includes('meaningoflife') || normalized.includes('astronauts') || normalized.includes('kse') || normalized.includes('dinolings') || normalized.includes('mythlings') || normalized.includes('techlings') || normalized.includes('effectless') || normalized.includes('genepool') || normalized.includes('persistent') || normalized.includes('playwhen') || normalized.includes('action') || normalized.includes('dominant') || normalized.includes('trait') || normalized.includes('agev2') || normalized.includes('dropoflife') || normalized.includes('catastrophe') || normalized === 'pressed' || normalized === 'unpressed' || normalized === 'classic') {
                continue;
            }

            if (!knownNames.has(normalized)) {
                missingCards.push({
                    name: scrapedName,
                    image: scrapedData.image,
                    description: scrapedData.description || scrapedData.rawText || ''
                });
            }
        }

        missingCards.sort((a, b) => a.name.localeCompare(b.name));

        const missingOutPath = path.join(dataDir, 'missingCardsFoundFromScrape.json');
        fs.writeFileSync(missingOutPath, JSON.stringify(missingCards, null, 2));

        console.log(`Finished comparison! Found ${missingCards.length} cards from the website that are NOT in your local data files.`);
        console.log(`Saved report to: ${missingOutPath}`);

    } else {
        console.log('No cards were found. Database was not updated.');
    }
}

scrapeCards().catch(console.error);
