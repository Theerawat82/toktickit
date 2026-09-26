const fs = require('fs');

let content = fs.readFileSync('e2e/lab-04/actions-taken-flow.spec.ts', 'utf8');

content = content.replace(/input\[name="email"\]/g, 'input[type="email"]');
content = content.replace(/input\[name="password"\]/g, 'input[type="password"]');
content = content.replace(/select\[aria-label="Status"\]/g, 'select[aria-label="Current Status"]'); // Just in case

fs.writeFileSync('e2e/lab-04/actions-taken-flow.spec.ts', content);
console.log("actions-taken-flow.spec.ts fixed!");
