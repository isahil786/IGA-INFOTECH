import { RequestHandler } from "express";
import { PRICING_PLANS } from "../../shared/workflow";
import type { ProjectCreateRequest } from "@shared/workflow";
import { getSupabaseClient } from "../lib/supabase";
import { verifyToken } from "../lib/auth";
import {
  notifyAdminNewProject,
  notifyClientProjectApproved,
  notifyClientProjectRejected,
} from "../lib/email";

export const createProject: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const { clientId } = decoded;
    const data: ProjectCreateRequest = req.body;

    // Validation
    if (!data.title || !data.service_category || !data.pricing_plan || !data.description) {
      res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
      return;
    }

    const planData = PRICING_PLANS[data.pricing_plan];
    if (!planData) {
      res.status(400).json({
        success: false,
        message: "Invalid pricing plan",
      });
      return;
    }

    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      res.status(500).json({
        success: false,
        message: "Database connection failed",
      });
      return;
    }

    // Create project
    const { data: project, error: projectError } = await supabaseClient
      .from("projects")
      .insert({
        client_id: parseInt(clientId),
        title: data.title,
        service_category: data.service_category,
        description: data.description,
        pricing_plan: data.pricing_plan,
        total_amount: planData.price,
        advance_amount: (planData.price * planData.advance_percentage) / 100,
        final_amount: planData.price - (planData.price * planData.advance_percentage) / 100,
        status: "Pending Approval",
      })
      .select()
      .single();

    if (projectError) {
      console.error("Project creation error:", projectError);
      res.status(500).json({
        success: false,
        message: "Failed to create project",
      });
      return;
    }

    // Create project details if provided
    if (data.technology_stack || data.timeline_days || data.additional_requirements) {
      const { error: detailsError } = await supabaseClient
        .from("project_details")
        .insert({
          project_id: project.id,
          technology_stack: data.technology_stack,
          timeline_days: data.timeline_days,
          budget_range: data.budget_range,
          reference_links: data.reference_links,
          additional_requirements: data.additional_requirements,
        });

      if (detailsError) {
        console.error("Project details error:", detailsError);
        // Don't fail if details insertion fails
      }
    }

    // Create status history record
    await supabaseClient
      .from("project_status_history")
      .insert({
        project_id: project.id,
        new_status: "Pending Approval",
        notes: "Project created by client",
      });

    // Notify admin by email that a new project needs review
    const { data: clientRow } = await supabaseClient
      .from("clients")
      .select("full_name, email")
      .eq("id", parseInt(clientId))
      .maybeSingle();

    if (clientRow) {
      notifyAdminNewProject({
        clientName: clientRow.full_name,
        clientEmail: clientRow.email,
        projectTitle: project.title,
        pricingPlan: project.pricing_plan,
        totalAmount: project.total_amount,
        projectId: String(project.id),
      }).catch((err) => console.error("Failed to send admin notification email:", err));
    }

    console.log("Project created:", project.id);

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create project",
    });
  }
};

export const getProjectById: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const { id } = req.params;

    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      res.status(500).json({ error: "Database connection failed" });
      return;
    }

    // Fetch project
    const { data: project, error: projectError } = await supabaseClient
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("client_id", parseInt(decoded.clientId))
      .single();

    if (projectError || !project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    // Fetch project details
    const { data: details } = await supabaseClient
      .from("project_details")
      .select("*")
      .eq("project_id", id)
      .single();

    // Fetch milestones
    const { data: milestones } = await supabaseClient
      .from("project_milestones")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false });

    // Fetch payments
    const { data: payments } = await supabaseClient
      .from("payments")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false });

    res.json({
      project,
      details,
      milestones,
      payments,
    });
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
};

export const getClientProjects: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      res.status(500).json({ error: "Database connection failed" });
      return;
    }

    const { data: projects, error } = await supabaseClient
      .from("projects")
      .select("*")
      .eq("client_id", parseInt(decoded.clientId))
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Projects fetch error:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
      return;
    }

    res.json({ projects });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

