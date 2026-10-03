import { ZEN, priorityBadgeStyle, statusBadgeStyle } from '../theme.js';
import { Badge } from './Badge.js';
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.js";
import { apiFetch } from "../api.js";


// ── Types ──
interface Category {
  id: number;
  name: string;
}

interface StaffUser {
  id: number;
  name: string;
}

interface StaffTicket {
  id: number;
  ticketNumber: string;
  summary: string;
  categoryId: number;
  category: Category | null;
  requestedPriority: string;
  itPriority: string;
  currentStatus: string;
  requester: { id: number; name: string } | null;
  owner: { id: number; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface StaffTicketListMeta {
  totalItems: number;
  page: number;
  totalPages: number;
  pageSize: number;
}

interface StaffTicketListResponse {
  data: StaffTicket[];
  pagination: StaffTicketListMeta;
}

interface StaffTicketFilterParams {
  search?: string;
  category?: string;
  status?: string;
  itPriority?: string;
  ownerId?: number;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}


function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Bug 5 fixed: STATUS_OPTIONS now matches the exact 8 TicketStatus enum values from schema.prisma
const STATUS_OPTIONS = [
  "New",
  "Open",
  "In_Progress",
  "Waiting_for_Requester",
  "Resolved",
  "Closed",
  "Reopened",
  "Cancelled",
];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];

export default function StaffTicketQueue() {
  const { user } = useAuth();

  // ── Filters ──
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(""); // Bug 6: category filter state
  const [itPriorityFilter, setItPriorityFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [sort, setSort] = useState("createdAt:desc");

  // ── Pagination ──
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // ── Data ──
  const [tickets, setTickets] = useState<StaffTicket[]>([]);
  const [meta, setMeta] = useState<StaffTicketListMeta | null>(null);
  // Bug 3 fixed: was `const [categories: Category[]] = useState<Category[]>([]);`
  const [categories, setCategories] = useState<Category[]>([]);
  // Bug 7: IT staff/admin users for owner filter
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);

  // ── UI State ──
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [hasEverLoaded, setHasEverLoaded] = useState(false);

  useEffect(() => {
    apiFetch("/api/categories")
      .then((r) => (r?.ok ? r.json() : []))
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // Bug 7: Fetch IT_Staff and Administrator users for the owner filter
  useEffect(() => {
    apiFetch("/api/users/staff")
      .then((r) => (r?.ok ? r.json() : []))
      .then((data: StaffUser[]) => setStaffUsers(Array.isArray(data) ? data : []))
      .catch(() => setStaffUsers([]));
  }, []);

  // ── Fetch staff queue whenever filters / page change ──
  const loadQueue = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (statusFilter) query.set("status", statusFilter);
      if (categoryFilter) query.set("category", categoryFilter); // Bug 6: wire category filter
      if (itPriorityFilter) query.set("itPriority", itPriorityFilter);
      if (ownerFilter !== "") query.set("ownerId", String(ownerFilter));
      if (sort) query.set("sort", sort);
      query.set("page", String(page));
      query.set("pageSize", String(pageSize));

      const res = await apiFetch(`/api/tickets/queue?${query.toString()}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch staff queue");
      }

      const result: StaffTicketListResponse = await res.json();
      setTickets(result.data);
      setMeta(result.pagination);
      setHasEverLoaded(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [user, search, statusFilter, categoryFilter, itPriorityFilter, ownerFilter, sort, page, pageSize]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Reset to page 1 when any filter changes
  const resetPage = () => setPage(1);

  const handleSearchChange = (v: string) => { setSearch(v); resetPage(); };
  const handleStatusChange = (v: string) => { setStatusFilter(v); resetPage(); };
  const handleCategoryChange = (v: string) => { setCategoryFilter(v); resetPage(); }; // Bug 6
  const handlePriorityChange = (v: string) => { setItPriorityFilter(v); resetPage(); };
  const handleOwnerChange = (v: string) => { setOwnerFilter(v === "" ? "" : String(Number(v))); resetPage(); };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setCategoryFilter(""); // Bug 6
    setItPriorityFilter("");
    setOwnerFilter("");
    setSort("createdAt:desc");
    setPage(1);
  };

  const hasActiveFilters = search || statusFilter || categoryFilter || itPriorityFilter || ownerFilter;

  if (!user) return null;

  // ── Pagination helpers ──
  const totalPages = meta?.totalPages ?? 0;
  const startItem = meta ? (meta.page - 1) * meta.pageSize + 1 : 0;
  const endItem = meta ? Math.min(meta.page * meta.pageSize, meta.totalItems) : 0;

  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);

  // ── Render ──
  return (
    <div
      className="card mb-4"
      style={{ borderColor: ZEN.primary, background: ZEN.pageBg }}
      data-testid="staff-queue"
    >
      {/* ── Header ── */}
      <div
        className="card-header text-white d-flex flex-wrap align-items-center justify-content-between gap-2"
        style={{ backgroundColor: ZEN.primary }}
      >
        <div>
          <strong style={{ fontSize: 20 }}>🎫 Ticket Queue</strong>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>
            IT Staff ticket overview
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
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              data-testid="filter-status"
              style={{ borderColor: ZEN.border }}
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          {/* Bug 6: Category filter <select> rendered and wired to categoryFilter state */}
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
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={itPriorityFilter}
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
          {/* Bug 7: Owner filter populated from staffUsers (IT_Staff + Administrator) */}
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={ownerFilter ? String(ownerFilter) : ""}
              onChange={(e) => handleOwnerChange(e.target.value)}
              data-testid="filter-owner"
              style={{ borderColor: ZEN.border }}
            >
              <option value="">All Owners</option>
              {staffUsers.map((u) => (
                <option key={u.id} value={String(u.id)}>{u.name}</option>
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

        {/* ── Empty State (IT Staff has no tickets ever) ── */}
        {!loading && hasEverLoaded && meta?.totalItems === 0 && !hasActiveFilters && (
          <div className="text-center py-5" data-testid="empty-state">
            <div style={{ fontSize: 48 }}>📋</div>
            <h5 style={{ color: ZEN.neutral }}>No tickets in queue</h5>
            <p className="text-muted">There are no tickets currently in the queue.</p>
          </div>
        )}

        {/* ── No-Results State (filters yield 0 matches) ── */}
        {!loading && hasEverLoaded && meta?.totalItems === 0 && hasActiveFilters && (
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

        {/* ── Desktop Table (>=768px) ── */}
        {!loading && (tickets?.length ?? 0) > 0 && (
          <>
            {/* Desktop */}
            <div className="d-none d-md-block" data-testid="desktop-table">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: 14 }}>
                  <thead style={{ backgroundColor: ZEN.paleBg }}>
                    <tr>
                      {/* Bug 4 fixed: all `ZEN-primary` typos replaced with `ZEN.primary` */}
                      <th style={{ color: ZEN.primary }}>Ticket No.</th>
                      <th style={{ color: ZEN.primary }}>Created</th>
                      <th style={{ color: ZEN.primary }}>Summary</th>
                      <th style={{ color: ZEN.primary }}>Category</th>
                      <th style={{ color: ZEN.primary }}>IT Priority</th>
                      <th style={{ color: ZEN.primary }}>Status</th>
                      <th style={{ color: ZEN.primary }}>Requester</th>
                      <th style={{ color: ZEN.primary }}>Owner</th>
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
                        <td><Badge text={t.itPriority} map={priorityBadgeStyle} /></td>
                        <td><Badge text={t.currentStatus} map={statusBadgeStyle} /></td>
                        <td style={{ color: ZEN.neutral }}>{t.requester?.name ?? "—"}</td>
                        <td style={{ color: ZEN.neutral }}>{t.owner?.name ?? "—"}</td>
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
                      <Badge text={t.currentStatus} map={statusBadgeStyle} />
                    </div>
                    <div style={{ fontSize: 14, color: ZEN.neutral, fontWeight: 500 }} className="mb-1">
                      {t.summary}
                    </div>
                    <div className="d-flex flex-wrap gap-2 align-items-center" style={{ fontSize: 12, color: "#667085" }}>
                      <Badge text={t.itPriority} map={priorityBadgeStyle} />
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
                  Showing {startItem} to {endItem} of {meta.totalItems} tickets
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





