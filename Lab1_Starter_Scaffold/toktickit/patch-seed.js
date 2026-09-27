const fs = require('fs');
let code = fs.readFileSync('server/prisma/seed.ts', 'utf8');
code = code.replace(
  'const usersToSeed = [\r\n    { email: "staff1@toktickit.com"',
  'const usersToSeed = [\r\n    { email: "admin@toktickit.com", name: "Administrator", role: "Administrator" },\r\n    { email: "staff1@toktickit.com"'
);
fs.writeFileSync('server/prisma/seed.ts', code);
