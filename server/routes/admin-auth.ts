import { RequestHandler } from "express";
import { verifyPassword, generateAdminToken } from "../lib/auth";

/**
 * Admin credentials live in environment variables, never in client code.
 * ADMIN_EMAIL: plain email, fine to compare directly.
 * ADMIN_PASSWORD_HASH: a bcrypt hash (generate with `node scripts/hash-admin-password.cjs "yourpassword"`).
 */
export const adminLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required" });
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminEmail || !adminPasswordHash) {
      console.error("ADMIN_EMAIL or ADMIN_PASSWORD_HASH is not configured");
      res.status(500).json({ success: false, message: "Admin login is not configured" });
      return;
    }

    if (email !== adminEmail) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    const passwordOk = await verifyPassword(password, adminPasswordHash);
    if (!passwordOk) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    const token = generateAdminToken(adminEmail);
    res.json({ success: true, message: "Login successful", token });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};
