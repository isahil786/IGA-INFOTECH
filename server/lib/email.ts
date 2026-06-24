// Reusable Brevo (Sendinblue) email helper for transactional workflow
// notifications: project created, approved, rejected, payment received,
// milestone updates, and final delivery.
//
// Requires BREVO_API_KEY in the environment. If it's missing, emails are
// skipped (logged only) so the rest of the workflow never breaks because of
// a missing/misconfigured email provider.

const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "iga.infotech@gmail.com";
const SENDER_EMAIL = process.env.SENDER_EMAIL || "noreply@iga.com";
const SENDER_NAME = process.env.SENDER_NAME || "IGA Digital Solutions";

interface SendEmailParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  replyTo?: { email: string; name?: string };
}

async function sendEmail({ to, subject, htmlContent, replyTo }: SendEmailParams) {
  if (!BREVO_API_KEY) {
    console.warn(
      `BREVO_API_KEY not set — skipping email "${subject}" to ${to.map((t) => t.email).join(", ")}`,
    );
    return { skipped: true };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { email: SENDER_EMAIL, name: SENDER_NAME },
        to,
        ...(replyTo ? { replyTo } : {}),
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      console.error("Brevo email send failed:", response.status, data);
      return { success: false, error: data };
    }

    return { success: true };
  } catch (error) {
    console.error("Brevo email send error:", error);
    return { success: false, error };
  }
}

// ---- Workflow-specific notification senders ----

export async function notifyAdminNewProject(params: {
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  pricingPlan: string;
  totalAmount: number;
  projectId: string;
}) {
  return sendEmail({
    to: [{ email: ADMIN_EMAIL, name: "IGA Admin" }],
    subject: `New Project Submitted: ${params.projectTitle}`,
    htmlContent: `
      <h2>New Project Awaiting Approval</h2>
      <p><strong>Project:</strong> ${params.projectTitle}</p>
      <p><strong>Client:</strong> ${params.clientName} (${params.clientEmail})</p>
      <p><strong>Plan:</strong> ${params.pricingPlan} — ₹${params.totalAmount}</p>
      <p>Log in to the admin panel to review and approve or reject this project.</p>
      <p><em>Project ID: ${params.projectId}</em></p>
    `,
  });
}

export async function notifyClientProjectApproved(params: {
  clientEmail: string;
  clientName: string;
  projectTitle: string;
  advanceAmount: number;
}) {
  return sendEmail({
    to: [{ email: params.clientEmail, name: params.clientName }],
    subject: `Your project "${params.projectTitle}" has been approved!`,
    htmlContent: `
      <h2>Good news, ${params.clientName}!</h2>
      <p>Your project <strong>${params.projectTitle}</strong> has been approved.</p>
      <p>To get started, please complete the advance payment of <strong>₹${params.advanceAmount}</strong> (50%) from your client dashboard.</p>
      <p>Once payment is confirmed, we'll begin development right away.</p>
    `,
  });
}

export async function notifyClientProjectRejected(params: {
  clientEmail: string;
  clientName: string;
  projectTitle: string;
  reason: string;
}) {
  return sendEmail({
    to: [{ email: params.clientEmail, name: params.clientName }],
    subject: `Update on your project "${params.projectTitle}"`,
    htmlContent: `
      <h2>Hi ${params.clientName},</h2>
      <p>Unfortunately we're unable to proceed with <strong>${params.projectTitle}</strong> at this time.</p>
      <p><strong>Reason:</strong> ${params.reason}</p>
      <p>Feel free to reach out or submit a revised project request — we're happy to discuss further.</p>
    `,
  });
}

export async function notifyPaymentReceived(params: {
  clientEmail: string;
  clientName: string;
  projectTitle: string;
  amount: number;
  paymentType: "advance" | "final";
}) {
  const isAdvance = params.paymentType === "advance";
  await sendEmail({
    to: [{ email: params.clientEmail, name: params.clientName }],
    subject: `Payment received for "${params.projectTitle}"`,
    htmlContent: `
      <h2>Thank you, ${params.clientName}!</h2>
      <p>We've received your ${isAdvance ? "advance" : "final"} payment of <strong>₹${params.amount}</strong> for <strong>${params.projectTitle}</strong>.</p>
      <p>${isAdvance ? "Development will begin shortly — you can track progress from your dashboard." : "Your project is now fully paid. We'll be in touch shortly with final handover details."}</p>
    `,
  });

  return sendEmail({
    to: [{ email: ADMIN_EMAIL, name: "IGA Admin" }],
    subject: `${isAdvance ? "Advance" : "Final"} payment received: ${params.projectTitle}`,
    htmlContent: `
      <p><strong>${params.clientName}</strong> (${params.clientEmail}) just paid ₹${params.amount} (${params.paymentType}) for <strong>${params.projectTitle}</strong>.</p>
    `,
  });
}

export async function notifyMilestoneUpdate(params: {
  clientEmail: string;
  clientName: string;
  projectTitle: string;
  milestoneTitle: string;
  percentageComplete: number;
}) {
  return sendEmail({
    to: [{ email: params.clientEmail, name: params.clientName }],
    subject: `Progress update on "${params.projectTitle}"`,
    htmlContent: `
      <h2>Hi ${params.clientName},</h2>
      <p>Milestone <strong>${params.milestoneTitle}</strong> has been updated — your project is now <strong>${params.percentageComplete}%</strong> complete.</p>
      <p>Check your dashboard for full details and any preview links.</p>
    `,
  });
}

export async function notifyProjectDelivered(params: {
  clientEmail: string;
  clientName: string;
  projectTitle: string;
  productionUrl?: string;
}) {
  return sendEmail({
    to: [{ email: params.clientEmail, name: params.clientName }],
    subject: `🎉 "${params.projectTitle}" is live!`,
    htmlContent: `
      <h2>Congratulations, ${params.clientName}!</h2>
      <p>Your project <strong>${params.projectTitle}</strong> has been delivered and is now live.</p>
      ${params.productionUrl ? `<p><strong>Live URL:</strong> <a href="${params.productionUrl}">${params.productionUrl}</a></p>` : ""}
      <p>Login credentials and access details have been shared on your dashboard. Thank you for working with us!</p>
    `,
  });
}
