const fs = require('fs');
const html = fs.readFileSync('world.html', 'utf8');

// Regex to find wfu-lightbox-group and the following w-json script
const regex = /wfu-lightbox-group="([^"]+)"[\s\S]*?<script type="application\/json" class="w-json">([\s\S]*?)<\/script>/g;

const mappings = {};
let match;

while ((match = regex.exec(html)) !== null) {
  const slug = match[1];
  try {
    const jsonData = JSON.parse(match[2]);
    if (jsonData.items && jsonData.items.length > 0) {
      // Find the first non-brush image if possible, or just the first image
      const firstImage = jsonData.items.find(item => !item.url.includes('Brush') && item.type === 'image') || jsonData.items[0];
      if (firstImage && firstImage.url) {
        mappings[slug] = firstImage.url;
      }
    }
  } catch (e) {
    console.error('Failed to parse JSON for', slug);
  }
}

console.log('Extracted', Object.keys(mappings).length, 'mappings');

// Load existing scrapedCards.json
const scrapedCards = JSON.parse(fs.readFileSync('public/data/scrapedCards.json', 'utf8'));
let updatedCount = 0;

for (const key in scrapedCards) {
  const card = scrapedCards[key];
  const slug = card.name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
  
  if (mappings[slug]) {
    card.image = mappings[slug];
    updatedCount++;
  } else {
    // Try matching by the key itself if it looks like a slug
    if (mappings[key]) {
      card.image = mappings[key];
      updatedCount++;
    }
  }
}

console.log('Updated', updatedCount, 'cards in scrapedCards.json');
fs.writeFileSync('public/data/scrapedCards.json', JSON.stringify(scrapedCards, null, 2));

// Do the same for missingCardsFoundFromScrape.json
const missingCards = JSON.parse(fs.readFileSync('public/data/missingCardsFoundFromScrape.json', 'utf8'));
let missingUpdatedCount = 0;

missingCards.forEach(card => {
  if (!card.name) return;
  const slug = card.name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
  if (mappings[slug]) {
    card.image = mappings[slug];
    missingUpdatedCount++;
  }
});

console.log('Updated', missingUpdatedCount, 'cards in missingCardsFoundFromScrape.json');
fs.writeFileSync('public/data/missingCardsFoundFromScrape.json', JSON.stringify(missingCards, null, 2));
