import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const normalizeName = (name) => {
    if (!name) return '';
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
};

async function scrapeCards() {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    console.log('Navigating to worldofdoomlings.com...');
    await page.goto('https://www.worldofdoomlings.com/', {
        waitUntil: 'networkidle',
        timeout: 60000,
    });
    await page.waitForTimeout(2000);

    // ── The page defaults to "Classic Game" filter active. Clear all filters. ─
    // Strategy 1: look for active filter chip/tag with an X (remove button) on the main grid
    console.log('Clearing active filters...');

    // Try clicking any active/applied filter tags to remove them (chip-style filters)
    const removedChips = await page.evaluate(() => {
        // Look for filter tags / chips that have a close/remove button
        const closeButtons = Array.from(document.querySelectorAll(
            '[class*="active-filter"] [class*="remove"], [class*="active-filter"] [class*="close"], ' +
            '[class*="filter-tag"] [class*="close"], [class*="filter-chip"] [class*="close"], ' +
            '[class*="applied"] [class*="remove"], [class*="applied"] [class*="clear"], ' +
            '[class*="jetboost"] [class*="close"], [class*="jetboost"] [class*="clear"]'
        ));
        closeButtons.forEach(btn => btn.click());
        return closeButtons.length;
    });
    if (removedChips > 0) {
        console.log(`  → Removed ${removedChips} active filter chips.`);
        await page.waitForTimeout(1500);
    }

    // Strategy 2: Open the filter sidebar and click "Reset Filters" or "Clear All"
    console.log('Opening filter sidebar...');
    const filterBtnClicked = await page.evaluate(() => {
        const candidates = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        const btn = candidates.find(el => {
            const t = el.textContent.trim().toLowerCase();
            return t === 'filters' || t === 'filter' || t.includes('filter');
        });
        if (btn) { btn.click(); return true; }
        return false;
    });

    if (filterBtnClicked) {
        await page.waitForTimeout(1200);
        // Click "Reset" / "Reset Filters" / "Clear All" inside the sidebar
        const resetClicked = await page.evaluate(() => {
            const candidates = Array.from(document.querySelectorAll('button, a, [role="button"]'));
            const resetBtn = candidates.find(el => {
                const t = el.textContent.trim().toLowerCase();
                return t === 'reset' || t === 'reset filters' || t === 'clear all' || t === 'clear filters' || t === 'clear';
            });
            if (resetBtn) { resetBtn.click(); return true; }
            return false;
        });

        if (resetClicked) {
            console.log('  → Clicked Reset Filters. Waiting for list to update...');
            await page.waitForTimeout(2000);
        } else {
            console.log('  → Reset button not found in sidebar. Attempting to close sidebar.');
        }

        // Close the sidebar (press Escape or click outside)
        await page.keyboard.press('Escape');
        await page.waitForTimeout(800);
    }

    // Print how many results the page now shows
    const resultText = await page.evaluate(() => {
        const el = Array.from(document.querySelectorAll('*')).find(e => {
            const t = e.textContent.trim();
            return /showing\s+\d+/i.test(t) && e.children.length === 0;
        });
        return el ? el.textContent.trim() : null;
    });
    if (resultText) console.log('Page reports:', resultText);

    // ── Extract cards page by page ────────────────────────────────────────────
    const results = {};
    let pageNum = 1;

    const extractCurrentPage = async () => {
        // Scroll to trigger lazy-loaded images
        await page.evaluate(async () => {
            for (let i = 0; i < 20; i++) {
                window.scrollBy(0, 500);
                await new Promise(r => setTimeout(r, 80));
            }
            window.scrollTo(0, 0);
        });
        await page.waitForTimeout(600);

        return page.evaluate(() => {
            const anchors = Array.from(
                document.querySelectorAll('a.link-block[href*="/cards/"], a.w-inline-block[href*="/cards/"]')
            );
            const cards = [];
            anchors.forEach(anchor => {
                const href = anchor.getAttribute('href') || '';
                if (!href.includes('/cards/')) return;

                const imgEl = anchor.querySelector('img');
                const image = imgEl ? (imgEl.src || imgEl.dataset.src || imgEl.getAttribute('data-src') || null) : null;
                if (!image || !image.startsWith('http')) return;
                if (image.toLowerCase().includes('logo') || image.toLowerCase().includes('icon')) return;

                // Name from alt text, heading, or href slug
                const alt = imgEl?.alt?.trim();
                const headingEl = anchor.querySelector('h1,h2,h3,h4,h5,h6');
                const heading = headingEl?.textContent?.trim();
                const slug = href.split('/').filter(Boolean).pop()?.replace(/-/g, ' ')
                    .replace(/\b\w/g, c => c.toUpperCase());

                let name = (alt && alt.length > 1 && !/^img|image|undefined$/i.test(alt)) ? alt
                    : (heading && heading.length > 1) ? heading
                        : slug || null;
                if (!name || name.length < 2) return;

                const descEl = anchor.querySelector('p, [class*="desc"]');
                cards.push({ name, image, description: descEl?.textContent?.trim() || '' });
            });
            return cards;
        });
    };

    while (true) {
        const pageCards = await extractCurrentPage();
        let newCount = 0;
        for (const card of pageCards) {
            const key = card.name.toLowerCase();
            if (!results[key]) { results[key] = { name: card.name, image: card.image, description: card.description, rawText: card.name }; newCount++; }
        }
        console.log(`  Page ${pageNum}: ${pageCards.length} cards found, ${newCount} new. Total: ${Object.keys(results).length}`);

        // Click Jetboost next button
        const nextClicked = await page.evaluate(() => {
            const selectors = [
                '.jetboost-pagination-next',
                '[class*="pagination-next"]',
                '[class*="next-page"]',
            ];
            for (const sel of selectors) {
                const btn = document.querySelector(sel);
                if (btn && btn.offsetParent !== null && !btn.disabled) { btn.click(); return true; }
            }
            // Text fallback
            const all = Array.from(document.querySelectorAll('a, button'));
            const next = all.find(el => {
                const t = el.textContent.trim();
                return (t === 'Next' || t === '›' || t === '>') && el.offsetParent !== null;
            });
            if (next) { next.click(); return true; }
            return false;
        });

        if (!nextClicked) { console.log('  No more pages.'); break; }
        await page.waitForTimeout(1200);
        pageNum++;
        if (pageNum > 100) { console.warn('Hit 100-page safety limit.'); break; }
    }

    await browser.close();

    const count = Object.keys(results).length;
    if (count === 0) { console.error('No cards found — aborting.'); process.exit(1); }

    // Save
    const dataDir = path.join(__dirname, '..', 'public', 'data');
    const outputPath = path.join(dataDir, 'scrapedCards.json');
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\nSaved ${count} cards → ${outputPath}`);

    // Compare with local data
    const knownNames = new Set();
    for (const file of ['ageData.json', 'catastropheData.json', 'dominantData.json', 'meaningOfLifeData.json', 'merchantAgeData.json', 'trinketData.json']) {
        const fp = path.join(dataDir, file);
        if (!fs.existsSync(fp)) continue;
        try {
            const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
            (Array.isArray(data) ? data : Object.values(data)).forEach(c => { if (c?.name) knownNames.add(normalizeName(c.name)); });
        } catch { }
    }
    const SKIP = new Set(['pressed', 'unpressed', 'classic']);
    const missingCards = Object.values(results)
        .filter(c => !SKIP.has(normalizeName(c.name)) && !knownNames.has(normalizeName(c.name)))
        .map(c => ({ name: c.name, image: c.image, description: c.description }))
        .sort((a, b) => a.name.localeCompare(b.name));
    fs.writeFileSync(path.join(dataDir, 'missingCardsFoundFromScrape.json'), JSON.stringify(missingCards, null, 2));

    // Spot-check
    const mustHave = ['pointy stick', 'izzy', 'appealing', 'slumbering', 'egg clusters'];
    const found = mustHave.filter(n => results[n]);
    const absent = mustHave.filter(n => !results[n]);
    console.log('\n── Summary ──────────────────────────────────────────────────');
    console.log(`Total cards:           ${count}`);
    console.log(`Not in local data:     ${missingCards.length}`);
    console.log(`Spot-check FOUND:      [${found.join(', ')}]`);
    console.log(`Spot-check MISSING:    [${absent.length ? absent.join(', ') : 'none ✓'}]`);
}

scrapeCards().catch(err => { console.error('Fatal:', err); process.exit(1); });
