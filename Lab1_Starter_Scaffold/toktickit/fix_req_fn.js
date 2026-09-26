const fs = require('fs');

let content = fs.readFileSync('client/src/components/RequesterTicketDetail.tsx', 'utf8');

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

if (!content.includes('const handleConfirmResolved')) {
  content = content.replace(
    'const handlePostComment = async (e: React.FormEvent) => {',
    handleConfirmResolvedFn + '\n  const handlePostComment = async (e: React.FormEvent) => {'
  );
  fs.writeFileSync('client/src/components/RequesterTicketDetail.tsx', content);
  console.log("RequesterTicketDetail function fixed!");
} else {
  console.log("Already fixed");
}
