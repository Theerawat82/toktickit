const fs = require('fs');
let code = fs.readFileSync('client/tests/lab-04/StaffDashboard.test.tsx', 'utf8');

code = code.replace(
  /byStatus: \[\s*\{ status: "New", count: 2 \},\s*\{ status: "Open", count: 4 \},\s*\{ status: "In_Progress", count: 3 \},\s*\{ status: "Waiting_for_Requester", count: 1 \},\s*\],/,
  'statusBreakdown: { "New": 2, "Open": 4, "InProgress": 3, "Waiting for Requester": 1 },'
);

code = code.replace(
  /byItPriority: \[\s*\{ priority: "Urgent", count: 1 \},\s*\{ priority: "High", count: 5 \},\s*\],/,
  'priorityBreakdown: { "Urgent": 1, "High": 5 },'
);

fs.writeFileSync('client/tests/lab-04/StaffDashboard.test.tsx', code);
