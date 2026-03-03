const fs = require('fs');
const html = fs.readFileSync('compendium.html', 'utf8');
const rx = /<iframe[^>]*src=["']([^"']+)["'][^>]*>/gi;
let m;
while (m = rx.exec(html)) {
    console.log(m[1]);
}
