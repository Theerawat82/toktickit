import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.js";
import { apiFetch } from "../api.js";

// ── Types ──
interface Category {
  id: number;
  name: string;
}

interface Ticket {
  id: number;
  ticketNumber: string;
  summary: string;
  description?: string;
  requestedPriority: string;
  currentStatus: string;
  createdAt: string;
  updatedAt: string;
  requesterUserId: number;
  categoryId: number;
  category: Category;
  requesterUser: { id: number; name: string; email: string };
}

interface TicketListMeta {
  totalTickets: number;
  page: number;
  totalPages: number;
  limit: number;
}

interface TicketListResponse {
  data: Ticket[];
  meta: TicketListMeta;
}

interface TicketFilterParams {
  search?: string;
  category?: string;
  requestedPriority?: string;
  currentStatus?: string;
  sort?: string;
  page?: number;
  limit?: number;
}
export const ZEN = {
  primary: "#006B3C",
  secondary: "#0B7A46",
  paleBg: "#EAF6EF",
  pageBg: "#F5F7F6",
  error: "#D92D20",
  warning: "#F79009",
  success: "#039855",
  neutral: "#344054",
  border: "#D0D5DD",
  white: "#FFFFFF",
};

// ── Badge colour mappings ──
const priorityBadge: Record<string, { bg: string; color: string }> = {
  Low:      { bg: ZEN.paleBg,  color: ZEN.primary },
  Medium:   { bg: "#FFF7E6",   color: "#B54708" },
  High:     { bg: "#FEF3F2",   color: "#B42318" },
  Critical: { bg: "#FEE4E2",   color: "#912018" },
};

const statusBadge: Record<string, { bg: string; color: string }> = {
  New:         { bg: ZEN.paleBg,  color: ZEN.primary },
  Open:        { bg: "#E0F2FE",   color: "#026AA2" },
  In_Progress: { bg: "#FFF7E6",   color: "#B54708" },
  Pending:     { bg: "#F2F4F7",   color: "#344054" },
  Resolved:    { bg: "#D1FADF",   color: "#027A48" },
  Closed:      { bg: "#F2F4F7",   color: "#667085" },
};

