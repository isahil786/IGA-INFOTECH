import { RequestHandler } from "express";
import { getSupabaseClient } from "../lib/supabase";
import { verifyToken } from "../lib/auth";
import { notifyMilestoneUpdate, notifyProjectDelivered } from "../lib/email";

// ---- Client-facing ----

// Any authenticated client can fetch milestones for their own project.
export const listMilestonesForProject: RequestHandler = async (req, res) => {
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

    // Confirm the project belongs to this client before returning anything.
    const { data: project } = await supabaseClient
      .from("projects")
      .select("id")
      .eq("id", id)
      .eq("client_id", parseInt(decoded.clientId))
      .maybeSingle();

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const { data: milestones, error } = await supabaseClient
      .from("project_milestones")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      res.status(500).json({ error: "Failed to fetch milestones" });
      return;
    }

    res.json({ milestones: milestones || [] });
  } catch (error) {
    console.error("List milestones error:", error);
    res.status(500).json({ error: "Failed to fetch milestones" });
  }
};

// ---- Admin-facing (Phase 4: Progress Tracking) ----

export const createMilestone: RequestHandler = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { title, description, percentage_complete } = req.body as {
      title?: string;
      description?: string;
      percentage_complete?: number;
    };

    if (!title) {
      res.status(400).json({ success: false, message: "title is required" });
      return;
    }

    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      res.status(500).json({ success: false, message: "Database connection failed" });
      return;
    }

    const { data: milestone, error } = await supabaseClient
      .from("project_milestones")
      .insert({
        project_id: projectId,
        title,
        description,
        percentage_complete: percentage_complete ?? 0,
        completed: (percentage_complete ?? 0) >= 100,
      })
      .select()
      .single();

    if (error) {
      console.error("Create milestone error:", error);
      res.status(500).json({ success: false, message: "Failed to create milestone" });
      return;
    }

    await notifyMilestoneClient(projectId, title, percentage_complete ?? 0);

    res.status(201).json({ success: true, milestone });
  } catch (error) {
    console.error("Create milestone error:", error);
    res.status(500).json({ success: false, message: "Failed to create milestone" });
  }
};

export const updateMilestone: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, percentage_complete, completed } = req.body as {
      title?: string;
      description?: string;
      percentage_complete?: number;
      completed?: boolean;
    };

    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      res.status(500).json({ success: false, message: "Database connection failed" });
      return;
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (percentage_complete !== undefined) updates.percentage_complete = percentage_complete;
    if (completed !== undefined) updates.completed = completed;
    else if (percentage_complete !== undefined) updates.completed = percentage_complete >= 100;

    const { data: milestone, error } = await supabaseClient
      .from("project_milestones")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error || !milestone) {
      res.status(404).json({ success: false, message: "Milestone not found" });
      return;
    }

    if (percentage_complete !== undefined) {
      await notifyMilestoneClient(milestone.project_id, milestone.title, percentage_complete);
    }

    res.json({ success: true, milestone });
  } catch (error) {
    console.error("Update milestone error:", error);
    res.status(500).json({ success: false, message: "Failed to update milestone" });
  }
};

async function notifyMilestoneClient(
  projectId: string | number,
  milestoneTitle: string,
  percentageComplete: number,
) {
  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) return;

  const { data: project } = await supabaseClient
    .from("projects")
    .select("title, client_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return;

  const { data: client } = await supabaseClient
    .from("clients")
    .select("full_name, email")
    .eq("id", project.client_id)
    .maybeSingle();
  if (!client) return;

  notifyMilestoneUpdate({
    clientEmail: client.email,
    clientName: client.full_name,
    projectTitle: project.title,
    milestoneTitle,
    percentageComplete,
  }).catch((err) => console.error("Failed to send milestone update email:", err));
}

// Sets/updates the preview link shown on the client dashboard while the
// project is in development.
export const setProjectPreviewUrl: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { preview_url } = req.body as { preview_url?: string };

    if (!preview_url) {
      res.status(400).json({ success: false, message: "preview_url is required" });
      return;
    }

    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      res.status(500).json({ success: false, message: "Database connection failed" });
      return;
    }

    const { data: project, error } = await supabaseClient
      .from("projects")
      .update({ preview_url, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error || !project) {
      res.status(404).json({ success: false, message: "Project not found" });
      return;
    }

    res.json({ success: true, project });
  } catch (error) {
    console.error("Set preview URL error:", error);
    res.status(500).json({ success: false, message: "Failed to set preview URL" });
  }
};

// ---- Admin-facing (Phase 5: Final Delivery / Handover) ----

// Marks the project fully delivered: requires the project to already be
// "Completed" (i.e. final payment received), sets the production URL, and
// notifies the client that their site/app is live.
export const markProjectDelivered: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { production_url, handover_notes } = req.body as {
      production_url?: string;
      handover_notes?: string;
    };

    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      res.status(500).json({ success: false, message: "Database connection failed" });
      return;
    }

    const { data: existing, error: fetchError } = await supabaseClient
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      res.status(404).json({ success: false, message: "Project not found" });
      return;
    }

    if (existing.status !== "Completed") {
      res.status(400).json({
        success: false,
        message: `Project must be fully paid ("Completed") before final handover. Current status: "${existing.status}"`,
      });
      return;
    }

    const { data: project, error } = await supabaseClient
      .from("projects")
      .update({
        production_url: production_url || existing.preview_url,
        admin_notes: handover_notes
          ? `${existing.admin_notes ? existing.admin_notes + "\n" : ""}${handover_notes}`
          : existing.admin_notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Mark delivered error:", error);
      res.status(500).json({ success: false, message: "Failed to mark project as delivered" });
      return;
    }

    await supabaseClient.from("project_status_history").insert({
      project_id: id,
      old_status: "Completed",
      new_status: "Completed",
      changed_by: "admin",
      notes: "Final handover completed — credentials/access transferred, project live.",
    });

    const { data: client } = await supabaseClient
      .from("clients")
      .select("full_name, email")
      .eq("id", project.client_id)
      .maybeSingle();

    if (client) {
      notifyProjectDelivered({
        clientEmail: client.email,
        clientName: client.full_name,
        projectTitle: project.title,
        productionUrl: project.production_url,
      }).catch((err) => console.error("Failed to send delivery email:", err));
    }

    res.json({ success: true, message: "Project marked as delivered", project });
  } catch (error) {
    console.error("Mark delivered error:", error);
    res.status(500).json({ success: false, message: "Failed to mark project as delivered" });
  }
};
