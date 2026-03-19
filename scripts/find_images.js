const fs = require('fs');
const data = JSON.parse(fs.readFileSync('public/data/missingCardsFoundFromScrape.json', 'utf8'));
const placeholder = 'https://cdn.prod.website-files.com/612d407a6dfd3c1f0df39809/65f89e8b6d96de60f6b656fd_Alt%20Art%20Main.png';

const validImages = [];
data.forEach(item => {
  if (item.image && item.image !== placeholder) {
    validImages.push({ name: item.name, image: item.image });
  }
});

console.log(JSON.stringify(validImages.slice(0, 20), null, 2));
console.log('Total valid images found:', validImages.length);
