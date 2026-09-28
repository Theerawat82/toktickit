import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// GET /api/dashboard/staff
router.get("/staff", requireRole(["IT_Staff", "Administrator"]), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);

    // 1. unassignedCount
    const unassignedCount = await prisma.ticket.count({
      where: {
        ticketOwnerId: null,
        currentStatus: { notIn: ["Closed", "Cancelled"] },
      },
    });

    // 2. myAssignedCount
    const myAssignedCount = await prisma.ticket.count({
      where: {
        ticketOwnerId: req.user!.id,
        currentStatus: { notIn: ["Resolved", "Closed", "Cancelled"] },
      },
    });

    // 3. statusBreakdown
    const groupedByStatus = await prisma.ticket.groupBy({
      by: ["currentStatus"],
      _count: true,
    });
    const statusBreakdown: Record<string, number> = {};
    for (const g of groupedByStatus) {
      const key = g.currentStatus === "In_Progress" ? "InProgress" : g.currentStatus;
      statusBreakdown[key] = g._count;
    }

    // 4. priorityBreakdown
    const groupedByPriority = await prisma.ticket.groupBy({
      by: ["itPriority"],
      where: {
        currentStatus: { notIn: ["Closed", "Cancelled"] },
      },
      _count: true,
    });

    const priorityBreakdown: Record<string, number> = {};
    for (const g of groupedByPriority) {
      priorityBreakdown[g.itPriority || "Unprioritized"] = g._count;
    }

    // 5. recentlyUpdated
    const recentlyUpdatedRows = await prisma.ticket.findMany({
      where: {
        updatedAt: { gte: sevenDaysAgo },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        ticketNumber: true,
        summary: true,
        currentStatus: true,
        updatedAt: true,
        ticketOwnerId: true,
      },
    });

    const response: any = {
      unassignedCount,
      myAssignedCount,
      statusBreakdown,
      priorityBreakdown,
      recentlyUpdated: recentlyUpdatedRows,
    };

    // 0C. Administrator optional fields
    if (req.user!.role === "Administrator") {
      const activeUserCount = await prisma.user.count({ where: { isActive: true } });
      const inactiveUserCount = await prisma.user.count({ where: { isActive: false } });
      response.activeUserCount = activeUserCount;
      response.inactiveUserCount = inactiveUserCount;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Staff dashboard error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard" });
  }
});

// GET /api/dashboard/requester
router.get("/requester", requireRole(["Requester"]), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);

    // Reject explicit requesterId in body or query
    if (req.query.requesterId || req.body.requesterId) {
      return res.status(400).json({ error: "requesterId must not be provided" });
    }

    const requesterId = req.user!.id;

    // Get counts grouped by status
    const groupedByStatus = await prisma.ticket.groupBy({
      by: ["currentStatus"],
      where: { requesterId },
      _count: true,
    });

    const myTickets: Record<string, number> = {
      "Open": 0,
      "InProgress": 0,
      "Resolved": 0,
      "Closed": 0
    };

    for (const g of groupedByStatus) {
      if (g.currentStatus === "Open" || g.currentStatus === "New") myTickets["Open"] += g._count;
      else if (g.currentStatus === "In_Progress" || g.currentStatus === "Waiting_for_Requester") myTickets["InProgress"] += g._count;
      else if (g.currentStatus === "Resolved") myTickets["Resolved"] += g._count;
      else if (g.currentStatus === "Closed") myTickets["Closed"] += g._count;
    }

    res.status(200).json({ myTickets });
  } catch (error) {
    console.error("Requester dashboard error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard" });
  }
});

export default router;
