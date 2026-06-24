import { RequestHandler } from "express";
import type { RazorpayOrderRequest } from "@shared/workflow";
import { getSupabaseClient } from "../lib/supabase";
import { verifyToken } from "../lib/auth";
import {
  getRazorpayClient,
  getRazorpayKeyId,
  verifyPaymentSignature,
  verifyWebhookSignature,
  toPaise,
} from "../lib/razorpay";
import { notifyPaymentReceived } from "../lib/email";

/**
 * Decide which payment a project should be allowed to pay right now, and how
 * much. This is computed server-side from the project record — the client
 * never gets to decide the amount.
 */
function resolvePayableAmount(project: any, paymentType: "advance" | "final") {
  if (paymentType === "advance") {
    if (project.status !== "Awaiting Advance") return null;
    return project.advance_amount - (project.advance_paid || 0);
  }
  if (paymentType === "final") {
    if (project.status !== "Awaiting Final Payment") return null;
    return project.final_amount - (project.final_paid || 0);
  }
  return null;
}

// Step 1: client asks us to create a Razorpay order for their project's
// current payment step. We compute the amount ourselves from the DB.
export const createOrder: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ success: false, message: "Invalid token" });
      return;
    }

    const { project_id, payment_type } = req.body as RazorpayOrderRequest;
    if (!project_id || !payment_type) {
      res.status(400).json({ success: false, message: "project_id and payment_type are required" });
      return;
    }

    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      res.status(500).json({ success: false, message: "Database connection failed" });
      return;
    }

    const { data: project, error: projectError } = await supabaseClient
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .eq("client_id", parseInt(decoded.clientId))
      .single();

    if (projectError || !project) {
      res.status(404).json({ success: false, message: "Project not found" });
      return;
    }

    const amount = resolvePayableAmount(project, payment_type);
    if (amount === null || amount <= 0) {
      res.status(400).json({
        success: false,
        message: `Project is not ready for a ${payment_type} payment right now (current status: ${project.status})`,
      });
      return;
    }

    const razorpay = getRazorpayClient();
    if (!razorpay) {
      res.status(500).json({ success: false, message: "Payment gateway is not configured" });
      return;
    }

    const order = await razorpay.orders.create({
      amount: toPaise(amount),
      currency: "INR",
      receipt: `proj_${project.id}_${payment_type}_${Date.now()}`,
      notes: { project_id: String(project.id), payment_type },
    });

    // Record a pending payment row tied to this order
    const { error: paymentInsertError } = await supabaseClient.from("payments").insert({
      project_id: project.id,
      client_id: project.client_id,
      razorpay_order_id: order.id,
      amount,
      payment_type,
      status: "pending",
    });

    if (paymentInsertError) {
      console.error("Failed to record pending payment:", paymentInsertError);
    }

    res.json({
      success: true,
      order_id: order.id,
      amount: toPaise(amount),
      currency: "INR",
      key_id: getRazorpayKeyId(),
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ success: false, message: "Failed to create payment order" });
  }
};

// Step 2: after Razorpay Checkout succeeds client-side, the client posts the
// order/payment/signature back to us. We verify the signature ourselves
// before trusting anything — a client-side "success" callback is not proof.
export const verifyPayment: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ success: false, message: "Invalid token" });
      return;
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ success: false, message: "Missing payment verification fields" });
      return;
    }

    const signatureValid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!signatureValid) {
      res.status(400).json({ success: false, message: "Payment signature verification failed" });
      return;
    }

    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      res.status(500).json({ success: false, message: "Database connection failed" });
      return;
    }

    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .select("*")
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("client_id", parseInt(decoded.clientId))
      .single();

    if (paymentError || !payment) {
      res.status(404).json({ success: false, message: "Payment record not found" });
      return;
    }

    if (payment.status === "success") {
      // Already processed (e.g. webhook beat us to it) — idempotent no-op.
      res.json({ success: true, message: "Payment already confirmed" });
      return;
    }

    await applyConfirmedPayment(supabaseClient, payment, razorpay_payment_id, razorpay_signature);

    res.json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};

// Shared logic used by both the client-confirmation endpoint above and the
// webhook handler below, so a payment only ever gets applied once and the
// project status transitions consistently either way.
async function applyConfirmedPayment(
  supabaseClient: ReturnType<typeof getSupabaseClient>,
  payment: any,
  razorpayPaymentId: string,
  razorpaySignature?: string,
) {
  if (!supabaseClient) return;

  await supabaseClient
    .from("payments")
    .update({
      status: "success",
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  const { data: project } = await supabaseClient
    .from("projects")
    .select("*")
    .eq("id", payment.project_id)
    .single();

  if (!project) return;

  const isAdvance = payment.payment_type === "advance";
  const updatedPaid = (isAdvance ? project.advance_paid : project.final_paid) + Number(payment.amount);

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (isAdvance) {
    updates.advance_paid = updatedPaid;
    if (updatedPaid >= project.advance_amount) {
      updates.status = "In Development";
    }
  } else {
    updates.final_paid = updatedPaid;
    if (updatedPaid >= project.final_amount) {
      updates.status = "Completed";
    }
  }

  const { data: updatedProject } = await supabaseClient
    .from("projects")
    .update(updates)
    .eq("id", project.id)
    .select()
    .single();

  await supabaseClient.from("project_status_history").insert({
    project_id: project.id,
    old_status: project.status,
    new_status: updates.status || project.status,
    changed_by: "system",
    notes: `${isAdvance ? "Advance" : "Final"} payment of ₹${payment.amount} confirmed`,
  });

  const { data: client } = await supabaseClient
    .from("clients")
    .select("full_name, email")
    .eq("id", project.client_id)
    .maybeSingle();

  if (client) {
    notifyPaymentReceived({
      clientEmail: client.email,
      clientName: client.full_name,
      projectTitle: project.title,
      amount: Number(payment.amount),
      paymentType: payment.payment_type,
    }).catch((err) => console.error("Failed to send payment confirmation email:", err));
  }

  return updatedProject;
}

// Step 3 (defense-in-depth): Razorpay also calls this webhook directly from
// their servers. This is what actually guarantees we record a payment even
// if the client's browser closes/crashes right after paying, before the
// verify-payment call above can fire.
export const razorpayWebhook: RequestHandler = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string | undefined;
    const rawBody = (req as any).rawBody as string | undefined;

    if (!signature || !rawBody || !verifyWebhookSignature(rawBody, signature)) {
      res.status(400).json({ success: false, message: "Invalid webhook signature" });
      return;
    }

    const event = req.body?.event as string;
    if (event !== "payment.captured" && event !== "order.paid") {
      // Acknowledge but ignore events we don't care about.
      res.json({ success: true });
      return;
    }

    const paymentEntity = req.body?.payload?.payment?.entity;
    if (!paymentEntity) {
      res.json({ success: true });
      return;
    }

    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      res.status(500).json({ success: false, message: "Database connection failed" });
      return;
    }

    const { data: payment } = await supabaseClient
      .from("payments")
      .select("*")
      .eq("razorpay_order_id", paymentEntity.order_id)
      .single();

    if (!payment || payment.status === "success") {
      // Unknown order, or already processed via the client-side verify call.
      res.json({ success: true });
      return;
    }

    await applyConfirmedPayment(supabaseClient, payment, paymentEntity.id);

    res.json({ success: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    res.status(500).json({ success: false, message: "Webhook processing failed" });
  }
};
