import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { RequestHandler } from "express";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";
const SALT_ROUNDS = 10;

if (!JWT_SECRET) {
  // Fail loudly at boot rather than silently signing tokens with "undefined".
  // Set JWT_SECRET in your environment before starting the server.
  console.error(
    "FATAL: JWT_SECRET is not set. Set it in your environment before starting the server.",
  );
}

export interface AuthTokenPayload {
  clientId: string;
}

export interface AdminTokenPayload {
  role: "admin";
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(clientId: string): string {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ clientId } as AuthTokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  if (!JWT_SECRET) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    if (!decoded?.clientId) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function generateAdminToken(email: string): string {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return jwt.sign(
    { role: "admin", email } as AdminTokenPayload,
    JWT_SECRET,
    { expiresIn: "12h" },
  );
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  if (!JWT_SECRET) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
    if (decoded?.role !== "admin") return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Express middleware: requires a valid admin JWT in the Authorization header.
 */
export const requireAdminAuth: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  const decoded = verifyAdminToken(token);
  if (!decoded) {
    res.status(401).json({ success: false, message: "Invalid or expired admin token" });
    return;
  }

  next();
};

/**
 * Express middleware: requires a valid client JWT in the Authorization header.
 * On success, attaches `req.clientId` for downstream handlers.
 */
export const requireClientAuth: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
    return;
  }

  (req as any).clientId = decoded.clientId;
  next();
};

declare global {
  namespace Express {
    interface Request {
      clientId?: string;
    }
  }
}
