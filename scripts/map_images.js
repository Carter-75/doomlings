const fs = require('fs');
const html = fs.readFileSync('world.html', 'utf8');

// Find all cdn.prod.website-files.com URLs
const regex = /https:\/\/cdn\.prod\.website-files\.com\/[^\/]+\/[^"'\s]+/g;
const urls = [...new Set(html.match(regex) || [])].filter(url => !url.includes('Alt%20Art%20Main'));

// Load existing cards
const scrapedCards = JSON.parse(fs.readFileSync('public/data/scrapedCards.json', 'utf8'));
const missingCards = JSON.parse(fs.readFileSync('public/data/missingCardsFoundFromScrape.json', 'utf8'));

let matchCount = 0;

function cleanString(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findUrlForCard(cardName) {
  if (!cardName) return null;
  const cleanName = cleanString(cardName);
  
  // Try to find a URL where the filename contains the card name
  return urls.find(url => {
    const filename = url.split('/').pop().toLowerCase();
    const cleanFilename = cleanString(decodeURIComponent(filename));
    return cleanFilename.includes(cleanName);
  });
}

// Update scrapedCards
for (const key in scrapedCards) {
  const card = scrapedCards[key];
  const url = findUrlForCard(card.name);
  if (url) {
    card.image = url;
    matchCount++;
  }
}

// Update missingCards
let missingMatchCount = 0;
missingCards.forEach(card => {
  const url = findUrlForCard(card.name);
  if (url) {
    card.image = url;
    missingMatchCount++;
  }
});

console.log('Matched', matchCount, 'cards in scrapedCards.json');
console.log('Matched', missingMatchCount, 'cards in missingCardsFoundFromScrape.json');

fs.writeFileSync('public/data/scrapedCards.json', JSON.stringify(scrapedCards, null, 2));
fs.writeFileSync('public/data/missingCardsFoundFromScrape.json', JSON.stringify(missingCards, null, 2));
