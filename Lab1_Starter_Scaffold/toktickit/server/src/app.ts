import express from "express";
import cors from "cors";

import healthRouter from "./routes/health.js";
import requestersRouter from "./routes/requesters.js";
import categoriesRouter from "./routes/categories.js";
import relatedSystemsRouter from "./routes/relatedSystems.js";
import ticketsRouter from "./routes/tickets.js";
import attachmentsRouter from "./routes/attachments.js";
import usersRouter from "./routes/users.js";

import adminUsersRouter from "./routes/adminUsers.js";
import dashboardRouter from "./routes/dashboard.js";

import { requireAuth, requireRole } from "./middleware/auth.js";

// The Express app is exported separately from app.listen() (see index.ts) so
// Supertest can import `app` without opening a port. Do not merge these files.
const app = express();

app.use(cors()); // lets the Vite dev server call this API
app.use(express.json());
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: "Malformed JSON payload" });
  }
  next(err);
});

// ---------------------------------------------------------------------------
// Issue 2 — Health check
// ---------------------------------------------------------------------------
app.use("/api", healthRouter);
app.use("/api/dashboard", requireAuth, dashboardRouter);

// ---------------------------------------------------------------------------
// Issue 3 — Authentication
// ---------------------------------------------------------------------------
import authRouter from "./routes/auth.js";
app.use("/api/auth", authRouter);

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

// ---------------------------------------------------------------------------
// Issue 6 — Staff user list (GET /api/users/staff)
// ---------------------------------------------------------------------------
app.use("/api/users", usersRouter);



// ---------------------------------------------------------------------------

// Issue 8 — Admin User Management (GET/POST/PATCH /api/admin/users)

// ---------------------------------------------------------------------------

app.use("/api/admin/users", requireAuth, requireRole(["Administrator"]), adminUsersRouter);

export { app };
export default app;
