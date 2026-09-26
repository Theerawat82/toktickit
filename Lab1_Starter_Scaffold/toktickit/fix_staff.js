const fs = require('fs');

let content = fs.readFileSync('client/src/components/StaffTicketDetail.tsx', 'utf8');

// The issue was: my previous script failed to match because of \r\n and whitespace.

// 1. Fix handleAction
const handleActionOld = `    try {
      const res = await apiFetch(\`/api/tickets/\${ticketId}/\${endpoint}\`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || \`Failed to update \${endpoint}\`);
      setActionSuccess(successMsg);
      await loadTicket();`;

const handleActionNew = `    try {
      const res = await apiFetch(\`/api/tickets/\${ticketId}/\${endpoint}\`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.status === 409) {
        setTicket(data.currentServerRow);
        throw new Error("This ticket was updated elsewhere — refreshing to the latest state");
      }
      if (!res.ok) throw new Error(data.error || \`Failed to update \${endpoint}\`);
      setActionSuccess(successMsg);
      await loadTicket();`;

content = content.split('    try {').join('---SPLIT---').split('      const res = await apiFetch').join('---SPLIT2---');
// actually easier to just use regex
content = content.replace(
  /const data = await res\.json\(\);\r?\n\s*if \(\!res\.ok\) throw new Error\(data\.error \|\| `Failed to update \$\{endpoint\}`\);/g,
  `const data = await res.json();\n      if (res.status === 409) {\n        setTicket(data.currentServerRow);\n        throw new Error("This ticket was updated elsewhere — refreshing to the latest state");\n      }\n      if (!res.ok) throw new Error(data.error || \`Failed to update \${endpoint}\`);`
);

// 2. Add validStatuses
// Let's insert the validStatuses logic near the top of the component render
content = content.replace(
  /if \(\!ticket\) return <div className="p-4 text-center">Ticket not found\.<\/div>;/g,
  `if (!ticket) return <div className="p-4 text-center">Ticket not found.</div>;\n\n  const getValidStatuses = (currentStatus: string) => {\n    switch (currentStatus) {\n      case "New": return ["New", "Open", "Cancelled"];\n      case "Open": return ["Open", "In Progress", "Resolved", "Cancelled"];\n      case "In Progress": return ["In Progress", "Waiting for Requester", "Resolved"];\n      case "Waiting for Requester": return ["Waiting for Requester", "In Progress"];\n      case "Resolved": return ["Resolved", "Closed", "Reopened"];\n      case "Reopened": return ["Reopened", "Open"];\n      case "Closed": return ["Closed"];\n      case "Cancelled": return ["Cancelled"];\n      default: return [currentStatus];\n    }\n  };\n  const validStatuses = getValidStatuses(ticket.currentStatus);`
);

// 3. Fix the <select> for status
content = content.replace(
  /<select\r?\n?\s*aria-label="Current Status"\r?\n?\s*className="form-select"\r?\n?\s*value=\{ticket\.currentStatus\}\r?\n?\s*onChange=\{\(e\) => handleAction\("status", \{ status: e\.target\.value, version: ticket\.version \}, "Status updated successfully\."\)\}\r?\n?\s*disabled=\{actionLoading\}\r?\n?\s*>[\s\S]*?<\/select>/g,
  `<select
                          aria-label="Current Status"
                          className="form-select"
                          value={ticket.currentStatus}
                          onChange={(e) => handleAction("status", { status: e.target.value, version: ticket.version }, "Status updated successfully.")}
                          disabled={actionLoading}
                        >
                          {validStatuses.map(st => <option key={st} value={st}>{st}</option>)}
                        </select>`
);

fs.writeFileSync('client/src/components/StaffTicketDetail.tsx', content);
console.log("StaffTicketDetail fixed!");
