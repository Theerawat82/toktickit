const fs = require('fs');
let content = fs.readFileSync('client/src/components/StaffTicketDetail.tsx', 'utf8');

// 1. handleAction definition to support 409
content = content.replace(
  'const data = await res.json();\n      if (!res.ok) throw new Error(data.error || `Failed to update ${endpoint}`);',
  'const data = await res.json();\n      if (res.status === 409) {\n        setTicket(data.currentServerRow);\n        throw new Error("This ticket was updated elsewhere — refreshing to the latest state");\n      }\n      if (!res.ok) throw new Error(data.error || `Failed to update ${endpoint}`);'
);
content = content.replace(
  'setTicket(data.ticket);',
  'setTicket(data.ticket || data);'
);

// 2. update handleAction calls for owner, priority, status
content = content.replace(
  'handleAction("assign", { ticketOwnerId: e.target.value ? Number(e.target.value) : null }',
  'handleAction("owner", { ticketOwnerId: e.target.value ? Number(e.target.value) : null, version: ticket.version }'
);
content = content.replace(
  'handleAction("priority", { itPriority: e.target.value }',
  'handleAction("priority", { itPriority: e.target.value, version: ticket.version }'
);
content = content.replace(
  'handleAction("status", { status: e.target.value }',
  'handleAction("status", { status: e.target.value, version: ticket.version }'
);

// 3. update valid statuses logic
// we will inject a validNextStatuses array and map it.
const validStatusInjection = `
  const getValidStatuses = (currentStatus: string) => {
    switch (currentStatus) {
      case "New": return ["New", "Open", "Cancelled"];
      case "Open": return ["Open", "In Progress", "Resolved", "Cancelled"];
      case "In Progress": return ["In Progress", "Waiting for Requester", "Resolved"];
      case "Waiting for Requester": return ["Waiting for Requester", "In Progress"];
      case "Resolved": return ["Resolved", "Closed", "Reopened"];
      case "Reopened": return ["Reopened", "Open"];
      case "Closed": return ["Closed"];
      case "Cancelled": return ["Cancelled"];
      default: return [currentStatus];
    }
  };
  const validStatuses = getValidStatuses(ticket?.currentStatus || "New");
`;
// Find where to inject it (right after if (!ticket) return null;)
content = content.replace(
  'if (!ticket) return <div className="p-4 text-center">Ticket not found.</div>;',
  'if (!ticket) return <div className="p-4 text-center">Ticket not found.</div>;\n' + validStatusInjection
);

// Replace the status select options
const oldSelectStart = content.indexOf('<select\n                        className="form-select"\n                        value={ticket.currentStatus}');
if (oldSelectStart !== -1) {
   const oldSelectEnd = content.indexOf('</select>', oldSelectStart) + '</select>'.length;
   const newSelect = `<select
                        className="form-select"
                        value={ticket.currentStatus}
                        onChange={(e) => handleAction("status", { status: e.target.value, version: ticket.version }, "Status updated successfully.")}
                        disabled={actionLoading}
                      >
                        {validStatuses.map(st => <option key={st} value={st}>{st}</option>)}
                      </select>`;
   content = content.substring(0, oldSelectStart) + newSelect + content.substring(oldSelectEnd);
}

fs.writeFileSync('client/src/components/StaffTicketDetail.tsx', content);
console.log("Replaced StaffTicketDetail successfully!");
