const fs = require('fs');
const path = require('path');

// Load HTML
const htmlPath = 'c:/Users/roban/Documents/projects/STAG-financial-model/index.html';
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

function checkId(id) {
    const regex = new RegExp(`id=["']${id}["']`);
    const found = regex.test(htmlContent);
    console.log(`ID "${id}": ${found ? 'FOUND' : 'MISSING ❌'}`);
    return found;
}

const idsToCheck = [
    // Inputs
    'input-children-affected',
    'input-opt-out-rate',
    'input-erosion-rate',
    'input-vehicle-cost',
    'input-vehicle-capacity',
    'input-minibus-cost',
    'input-minibus-capacity',
    'input-minibus-threshold',
    'input-coach-cost',
    'input-coach-capacity',
    'input-coach-threshold',
    'input-appeals-rate-s1',
    'input-appeals-rate-s2',
    'input-appeals-rate-s3',
    'input-appeals-cost-s1',
    'input-appeals-cost-s2',
    'input-appeals-cost-s3',
    'input-admin-cost',
    'input-council-savings',
    'input-num-zones',
    'input-isolation-rate',

    // Values
    'val-children-affected',
    'val-opt-out-rate',
    'val-erosion-rate',
    'val-vehicle-cost',
    'val-vehicle-capacity',
    'val-minibus-cost',
    'val-minibus-capacity',
    'val-minibus-threshold',
    'val-coach-cost',
    'val-coach-capacity',
    'val-coach-threshold',
    'val-appeals-rate-s1',
    'val-appeals-rate-s2',
    'val-appeals-rate-s3',
    'val-appeals-cost-s1',
    'val-appeals-cost-s2',
    'val-appeals-cost-s3',
    'val-admin-cost',
    'val-council-savings',
    'val-num-zones',
    'val-isolation-rate',

    // Derived
    'val-actual-affected',
    'val-vehicles-required',

    // KPIs
    'kpi-net-balance',
    'kpi-net-balance-label',
    'kpi-displaced-savings',
    'kpi-vehicle-cost',
    'kpi-dispute-cost',
    'kpi-admin-cost',
    'kpi-cost-coverage',
    'kpi-cost-coverage-label',
    'kpi-cost-coverage-subtext',
    'card-net-balance',
    'card-cost-coverage',
    'kpi-policy-verdict',
    'kpi-verdict-subtext',
    'card-policy-verdict',

    // Buttons
    'btn-reset',
    'btn-view-cumulative',
    'btn-view-annual',

    // Tables
    'table-annual-breakdown-body',
    'table-transport-comparison-body',
    'table-appeals-comparison-body'
];

let allFound = true;
for (const id of idsToCheck) {
    if (!checkId(id)) {
        allFound = false;
    }
}

if (allFound) {
    console.log("\nAll required DOM elements are present in index.html!");
} else {
    console.log("\nSome elements are missing!");
}
