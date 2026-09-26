const fs = require('fs');
let content = fs.readFileSync('client/src/components/StaffTicketDetail.tsx', 'utf8');

content = content.replace(/---SPLIT---/g, '    try {');
content = content.replace(/---SPLIT2---/g, '      const res = await apiFetch');

fs.writeFileSync('client/src/components/StaffTicketDetail.tsx', content);
console.log("Restored properly!");
