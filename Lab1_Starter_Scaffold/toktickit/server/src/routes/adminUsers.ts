import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getPrisma } from "../prisma.js";

const router = Router();

// GET /api/admin/users
router.get("/", async (req: Request, res: Response) => {
  try {
    const { search, role, isActive } = req.query;
    const prisma = getPrisma();

    let whereClause: any = {};

    if (search && typeof search === "string") {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role && typeof role === "string") {
      let mappedRole = role;
      if (role === "IT Staff") mappedRole = "IT_Staff";
      whereClause.role = mappedRole;
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive === "true";
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        mustChangePassword: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // We emulate the pagination structure requested by the API spec but without actual slicing since "No pagination" is explicitly requested in the prompt's exclusion.
    // Spec: "No pagination... explicitly excluded in the handout — do not add them."
    // BUT the response format in the API spec has:
    // { "data": [...], "pagination": { ... } }
    // I will supply a dummy pagination object or just the data, but to match the shape:
    res.status(200).json({
      data: users,
      pagination: {
        page: 1,
        pageSize: users.length || 20,
        totalItems: users.length,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error("Failed to list users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/admin/users
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, email, role, password, isActive } = req.body;
    
    if (!name || !email || !role || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let mappedRole = role;
    if (role === "IT Staff") mappedRole = "IT_Staff";
    
    const validRoles = ["Requester", "IT_Staff", "Administrator"];
    if (!validRoles.includes(mappedRole)) {
      return res.status(400).json({ error: "Invalid role value" });
    }

    const prisma = getPrisma();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "User with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role: mappedRole,
        password: hashedPassword,
        isActive: isActive !== undefined ? isActive : true,
        mustChangePassword: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
      }
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Failed to create user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PATCH /api/admin/users/:id
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    if ((isNaN(userId) || !Number.isInteger(userId) || userId <= 0)) return res.status(400).json({ error: "Invalid ID" });

    const { name, email, role, isActive } = req.body;
    const prisma = getPrisma();

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) return res.status(404).json({ error: "User not found" });

    if (email && email !== existingUser.email) {
      const emailConflict = await prisma.user.findUnique({ where: { email } });
      if (emailConflict) {
        return res.status(409).json({ error: "User with this email already exists." });
      }
    }

    let mappedRole = role;
    if (role) {
      if (role === "IT Staff") mappedRole = "IT_Staff";
      const validRoles = ["Requester", "IT_Staff", "Administrator"];
      if (!validRoles.includes(mappedRole)) {
        return res.status(400).json({ error: "Invalid role value" });
      }
    }

    // BR-13: Self-deactivation block
    if (req.user && req.user.id === userId && isActive === false) {
      return res.status(400).json({ error: "Cannot deactivate your own account." });
    }

    // BR-14: Last active Admin block
    if (existingUser.role === "Administrator" && existingUser.isActive === true) {
      const isDeactivating = isActive === false;
      const isDemoting = mappedRole && mappedRole !== "Administrator";
      
      if (isDeactivating || isDemoting) {
        const activeAdminCount = await prisma.user.count({
          where: { role: "Administrator", isActive: true }
        });

        if (activeAdminCount <= 1) {
           return res.status(400).json({ error: "Cannot deactivate the last active Administrator account." });
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(mappedRole !== undefined && { role: mappedRole }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      }
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Failed to update user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/admin/users/:id/reset-password
router.post("/:id/reset-password", async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    if ((isNaN(userId) || !Number.isInteger(userId) || userId <= 0)) return res.status(400).json({ error: "Invalid ID" });

    const { newInitialPassword } = req.body;
    if (!newInitialPassword) {
      return res.status(400).json({ error: "Missing new password" });
    }

    const hasMinLength = newInitialPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newInitialPassword);
    const hasLower = /[a-z]/.test(newInitialPassword);
    const hasNumber = /[0-9]/.test(newInitialPassword);
    const hasSymbol = /[^A-Za-z0-9]/.test(newInitialPassword);
    
    if (!hasMinLength || !hasUpper || !hasLower || !hasNumber || !hasSymbol) {
      return res.status(400).json({ error: "Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character." });
    }

    const prisma = getPrisma();
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) return res.status(404).json({ error: "User not found" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newInitialPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: true,
      }
    });

    res.status(200).json({ message: "User password reset successfully." });
  } catch (error) {
    console.error("Failed to reset password:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
