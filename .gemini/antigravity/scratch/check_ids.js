const fs = require('fs');

const htmlContent = fs.readFileSync('c:/Users/roban/Documents/projects/STAG-financial-model/index.html', 'utf8');
const mainJsContent = fs.readFileSync('c:/Users/roban/Documents/projects/STAG-financial-model/main.js', 'utf8');

// Extract all getElementById strings from main.js
const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
let match;
const idsToCheck = new Set();
while ((match = idRegex.exec(mainJsContent)) !== null) {
    idsToCheck.add(match[1]);
}

console.log(`Checking ${idsToCheck.size} unique getElementById calls...`);
let missingCount = 0;
for (const id of idsToCheck) {
    // Check if the id is present as id="id" or id='id' in HTML
    const hasId = htmlContent.includes(`id="${id}"`) || htmlContent.includes(`id='${id}'`);
    if (!hasId) {
        console.error(`❌ Missing ID in HTML: "${id}"`);
        missingCount++;
    } else {
        console.log(`✅ Found ID in HTML: "${id}"`);
    }
}

if (missingCount === 0) {
    console.log("SUCCESS: All element IDs exist in index.html!");
} else {
    console.error(`FAILURE: ${missingCount} element IDs are missing in index.html!`);
    process.exit(1);
}