function Badge({ text, map }: { text: string; map: Record<string, { bg: string; color: string }> }) {
  const key = text.replace(/\s+/g, "_");
  const style = map[key] ?? map[text] ?? { bg: "#F2F4F7", color: "#344054" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];
const STATUS_OPTIONS   = ["New", "Open", "In Progress", "Pending", "Resolved", "Closed"];

export default function MyTickets() {
  const { user } = useAuth();

  // ── Filters ──
  const [search, setSearch]                   = useState("");
  const [categoryFilter, setCategoryFilter]   = useState("");
  const [priorityFilter, setPriorityFilter]   = useState("");
  const [statusFilter, setStatusFilter]       = useState("");
  const [sort, setSort]                       = useState("createdAt:desc");

  // ── Pagination ──
  const [page, setPage]   = useState(1);
  const [limit]           = useState(8);

  // ── Data ──
  const [tickets, setTickets]       = useState<Ticket[]>([]);
  const [meta, setMeta]             = useState<TicketListMeta | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // ── UI State ──
  const [loading, setLoading]       = useState(false);
  const [errorMsg, setErrorMsg]     = useState("");
  // hasEverLoaded distinguishes "never fetched" from "fetched, 0 results"
  const [hasEverLoaded, setHasEverLoaded] = useState(false);

  useEffect(() => {
    apiFetch("/api/categories")
      .then((r) => (r?.ok ? r.json() : []))
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // ── Fetch tickets whenever filters / page / requester change ──
  const loadTickets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (categoryFilter) query.set("category", categoryFilter);
      if (priorityFilter) query.set("requestedPriority", priorityFilter);
      if (statusFilter) query.set("currentStatus", statusFilter);
      if (sort) query.set("sort", sort);
      query.set("page", String(page));
      query.set("limit", String(limit));

      const res = await apiFetch(`/api/tickets?${query.toString()}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch tickets");
      }

      const result: TicketListResponse = await res.json();
      setTickets(result.data);
      setMeta(result.meta);
      setHasEverLoaded(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [user, search, categoryFilter, priorityFilter, statusFilter, sort, page, limit]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Reset to page 1 when any filter changes
  const resetPage = () => setPage(1);

  const handleSearchChange = (v: string) => { setSearch(v); resetPage(); };
  const handleCategoryChange = (v: string) => { setCategoryFilter(v); resetPage(); };
  const handlePriorityChange = (v: string) => { setPriorityFilter(v); resetPage(); };
  const handleStatusChange   = (v: string) => { setStatusFilter(v); resetPage(); };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setPriorityFilter("");
    setStatusFilter("");
    setSort("createdAt:desc");
    setPage(1);
  };

  const hasActiveFilters = search || categoryFilter || priorityFilter || statusFilter;

  if (!user) return null;

  // ── Pagination helpers ──
  const totalPages = meta?.totalPages ?? 0;
  const startItem  = meta ? (meta.page - 1) * meta.limit + 1 : 0;
  const endItem    = meta ? Math.min(meta.page * meta.limit, meta.totalTickets) : 0;

  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);

  // ── Render ──
  return (
    <div
      className="card mb-4"
      style={{ borderColor: ZEN.primary, background: ZEN.pageBg }}
      data-testid="my-tickets"
    >
      {/* ── Header ── */}
      <div
        className="card-header text-white d-flex flex-wrap align-items-center justify-content-between gap-2"
        style={{ backgroundColor: ZEN.primary }}
      >
        <div>
          <strong style={{ fontSize: 20 }}>📋 My Tickets</strong>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>
            View and manage your IT support tickets
          </div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {hasActiveFilters && (
            <button
              className="btn btn-sm btn-outline-light"
              onClick={clearFilters}
              data-testid="clear-filters-btn"
            >
              ✕ Clear Filters
            </button>
          )}
          <a
            href="#create-ticket"
            className="btn btn-sm btn-light fw-semibold"
            style={{ color: ZEN.primary }}
            data-testid="create-ticket-link"
          >
            + Create Ticket
          </a>
        </div>
      </div>

      <div className="card-body" style={{ background: ZEN.white }}>
        {/* ── Filter Controls ── */}
        <div className="row g-2 mb-3" data-testid="filter-controls">
          <div className="col-12 col-md-4">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by ticket number or summary..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              data-testid="search-input"
              style={{ borderColor: ZEN.border }}
            />
          </div>
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
              data-testid="filter-category"
              style={{ borderColor: ZEN.border }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={priorityFilter}
              onChange={(e) => handlePriorityChange(e.target.value)}
              data-testid="filter-priority"
              style={{ borderColor: ZEN.border }}
            >
              <option value="">All Priorities</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              data-testid="filter-status"
              style={{ borderColor: ZEN.border }}
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={sort}
              onChange={(e) => { setSort(e.target.value); resetPage(); }}
              data-testid="sort-select"
              style={{ borderColor: ZEN.border }}
            >
              <option value="createdAt:desc">Newest First</option>
              <option value="createdAt:asc">Oldest First</option>
              <option value="updatedAt:desc">Recently Updated</option>
            </select>
          </div>
        </div>

        {/* ── Error ── */}
        {errorMsg && (
          <div className="alert alert-danger" data-testid="error-state">
            {errorMsg}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="text-center py-5" data-testid="loading-state">
            <div className="spinner-border" style={{ color: ZEN.primary }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2" style={{ color: ZEN.neutral }}>Loading tickets...</p>
          </div>
        )}

        {/* ── Empty State (requester has 0 tickets ever) ── */}
        {!loading && hasEverLoaded && meta?.totalTickets === 0 && !hasActiveFilters && (
          <div className="text-center py-5" data-testid="empty-state">
            <div style={{ fontSize: 48 }}>📭</div>
            <h5 style={{ color: ZEN.neutral }}>No tickets yet</h5>
            <p className="text-muted">You haven't created any IT support tickets.</p>
            <a
              href="#create-ticket"
              className="btn btn-sm text-white"
              style={{ backgroundColor: ZEN.primary }}
            >
              + Create Your First Ticket
            </a>
          </div>
        )}

        {/* ── No-Results State (filters yield 0 matches) ── */}
        {!loading && hasEverLoaded && meta?.totalTickets === 0 && hasActiveFilters && (
          <div className="text-center py-5" data-testid="no-results-state">
            <div style={{ fontSize: 48 }}>🔍</div>
            <h5 style={{ color: ZEN.neutral }}>No matching tickets</h5>
            <p className="text-muted">Try adjusting your search or filter criteria.</p>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* ── Desktop Table (≥768px) ── */}
        {!loading && (tickets?.length ?? 0) > 0 && (
          <>
            {/* Desktop */}
            <div className="d-none d-md-block" data-testid="desktop-table">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: 14 }}>
                  <thead style={{ backgroundColor: ZEN.paleBg }}>
                    <tr>
                      <th style={{ color: ZEN.primary }}>Ticket No.</th>
                      <th style={{ color: ZEN.primary }}>Created</th>
                      <th style={{ color: ZEN.primary }}>Summary</th>
                      <th style={{ color: ZEN.primary }}>Category</th>
                      <th style={{ color: ZEN.primary }}>Priority</th>
                      <th style={{ color: ZEN.primary }}>Status</th>
                      <th style={{ color: ZEN.primary }}>Requester</th>
                      <th style={{ color: ZEN.primary }}>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr key={t.id} data-testid={`ticket-row-${t.id}`}>
                        <td>
                          <a
                            href={`#ticket/${t.id}`}
                            style={{ color: ZEN.secondary, fontWeight: 600 }}
                            data-testid={`ticket-link-${t.id}`}
                          >
                            {t.ticketNumber}
                          </a>
                        </td>
                        <td style={{ color: ZEN.neutral, whiteSpace: "nowrap" }}>{formatDate(t.createdAt)}</td>
                        <td style={{ color: ZEN.neutral, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.summary}
                        </td>
                        <td style={{ color: ZEN.neutral }}>{t.category?.name ?? "—"}</td>
                        <td><Badge text={t.requestedPriority} map={priorityBadge} /></td>
                        <td><Badge text={t.currentStatus} map={statusBadge} /></td>
                        <td style={{ color: ZEN.neutral }}>{t.requesterUser?.name ?? "—"}</td>
                        <td style={{ color: ZEN.neutral, whiteSpace: "nowrap" }}>{formatDate(t.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards (<768px) */}
            <div className="d-md-none" data-testid="mobile-cards">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="card mb-2"
                  style={{ borderLeft: `4px solid ${ZEN.primary}`, borderColor: ZEN.border }}
                  data-testid={`ticket-card-${t.id}`}
                >
                  <div className="card-body py-2 px-3">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <a href={`#ticket/${t.id}`} style={{ color: ZEN.secondary, fontWeight: 700, fontSize: 14 }}>
                        {t.ticketNumber}
                      </a>
                      <Badge text={t.currentStatus} map={statusBadge} />
                    </div>
                    <div style={{ fontSize: 14, color: ZEN.neutral, fontWeight: 500 }} className="mb-1">
                      {t.summary}
                    </div>
                    <div className="d-flex flex-wrap gap-2 align-items-center" style={{ fontSize: 12, color: "#667085" }}>
                      <Badge text={t.requestedPriority} map={priorityBadge} />
                      <span>{t.category?.name}</span>
                      <span>·</span>
                      <span>{formatDate(t.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Pagination Bar ── */}
            {meta && totalPages > 0 && (
              <div
                className="d-flex flex-wrap align-items-center justify-content-between mt-3 px-1"
                style={{ fontSize: 13, color: ZEN.neutral }}
                data-testid="pagination-bar"
              >
                <span data-testid="pagination-info">
                  Showing {startItem} to {endItem} of {meta.totalTickets} tickets
                </span>
                <nav aria-label="Ticket pagination">
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => setPage(page - 1)}
                        disabled={page <= 1}
                        data-testid="prev-page-btn"
                        style={{ color: ZEN.primary }}
                      >
                        &laquo; Previous
                      </button>
                    </li>
                    {pageNumbers.map((n) => (
                      <li key={n} className={`page-item ${n === page ? "active" : ""}`}>
                        <button
                          className="page-link"
                          onClick={() => setPage(n)}
                          data-testid={`page-btn-${n}`}
                          style={n === page ? { backgroundColor: ZEN.primary, borderColor: ZEN.primary } : { color: ZEN.primary }}
                        >
                          {n}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => setPage(page + 1)}
                        disabled={page >= totalPages}
                        data-testid="next-page-btn"
                        style={{ color: ZEN.primary }}
                      >
                        Next &raquo;
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
