const fs = require('fs');

let content = fs.readFileSync('client/src/components/RequesterTicketDetail.tsx', 'utf8');

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

if (!content.includes('Confirm this is resolved')) {
  // It wasn't added
  content = content.replace(
    /<div className="col-12 col-lg-8">/g,
    '<div className="col-12 col-lg-8">\n' + confirmUI
  );
  fs.writeFileSync('client/src/components/RequesterTicketDetail.tsx', content);
  console.log("RequesterTicketDetail fixed!");
} else {
  console.log("Already fixed");
}
