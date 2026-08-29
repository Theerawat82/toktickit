const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Category {
  id: number;
  name: string;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

// Issue 2 + Issue 4 — call the backend.
// Steps: fetch `${API_URL}/api/health`; if not ok, throw.
//        then fetch `${API_URL}/api/categories`; if not ok, throw.
//        return { online: true, categories }.
// Throwing on failure lets the UI show a single Offline/error state.
export async function checkSystem(): Promise<SystemStatus> {
  try {
    const healthRes = await fetch(`${API_URL}/api/health`);
    if (!healthRes.ok) {
      throw new Error("Backend is offline");
    }

    const healthData = await healthRes.json();
    if (healthData.service !== "TokTickIT API") {
      throw new Error("Unexpected service name from backend");
    }

    const categoriesRes = await fetch(`${API_URL}/api/categories`);
    if (!categoriesRes.ok) {
      throw new Error("Failed to fetch categories");
    }
    
    const categories = await categoriesRes.json();

    return { online: true, categories };
  } catch (error) {
    console.error("Health check failed:", error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Issue 5 — My Tickets API
// ---------------------------------------------------------------------------

export interface Ticket {
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

export interface TicketListMeta {
  totalTickets: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface TicketListResponse {
  data: Ticket[];
  meta: TicketListMeta;
}

export interface TicketFilterParams {
  search?: string;
  category?: string;
  requestedPriority?: string;
  currentStatus?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export async function fetchTickets(
  params: TicketFilterParams,
  requesterId: number
): Promise<TicketListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  if (params.requestedPriority) query.set("requestedPriority", params.requestedPriority);
  if (params.currentStatus) query.set("currentStatus", params.currentStatus);
  if (params.sort) query.set("sort", params.sort);
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 8));

  const res = await fetch(`/api/tickets?${query.toString()}`, {
    headers: { "x-requester-id": String(requesterId) }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to fetch tickets");
  }

  return res.json();
}
