const fs = require('fs');
const html = fs.readFileSync('world.html', 'utf8');

// Find all cdn.prod.website-files.com URLs
const regex = /https:\/\/cdn\.prod\.website-files\.com\/[^\/]+\/[^"'\s]+/g;
const urls = html.match(regex) || [];

const uniqueUrls = [...new Set(urls)];
const nonPlaceholders = uniqueUrls.filter(url => !url.includes('Alt%20Art%20Main'));

console.log('Found', nonPlaceholders.length, 'non-placeholder URLs');
console.log(JSON.stringify(nonPlaceholders.slice(0, 50), null, 2));
