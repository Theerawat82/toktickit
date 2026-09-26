const fs = require('fs');

let content = fs.readFileSync('client/src/components/StaffTicketDetail.tsx', 'utf8');

content = content.replace('---SPLIT---', '    try {');
content = content.replace('---SPLIT2---', '      const res = await apiFetch');

fs.writeFileSync('client/src/components/StaffTicketDetail.tsx', content);
console.log("Restored splits!");
