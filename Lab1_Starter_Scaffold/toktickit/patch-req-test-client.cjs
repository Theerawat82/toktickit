const fs = require('fs');
let code = fs.readFileSync('client/tests/lab-04/RequesterDashboard.test.tsx', 'utf8');

code = code.replace(
  'const mockRequesterDashboardData = {\r\n  myOpenCount: 2,\r\n  waitingForRequesterCount: 1,\r\n  recentlyUpdated: [\r\n    {\r\n      id: 201,\r\n      ticketNumber: "REQ-001",\r\n      summary: "My open ticket",\r\n      currentStatus: "In_Progress",\r\n      updatedAt: "2023-11-01T10:00:00Z",\r\n    },\r\n  ],\r\n  recentlyResolved: [\r\n    {\r\n      id: 202,\r\n      ticketNumber: "REQ-002",\r\n      summary: "My resolved ticket",\r\n      currentStatus: "Resolved",\r\n      updatedAt: "2023-11-01T09:00:00Z",\r\n      requesterConfirmedResolved: false,\r\n    },\r\n  ],\r\n};',
  'const mockRequesterDashboardData = {\r\n  myTickets: {\r\n    Open: 2,\r\n    InProgress: 1,\r\n    Resolved: 1,\r\n    Closed: 0,\r\n  }\r\n};'
);

code = code.replace(
  'const mockRequesterDashboardData = {\n  myOpenCount: 2,\n  waitingForRequesterCount: 1,\n  recentlyUpdated: [\n    {\n      id: 201,\n      ticketNumber: "REQ-001",\n      summary: "My open ticket",\n      currentStatus: "In_Progress",\n      updatedAt: "2023-11-01T10:00:00Z",\n    },\n  ],\n  recentlyResolved: [\n    {\n      id: 202,\n      ticketNumber: "REQ-002",\n      summary: "My resolved ticket",\n      currentStatus: "Resolved",\n      updatedAt: "2023-11-01T09:00:00Z",\n      requesterConfirmedResolved: false,\n    },\n  ],\n};',
  'const mockRequesterDashboardData = {\n  myTickets: {\n    Open: 2,\n    InProgress: 1,\n    Resolved: 1,\n    Closed: 0,\n  }\n};'
);


code = code.replace(
  'it("renders myOpenCount, waitingForRequesterCount, recentlyUpdated, recentlyResolved with mock data", async () => {\r\n    vi.spyOn(api, "getRequesterDashboard").mockResolvedValue(mockRequesterDashboardData);\r\n    render(<RequesterDashboard />);\r\n    await waitFor(() => expect(screen.getByText("My Dashboard")).toBeInTheDocument());\r\n\r\n    expect(screen.getAllByText("2")[0]).toBeInTheDocument(); // Open count\r\n    expect(screen.getAllByText("1")[0]).toBeInTheDocument(); // Waiting count\r\n    expect(screen.getByText("REQ-001")).toBeInTheDocument();\r\n    expect(screen.getByText("REQ-002")).toBeInTheDocument();\r\n    expect(screen.getByText("Confirm Resolution")).toBeInTheDocument();\r\n  });',
  'it("renders myTickets with mock data", async () => {\r\n    vi.spyOn(api, "getRequesterDashboard").mockResolvedValue(mockRequesterDashboardData);\r\n    render(<RequesterDashboard />);\r\n    await waitFor(() => expect(screen.getByText("My Dashboard")).toBeInTheDocument());\r\n\r\n    expect(screen.getAllByText("2")[0]).toBeInTheDocument(); // Open count\r\n    expect(screen.getAllByText("1")[0]).toBeInTheDocument(); // InProgress count\r\n  });'
);

code = code.replace(
  'it("renders myOpenCount, waitingForRequesterCount, recentlyUpdated, recentlyResolved with mock data", async () => {\n    vi.spyOn(api, "getRequesterDashboard").mockResolvedValue(mockRequesterDashboardData);\n    render(<RequesterDashboard />);\n    await waitFor(() => expect(screen.getByText("My Dashboard")).toBeInTheDocument());\n\n    expect(screen.getAllByText("2")[0]).toBeInTheDocument(); // Open count\n    expect(screen.getAllByText("1")[0]).toBeInTheDocument(); // Waiting count\n    expect(screen.getByText("REQ-001")).toBeInTheDocument();\n    expect(screen.getByText("REQ-002")).toBeInTheDocument();\n    expect(screen.getByText("Confirm Resolution")).toBeInTheDocument();\n  });',
  'it("renders myTickets with mock data", async () => {\n    vi.spyOn(api, "getRequesterDashboard").mockResolvedValue(mockRequesterDashboardData);\n    render(<RequesterDashboard />);\n    await waitFor(() => expect(screen.getByText("My Dashboard")).toBeInTheDocument());\n\n    expect(screen.getAllByText("2")[0]).toBeInTheDocument(); // Open count\n    expect(screen.getAllByText("1")[0]).toBeInTheDocument(); // InProgress count\n  });'
);

code = code.replace(
  'it("empty state renders correctly for a zero-ticket Requester", async () => {\r\n    vi.spyOn(api, "getRequesterDashboard").mockResolvedValue({\r\n      myOpenCount: 0,\r\n      waitingForRequesterCount: 0,\r\n      recentlyUpdated: [],\r\n      recentlyResolved: [],\r\n    });\r\n    render(<RequesterDashboard />);\r\n    await waitFor(() => expect(screen.getByText("My Dashboard")).toBeInTheDocument());\r\n\r\n    expect(screen.getByText("No recently updated tickets.")).toBeInTheDocument();\r\n    expect(screen.getByText("No recently resolved tickets.")).toBeInTheDocument();\r\n  });',
  'it("empty state renders correctly for a zero-ticket Requester", async () => {\r\n    vi.spyOn(api, "getRequesterDashboard").mockResolvedValue({\r\n      myTickets: {\r\n        Open: 0,\r\n        InProgress: 0,\r\n        Resolved: 0,\r\n        Closed: 0\r\n      }\r\n    });\r\n    render(<RequesterDashboard />);\r\n    await waitFor(() => expect(screen.getByText("My Dashboard")).toBeInTheDocument());\r\n\r\n    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(4);\r\n  });'
);

code = code.replace(
  'it("empty state renders correctly for a zero-ticket Requester", async () => {\n    vi.spyOn(api, "getRequesterDashboard").mockResolvedValue({\n      myOpenCount: 0,\n      waitingForRequesterCount: 0,\n      recentlyUpdated: [],\n      recentlyResolved: [],\n    });\n    render(<RequesterDashboard />);\n    await waitFor(() => expect(screen.getByText("My Dashboard")).toBeInTheDocument());\n\n    expect(screen.getByText("No recently updated tickets.")).toBeInTheDocument();\n    expect(screen.getByText("No recently resolved tickets.")).toBeInTheDocument();\n  });',
  'it("empty state renders correctly for a zero-ticket Requester", async () => {\n    vi.spyOn(api, "getRequesterDashboard").mockResolvedValue({\n      myTickets: {\n        Open: 0,\n        InProgress: 0,\n        Resolved: 0,\n        Closed: 0\n      }\n    });\n    render(<RequesterDashboard />);\n    await waitFor(() => expect(screen.getByText("My Dashboard")).toBeInTheDocument());\n\n    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(4);\n  });'
);


fs.writeFileSync('client/tests/lab-04/RequesterDashboard.test.tsx', code);
