const fs = require('fs');
const path = require('path');

// Create a lightweight DOM mock
const mockElement = {
    value: "100",
    dataset: {},
    addEventListener: (event, cb) => {},
    setAttribute: (name, val) => {},
    classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {},
        contains: () => false
    },
    appendChild: () => {},
    getContext: () => ({
        fillRect: () => {},
        clearRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fillText: () => {},
        measureText: () => ({ width: 10 }),
        strokeText: () => {}
    }),
    style: {},
    querySelector: () => mockElement,
    querySelectorAll: () => [mockElement]
};

global.window = {
    addEventListener: (event, cb) => {
        if (event === 'load') cb();
    }
};

global.document = {
    getElementById: (id) => {
        // Mock default slider values to keep float parsers happy
        const element = { ...mockElement };
        element.id = id;
        if (id.includes('rate') || id.includes('threshold') || id.includes('zones')) {
            element.value = "10";
        } else if (id.includes('capacity')) {
            element.value = "5";
        } else if (id.includes('cost')) {
            element.value = "150";
        } else if (id.includes('savings')) {
            element.value = "100000";
        }
        return element;
    },
    querySelectorAll: (selector) => {
        return [
            { ...mockElement, className: 'control-group', querySelector: () => ({ ...mockElement }) },
            { ...mockElement, className: 'tab-header' },
            { ...mockElement, className: 'tab-panel' }
        ];
    },
    createElement: (tag) => {
        return { ...mockElement };
    },
    readyState: 'complete'
};

// Mock global Chart constructor
global.Chart = class {
    constructor() {}
    destroy() {}
    update() {}
};

// Load and evaluate main.js
const mainJsPath = 'c:/Users/roban/Documents/projects/STAG-financial-model/main.js';
const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');

console.log("=== EXECUTING main.js IN LIGHTWEIGHT MOCK DOM ===");
try {
    // Run the code
    eval(mainJsContent);
    console.log("\nSuccess! main.js evaluated and executed successfully with no errors.");
} catch (err) {
    console.error("\nCRITICAL RUNTIME ERROR:", err);
    process.exit(1);
}
