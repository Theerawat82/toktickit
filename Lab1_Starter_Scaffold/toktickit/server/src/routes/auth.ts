import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPrisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-development";
const JWT_EXPIRES_IN = "24h";

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is inactive. Please contact your administrator." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Generate token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Exclude password from the returned user object
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

// POST /api/auth/logout
router.post("/logout", requireAuth, async (req: Request, res: Response) => {
  // Since we are using stateless JWT, we just instruct the client to discard the token.
  res.status(200).json({ message: "Logged out successfully." });
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Exclude password
  const { password: _, ...userWithoutPassword } = req.user;
  res.status(200).json({ user: userWithoutPassword });
});

// POST /api/auth/change-password
router.post("/change-password", requireAuth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password incorrect." });
    }

    if (currentPassword === newPassword) {
       return res.status(400).json({
          errors: [{ field: "newPassword", message: "New password cannot be the same as the old password." }]
       });
    }

    // Validate complexity: 8 chars, uppercase, lowercase, number, special
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        errors: [{
          field: "newPassword",
          message: "Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character."
        }]
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Change password failed:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

export default router;
