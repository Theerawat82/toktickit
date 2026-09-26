const fs = require('fs');
let content = fs.readFileSync('client/src/components/StaffTicketDetail.tsx', 'utf8');

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
  const validStatuses = getValidStatuses(ticket.currentStatus);
`;

if (!content.includes('const getValidStatuses')) {
  content = content.replace(
    'if (!ticket) return null;',
    'if (!ticket) return null;\n' + validStatusInjection
  );
  fs.writeFileSync('client/src/components/StaffTicketDetail.tsx', content);
  console.log("validStatuses injected successfully!");
} else {
  console.log("Already injected.");
}