// ---- Admin endpoints ----
// These assume requireAdminAuth middleware has already verified the caller.

export const adminListProjects: RequestHandler = async (req, res) => {
  try {
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      res.status(500).json({ error: "Database connection failed" });
      return;
    }

    const statusFilter = req.query.status as string | undefined;

    let query = supabaseClient
      .from("projects")
      .select("*, clients(full_name, email, phone, whatsapp_number)")
      .order("created_at", { ascending: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error("Admin list projects error:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
      return;
    }

    res.json({ projects });
  } catch (error) {
    console.error("Admin list projects error:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

export const approveProject: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body as { admin_notes?: string };

    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      res.status(500).json({ error: "Database connection failed" });
      return;
    }

    const { data: existing, error: fetchError } = await supabaseClient
      .from("projects")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      res.status(404).json({ success: false, message: "Project not found" });
      return;
    }

    if (existing.status !== "Pending Approval") {
      res.status(400).json({
        success: false,
        message: `Project cannot be approved from status "${existing.status}"`,
      });
      return;
    }

    const { data: project, error } = await supabaseClient
      .from("projects")
      .update({
        status: "Awaiting Advance",
        admin_notes,
        approved_by: "admin",
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Approve project error:", error);
      res.status(500).json({ success: false, message: "Failed to approve project" });
      return;
    }

    await supabaseClient.from("project_status_history").insert({
      project_id: id,
      old_status: "Pending Approval",
      new_status: "Awaiting Advance",
      changed_by: "admin",
      notes: admin_notes || "Approved by admin",
    });

    // Notify the client that their project was approved and an advance
    // payment is now required.
    const { data: clientForApproval } = await supabaseClient
      .from("clients")
      .select("full_name, email")
      .eq("id", project.client_id)
      .maybeSingle();

    if (clientForApproval) {
      notifyClientProjectApproved({
        clientEmail: clientForApproval.email,
        clientName: clientForApproval.full_name,
        projectTitle: project.title,
        advanceAmount: project.advance_amount,
      }).catch((err) => console.error("Failed to send approval email:", err));
    }

    res.json({ success: true, message: "Project approved", project });
  } catch (error) {
    console.error("Approve project error:", error);
    res.status(500).json({ success: false, message: "Failed to approve project" });
  }
};

export const rejectProject: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body as { rejection_reason?: string };

    if (!rejection_reason) {
      res.status(400).json({ success: false, message: "rejection_reason is required" });
      return;
    }

    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      res.status(500).json({ error: "Database connection failed" });
      return;
    }

    const { data: existing, error: fetchError } = await supabaseClient
      .from("projects")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      res.status(404).json({ success: false, message: "Project not found" });
      return;
    }

    if (existing.status !== "Pending Approval") {
      res.status(400).json({
        success: false,
        message: `Project cannot be rejected from status "${existing.status}"`,
      });
      return;
    }

    const { data: project, error } = await supabaseClient
      .from("projects")
      .update({
        status: "Rejected",
        rejection_reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Reject project error:", error);
      res.status(500).json({ success: false, message: "Failed to reject project" });
      return;
    }

    await supabaseClient.from("project_status_history").insert({
      project_id: id,
      old_status: "Pending Approval",
      new_status: "Rejected",
      changed_by: "admin",
      notes: rejection_reason,
    });

    // Notify the client that their project request was rejected.
    const { data: clientForRejection } = await supabaseClient
      .from("clients")
      .select("full_name, email")
      .eq("id", project.client_id)
      .maybeSingle();

    if (clientForRejection) {
      notifyClientProjectRejected({
        clientEmail: clientForRejection.email,
        clientName: clientForRejection.full_name,
        projectTitle: project.title,
        reason: rejection_reason,
      }).catch((err) => console.error("Failed to send rejection email:", err));
    }

    res.json({ success: true, message: "Project rejected", project });
  } catch (error) {
    console.error("Reject project error:", error);
    res.status(500).json({ success: false, message: "Failed to reject project" });
  }
};
