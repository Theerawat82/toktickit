const fs = require('fs');

let content = fs.readFileSync('e2e/lab-04/ticket-resolution.spec.ts', 'utf8');

content = content.replace(/await staffPage\.click\('text=TKT-'\);/g, 'await staffPage.locator(\'a[data-testid^="ticket-link-"]\').first().click();');
content = content.replace(/await reqPage\.click\('text=TKT-'\);/g, 'await reqPage.locator(\'a[data-testid^="ticket-link-"]\').first().click();');

fs.writeFileSync('e2e/lab-04/ticket-resolution.spec.ts', content);
console.log("ticket-resolution.spec.ts fixed!");
