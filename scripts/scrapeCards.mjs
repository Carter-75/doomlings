import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function scrapeCards() {
    console.log('Starting to scrape Doomlings Compendium...');
    const results = {};
    let page = 1;
    const seenNames = new Set();
    let lastPageFirstItemText = '';

    while (true) {
        console.log(`Fetching page ${page}...`);
        try {
            // Using the exact URL structure from the user's browser script but pointing to correct domain
            const url = `https://www.worldofdoomlings.com/?2f00cb64_page=${page}`;
            // Add an authentic browser User-Agent so we don't get blocked
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                }
            });
            if (!res.ok) {
                console.error(`Status ${res.status} on page ${page}. Stopping.`);
                break;
            }

            const html = await res.text();
            const $ = cheerio.load(html);

            // Items are usually contained in Webflow dynamic lists (.w-dyn-item)
            const items = $('.w-dyn-item');

            if (items.length === 0) {
                console.log("No items found on this page. Reached the end.");
                break;
            }

            // Check for infinite loop where Webflow just repeats the last page
            const firstItemText = $(items[0]).text().trim();
            if (firstItemText === lastPageFirstItemText) {
                console.log("Items are identical to previous page. Reached the end.");
                break;
            }
            lastPageFirstItemText = firstItemText;

            items.each((_, element) => {
                const el = $(element);
                const text = el.text().trim();

                // Find title - usually in h1, h2, h3, or h4
                const nameNode = el.find('h1, h2, h3, h4').first();
                const name = nameNode.text().trim() || null;

                // Find image
                const imgNode = el.find('img').first();
                const image = imgNode.attr('src') || null;

                // Find description - usually in p
                const descNode = el.find('p').first();
                const description = descNode.text().trim() || null;

                if (name && image && !seenNames.has(name)) {
                    seenNames.add(name);
                    // Key by lowercased name for easy lookup later
                    results[name.toLowerCase()] = {
                        name,
                        image,
                        description,
                        rawText: text
                    };
                }
            });

            // Safety net
            if (page >= 150) {
                console.warn("Reached page 150. Stopping as a safety limit.");
                break;
            }

            page++;

            // Delay to avoid 502 Bad Gateway / rate limits
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (e) {
            console.error('Error during fetch/parse on page', page, ':', e);
            break;
        }
    }

    console.log(`Finished scraping! Found ${Object.keys(results).length} unique cards.`);

    // Save results to a clean JSON file
    const outputPath = path.join(__dirname, '..', 'public', 'data', 'scrapedCards.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

    console.log(`Saved cards database to ${outputPath}`);
}

scrapeCards();
