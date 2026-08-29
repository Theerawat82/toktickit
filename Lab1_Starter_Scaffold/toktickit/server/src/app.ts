import express from "express";
import cors from "cors";

import healthRouter from "./routes/health.js";
import requestersRouter from "./routes/requesters.js";
import categoriesRouter from "./routes/categories.js";
import relatedSystemsRouter from "./routes/relatedSystems.js";
import ticketsRouter from "./routes/tickets.js";
import attachmentsRouter from "./routes/attachments.js";

// The Express app is exported separately from app.listen() (see index.ts) so
// Supertest can import `app` without opening a port. Do not merge these files.
const app = express();

app.use(cors()); // lets the Vite dev server call this API
app.use(express.json());

// ---------------------------------------------------------------------------
// Issue 2 — Health check
// ---------------------------------------------------------------------------
app.use("/api", healthRouter);

// ---------------------------------------------------------------------------
// Issue 3 — Requester context (GET /api/requesters?active=true)
// ---------------------------------------------------------------------------
app.use("/api/requesters", requestersRouter);

// ---------------------------------------------------------------------------
// Issue 4 — Category list (GET /api/categories)
// ---------------------------------------------------------------------------
app.use("/api/categories", categoriesRouter);

// ---------------------------------------------------------------------------
// Issue 4 — Related systems (GET /api/related-systems)
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
app.use("/api/related-systems", relatedSystemsRouter);

// ---------------------------------------------------------------------------
// Issue 12 — Tickets
// ---------------------------------------------------------------------------
app.use("/api/tickets", ticketsRouter);

// ---------------------------------------------------------------------------
// Issue 6 — Attachments
// ---------------------------------------------------------------------------
app.use("/api/attachments", attachmentsRouter);

export { app };
export default app;
