const fs = require('fs');

let content = fs.readFileSync('tests/lab-03/staff-ticket-detail.api.test.ts', 'utf8');

// Replace assign with owner
content = content.replace(/\/assign/g, '/owner');
content = content.replace(/101\/assign/g, '101/owner');

// Inject version: 1 into the payloads
content = content.replace(
  /\.send\(\{ ticketOwnerId: mockAdmin\.id \}\);/g,
  '.send({ ticketOwnerId: mockAdmin.id, version: 1 });'
);
content = content.replace(
  /\.send\(\{ ticketOwnerId: mockInactiveStaff\.id \}\);/g,
  '.send({ ticketOwnerId: mockInactiveStaff.id, version: 1 });'
);
content = content.replace(
  /\.send\(\{ ticketOwnerId: mockRequester\.id \}\);/g,
  '.send({ ticketOwnerId: mockRequester.id, version: 1 });'
);
content = content.replace(
  /\.send\(\{ itPriority: "High" \}\);/g,
  '.send({ itPriority: "High", version: 1 });'
);
content = content.replace(
  /\.send\(\{ itPriority: "SuperCritical" \}\);/g,
  '.send({ itPriority: "SuperCritical", version: 1 });'
);
content = content.replace(
  /\.send\(\{ status: "Open" \}\);/g,
  '.send({ status: "Open", version: 1 });'
);
content = content.replace(
  /\.send\(\{ status: "Closed" \}\);/g,
  '.send({ status: "Closed", version: 1 });'
);

content = content.replace(
  /findUnique: vi\.fn\(\)\.mockResolvedValue\(\{ \.\.\.mockTicket, currentStatus: "New" \}\),/g,
  'findUnique: vi.fn().mockResolvedValue({ ...mockTicket, currentStatus: "New", version: 1 }),\n          updateMany: vi.fn().mockResolvedValue({ count: 1 })'
);
content = content.replace(
  /findUnique: vi\.fn\(\)\.mockResolvedValue\(\{ \.\.\.mockTicket, currentStatus: "Open" \}\),/g,
  'findUnique: vi.fn().mockResolvedValue({ ...mockTicket, currentStatus: "Open", version: 1 }),\n          updateMany: vi.fn().mockResolvedValue({ count: 1 })'
);

content = content.replace(
  /ticket: \{\s*findUnique: vi\.fn\(\)\.mockResolvedValue\(mockTicket\),\s*update: vi\.fn\(\)\.mockResolvedValue\(\{ \.\.\.mockTicket, ticketOwnerId: mockAdmin\.id \}\)\s*\}/g,
  `ticket: { 
          findUnique: vi.fn()
            .mockResolvedValueOnce({ ...mockTicket, version: 1 })
            .mockResolvedValueOnce({ ...mockTicket, ticketOwnerId: mockAdmin.id, version: 2 }),
          updateMany: vi.fn().mockResolvedValue({ count: 1 })
        }`
);

content = content.replace(
  /ticket: \{\s*findUnique: vi\.fn\(\)\.mockResolvedValue\(mockTicket\),\s*update: vi\.fn\(\)\.mockResolvedValue\(\{ \.\.\.mockTicket, itPriority: "High" \}\)\s*\}/g,
  `ticket: { 
          findUnique: vi.fn()
            .mockResolvedValueOnce({ ...mockTicket, version: 1 })
            .mockResolvedValueOnce({ ...mockTicket, itPriority: "High", version: 2 }),
          updateMany: vi.fn().mockResolvedValue({ count: 1 })
        }`
);

content = content.replace(
  /ticket: \{\s*findUnique: vi\.fn\(\)\.mockResolvedValue\(\{ \.\.\.mockTicket, currentStatus: "New" \}\),\s*update: vi\.fn\(\)\.mockResolvedValue\(\{ \.\.\.mockTicket, currentStatus: "Open" \}\)\s*\}/g,
  `ticket: { 
          findUnique: vi.fn()
            .mockResolvedValueOnce({ ...mockTicket, currentStatus: "New", version: 1 })
            .mockResolvedValueOnce({ ...mockTicket, currentStatus: "Open", version: 2 }),
          updateMany: vi.fn().mockResolvedValue({ count: 1 })
        }`
);

content = content.replace(
  /ticket: \{\s*findUnique: vi\.fn\(\)\.mockResolvedValue\(mockTicket\)\s*\}/g,
  'ticket: { findUnique: vi.fn().mockResolvedValue({ ...mockTicket, version: 1 }), updateMany: vi.fn().mockResolvedValue({ count: 1 }) }'
);

const actionTakenMockStr = `
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
        actionTaken: {
          create: vi.fn().mockResolvedValue({ id: 1, actionDescription: "fix", result: "fixed", version: 1 }),
          count: vi.fn().mockResolvedValue(1)
        },
        ticket: { 
          findUnique: vi.fn()
            .mockResolvedValueOnce({ ...mockTicket, currentStatus: "Open", version: 1 })
            .mockResolvedValueOnce({ ...mockTicket, currentStatus: "Resolved", version: 2 }),
          updateMany: vi.fn().mockResolvedValue({ count: 1 })
        }
      });
      
      const token = generateToken(mockITStaff.id);
      
      await request(app)
        .post("/api/tickets/101/actions")
        .set("Authorization", \`Bearer \${token}\`)
        .send({ actionDescription: "fix", result: "fixed", version: 1 });

      const res = await request(app)
        .patch("/api/tickets/101/status")
        .set("Authorization", \`Bearer \${token}\`)
        .send({ status: "Resolved", version: 1 });
`;

content = content.replace(
  /it\("should allow transition from Open to Resolved", async \(\) => \{[\s\S]*?\.send\(\{ status: "Resolved" \}\);/g,
  'it("should allow transition from Open to Resolved", async () => {' + actionTakenMockStr
);

// Fix the exact string error expectations
content = content.replace(
  /"Invalid priority value"/g,
  '"Invalid priority value."'
);
content = content.replace(
  /"Invalid status transition from New to Closed"/g,
  '"Cannot transition from \'New\' to \'Closed\'."'
);
content = content.replace(
  /"Invalid status transition from Open to Closed"/g,
  '"Cannot transition from \'Open\' to \'Closed\'."'
);

fs.writeFileSync('tests/lab-03/staff-ticket-detail.api.test.ts', content);
