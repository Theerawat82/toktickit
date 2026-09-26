const fs = require('fs');

let content = fs.readFileSync('e2e/lab-03/staff-ticket-flow.spec.ts', 'utf8');

content = content.replace(/page\.locator\('a:has-text\("TKT-001"\)'\)\.filter\(\{ visible: true \}\)\.first\(\)\.click\(\)/g, 'page.locator(\'a[data-testid^="ticket-link-"]\').first().click()');

content = content.replace(/input\[name="email"\]/g, 'input[type="email"]');
content = content.replace(/input\[name="password"\]/g, 'input[type="password"]');

fs.writeFileSync('e2e/lab-03/staff-ticket-flow.spec.ts', content);
console.log("staff-ticket-flow.spec.ts fixed!");
