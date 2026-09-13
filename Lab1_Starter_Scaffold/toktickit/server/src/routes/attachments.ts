import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import path from "path";
import fs from "fs";

import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/attachments/:id (Metadata)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const requesterId = req.user.id;

    const attachmentId = Number(req.params.id);
    if (isNaN(attachmentId)) {
      return res.status(400).json({ error: "Invalid attachment ID" });
    }

    const prisma = getPrisma();
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true }
    });

    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    // IT Staff and Admins bypass Requester-level ownership check
    if (req.user.role !== "IT Staff" && req.user.role !== "Administrator") {
      if ((attachment.ticket as any).requesterId !== Number(requesterId) &&
          (attachment.ticket as any).requesterUserId !== Number(requesterId)) {
        return res.status(404).json({ error: "Attachment not found" });
      }
    }

    // Even if removed, metadata might be requested by the frontend to show "Removed" state.
    // If we shouldn't return it for removed files, we'd check here, but the spec says "metadata remains visible".
    
    // We omit the nested ticket object to match typical metadata responses or just send it all
    const { ticket, ...metadata } = attachment;
    res.status(200).json(metadata);
  } catch (error) {
    console.error("Failed to fetch attachment metadata:", error);
    res.status(500).json({ error: "Failed to fetch attachment metadata" });
  }
});

// GET /api/attachments/:id/download
router.get("/:id/download", async (req: Request, res: Response) => {
  try {
    const requesterId = req.user.id;

    const attachmentId = Number(req.params.id);
    if (isNaN(attachmentId)) {
      return res.status(400).json({ error: "Invalid attachment ID" });
    }

    const prisma = getPrisma();
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true }
    });

    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    // Security: Return 404 (not 403) on ownership failure to prevent IDOR enumeration.
    if (req.user.role !== "IT Staff" && req.user.role !== "Administrator") {
      if ((attachment.ticket as any).requesterId !== Number(requesterId) &&
          (attachment.ticket as any).requesterUserId !== Number(requesterId)) {
        return res.status(404).json({ error: "Attachment not found" });
      }
    }

    if (attachment.isRemoved) {
      return res.status(404).json({ error: "Attachment has been removed" });
    }

    const filePath = path.join(process.cwd(), attachment.fileUrl);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    res.download(filePath, attachment.fileName);
  } catch (error) {
    console.error("Failed to download attachment:", error);
    res.status(500).json({ error: "Failed to download attachment" });
  }
});

// POST /api/attachments/:id/remove
router.post("/:id/remove", async (req: Request, res: Response) => {
  try {
    const requesterId = req.user.id;

    const attachmentId = Number(req.params.id);
    if (isNaN(attachmentId)) {
      return res.status(400).json({ error: "Invalid attachment ID" });
    }

    const { removalReason } = req.body;
    if (!removalReason || typeof removalReason !== 'string' || removalReason.trim().length === 0) {
      return res.status(400).json({ error: "removalReason is required" });
    }

    const prisma = getPrisma();
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true }
    });

    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    // Security: Return 404 (not 403) on ownership failure to prevent IDOR enumeration.
    if (req.user.role !== "IT Staff" && req.user.role !== "Administrator") {
      if ((attachment.ticket as any).requesterId !== Number(requesterId) &&
          (attachment.ticket as any).requesterUserId !== Number(requesterId)) {
        return res.status(404).json({ error: "Attachment not found" });
      }
    }

    if (attachment.isRemoved) {
      return res.status(400).json({ error: "Attachment is already removed" });
    }

    const updated = await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        isRemoved: true,
        removedAt: new Date(),
        removalReason: removalReason.trim()
      }
    });

    res.status(200).json({ message: "Attachment removed successfully", id: updated.id });
  } catch (error) {
    console.error("Failed to soft-remove attachment:", error);
    res.status(500).json({ error: "Failed to remove attachment" });
  }
});

export default router;
