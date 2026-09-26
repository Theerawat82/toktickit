const fs = require('fs');
let content = fs.readFileSync('client/src/components/RequesterTicketDetail.tsx', 'utf8');

// 1. Add confirm resolution handler
const handleConfirmResolvedFn = `
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const handleConfirmResolved = async () => {
    setConfirmLoading(true);
    setConfirmError("");
    setConfirmMsg("");
    try {
      const res = await apiFetch(\`/api/tickets/\${ticketId}/confirm-resolved\`, {
        method: "PATCH",
        body: JSON.stringify({ version: ticket.version })
      });
      const data = await res.json();
      if (res.status === 409) {
        setTicket(data.currentServerRow);
        setConfirmError("This ticket was updated elsewhere — refreshing to the latest state");
      } else if (!res.ok) {
        setConfirmError(data.error || "Failed to confirm resolution");
      } else {
        setTicket(data);
        setConfirmMsg("You confirmed this resolution — IT Staff will do a final review");
      }
    } catch (e) {
      setConfirmError("Network error");
    } finally {
      setConfirmLoading(false);
    }
  };
`;

content = content.replace(
  'const handlePostComment = async () => {',
  handleConfirmResolvedFn + '\n  const handlePostComment = async () => {'
);

// 2. Insert UI for Confirm Resolved
const confirmUI = `
  {ticket.currentStatus === "Resolved" && !ticket.requesterConfirmedResolved && (
    <div className="alert alert-info mt-3 d-flex align-items-center justify-content-between">
      <div>
        <strong>Please confirm:</strong> Does the solution provided resolve your issue?
      </div>
      <button 
        className="btn btn-sm btn-success" 
        disabled={confirmLoading}
        onClick={handleConfirmResolved}
      >
        {confirmLoading ? "Confirming..." : "Confirm this is resolved"}
      </button>
    </div>
  )}
  {confirmMsg && <div className="alert alert-success mt-3">{confirmMsg}</div>}
  {confirmError && <div className="alert alert-danger mt-3">{confirmError}</div>}
  {ticket.currentStatus === "Resolved" && ticket.requesterConfirmedResolved && !confirmMsg && (
    <div className="alert alert-success mt-3">You confirmed this resolution — IT Staff will do a final review.</div>
  )}
`;

content = content.replace(
  '<div className="col-lg-8">',
  '<div className="col-lg-8">' + confirmUI
);

fs.writeFileSync('client/src/components/RequesterTicketDetail.tsx', content);
console.log("Replaced RequesterTicketDetail successfully!");
