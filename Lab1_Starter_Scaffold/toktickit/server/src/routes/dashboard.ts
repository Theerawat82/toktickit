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
        currentStatus: { notIn: ["Closed", "Cancelled"] },
      },
    });

    // 3. byStatus
    const groupedByStatus = await prisma.ticket.groupBy({
      by: ["currentStatus"],
      _count: true,
    });
    const byStatus = groupedByStatus.map((g: any) => ({
      status: g.currentStatus,
      count: g._count,
    }));

    // 4. byItPriority
    const groupedByPriority = await prisma.ticket.groupBy({
      by: ["itPriority"],
      where: {
        currentStatus: { notIn: ["Closed", "Cancelled"] },
      },
      _count: true,
    });

    // We also need to count tickets where itPriority IS NULL
    // In our schema, itPriority is an enum with a default, but if there are somehow nulls:
    // Wait, prisma schema says itPriority is NOT NULL (default Low). But requirements say:
    // "including a separate bucket for itPriority IS NULL, labeled distinctly e.g. 'Unprioritized'"
    // We will just fetch nulls if they exist in the DB, though Prisma typing might say it's not possible.
    const byItPriority = groupedByPriority.map((g: any) => ({
      priority: g.itPriority || "Unprioritized",
      count: g._count,
    }));

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
      byStatus,
      byItPriority,
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

    // 1. myOpenCount
    const myOpenCount = await prisma.ticket.count({
      where: {
        requesterId,
        currentStatus: { notIn: ["Resolved", "Closed", "Cancelled"] },
      },
    });

    // 2. waitingForRequesterCount
    const waitingForRequesterCount = await prisma.ticket.count({
      where: {
        requesterId,
        currentStatus: "Waiting for Requester",
      },
    });

    // 3. recentlyUpdated
    const recentlyUpdatedRows = await prisma.ticket.findMany({
      where: {
        requesterId,
        updatedAt: { gte: sevenDaysAgo },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        ticketNumber: true,
        summary: true,
        currentStatus: true,
        updatedAt: true,
        ticketOwnerId: true,
      },
    });

    // 4. recentlyResolved
    const recentlyResolvedRows = await prisma.ticket.findMany({
      where: {
        requesterId,
        currentStatus: { in: ["Resolved", "Closed"] },
        updatedAt: { gte: sevenDaysAgo },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        ticketNumber: true,
        summary: true,
        currentStatus: true,
        updatedAt: true,
        ticketOwnerId: true,
        requesterConfirmedResolved: true,
      },
    });

    res.status(200).json({
      myOpenCount,
      waitingForRequesterCount,
      recentlyUpdated: recentlyUpdatedRows,
      recentlyResolved: recentlyResolvedRows,
    });
  } catch (error) {
    console.error("Requester dashboard error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard" });
  }
});

export default router;
