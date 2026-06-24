import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleContact, getInquiries, deleteInquiry, updateInquiry } from "./routes/contact";
import { register, login, getProfile } from "./routes/auth";
import { adminLogin } from "./routes/admin-auth";
import {
  createProject,
  getProjectById,
  getClientProjects,
  adminListProjects,
  approveProject,
  rejectProject,
} from "./routes/projects";
import { createOrder, verifyPayment, razorpayWebhook } from "./routes/payments";
import {
  createMilestone,
  updateMilestone,
  listMilestonesForProject,
  setProjectPreviewUrl,
  markProjectDelivered,
} from "./routes/milestones";
import { requireAdminAuth } from "./lib/auth";

export function createServer() {
  if (!process.env.JWT_SECRET) {
    console.warn(
      "⚠️  JWT_SECRET is not set. Client auth tokens cannot be issued or verified until you set it.",
    );
  }

  const app = express();

  // Middleware
  app.use(cors());

  // Razorpay webhooks must be verified against the exact raw request body.
  // Apply raw-body parsing ONLY to that one route, before the global JSON
  // parser — this avoids interfering with normal JSON body parsing for
  // every other route (which broke in the Netlify Functions environment
  // when using a global express.json({ verify }) approach).
  app.use("/api/payments/webhook", express.raw({ type: "*/*" }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Contact form submission
  app.post("/api/contact", handleContact);

  // Admin auth
  app.post("/api/admin/login", adminLogin);

  // Admin endpoints (all require a valid admin token)
  app.get("/api/admin/inquiries", requireAdminAuth, async (_req, res) => {
    try {
      const inquiries = await getInquiries();
      res.json({ inquiries });
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ error: "Failed to fetch inquiries" });
    }
  });

  app.delete("/api/admin/inquiries/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = req.params.id as string;
      await deleteInquiry(id);
      res.json({ success: true, message: "Inquiry deleted" });
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      res.status(500).json({ error: "Failed to delete inquiry" });
    }
  });

  app.put("/api/admin/inquiries/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = req.params.id as string;
      const updates = req.body;
      await updateInquiry(id, updates);
      res.json({ success: true, message: "Inquiry updated" });
    } catch (error) {
      console.error("Error updating inquiry:", error);
      res.status(500).json({ error: "Failed to update inquiry" });
    }
  });

  // Admin: project approval workflow
  app.get("/api/admin/projects", requireAdminAuth, adminListProjects);
  app.post("/api/admin/projects/:id/approve", requireAdminAuth, approveProject);
  app.post("/api/admin/projects/:id/reject", requireAdminAuth, rejectProject);

  // Client Authentication Endpoints
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
  app.get("/api/client/profile", getProfile);

  // Project Management Endpoints
  app.post("/api/projects/create", createProject);
  app.get("/api/projects/:id", getProjectById);
  app.get("/api/projects", getClientProjects);

  // Payment Endpoints (Razorpay)
  app.post("/api/payments/create-order", createOrder);
  app.post("/api/payments/verify", verifyPayment);
  app.post("/api/payments/webhook", razorpayWebhook);

  // Milestone / Progress Tracking Endpoints
  app.get("/api/projects/:id/milestones", listMilestonesForProject);
  app.post("/api/admin/projects/:id/milestones", requireAdminAuth, createMilestone);
  app.put("/api/admin/milestones/:id", requireAdminAuth, updateMilestone);
  app.post("/api/admin/projects/:id/preview-url", requireAdminAuth, setProjectPreviewUrl);

  // Final Delivery Endpoint
  app.post("/api/admin/projects/:id/deliver", requireAdminAuth, markProjectDelivered);

  return app;
}