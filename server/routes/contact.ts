import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import { ContactFormData, ContactResponse } from "@shared/api";

// Lazy-load Supabase client
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      supabase = createClient(supabaseUrl, supabaseKey);
    }
  }
  return supabase;
}

// In-memory storage for fallback
let contactInquiries: (ContactFormData & { id: string; submittedAt: string })[] = [];

const brevoApiKey = process.env.BREVO_API_KEY || "";
const adminEmail = process.env.ADMIN_EMAIL || "iga.infotech@gmail.com";

// Send email via Brevo
async function sendEmailViaBrevo(contactData: ContactFormData) {
  try {
    const emailContent = `
New Contact Inquiry from IGA Website

Name: ${contactData.name}
Email: ${contactData.email}
Phone: ${contactData.phone}
Company: ${contactData.company}
Service Required: ${contactData.service}

Message:
${contactData.message}

---
This is an automated message from your IGA website contact form.
`;

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        sender: { email: "noreply@iga.com", name: "IGA Website" },
        to: [{ email: adminEmail, name: "IGA Admin" }],
        replyTo: { email: contactData.email, name: contactData.name },
        subject: `New Contact Inquiry from ${contactData.name}`,
        htmlContent: `
          <h2>New Contact Inquiry</h2>
          <p><strong>Name:</strong> ${contactData.name}</p>
          <p><strong>Email:</strong> ${contactData.email}</p>
          <p><strong>Phone:</strong> ${contactData.phone}</p>
          <p><strong>Company:</strong> ${contactData.company}</p>
          <p><strong>Service Required:</strong> ${contactData.service}</p>
          <p><strong>Message:</strong></p>
          <p>${contactData.message.replace(/\n/g, "<br>")}</p>
        `,
        textContent: emailContent,
      }),
    });

    if (!response.ok) {
      throw new Error(`Brevo API error: ${response.statusText}`);
    }

    console.log("Email sent successfully via Brevo");
    return true;
  } catch (error) {
    console.error("Error sending email via Brevo:", error);
    return false;
  }
}

export const handleContact: RequestHandler = async (req, res) => {
  try {
    const data: ContactFormData = req.body;

    // Validate required fields
    if (!data.name || !data.email || !data.phone || !data.company || !data.service || !data.message) {
      res.status(400).json({
        success: false,
        message: "Missing required fields",
      } as ContactResponse);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      res.status(400).json({
        success: false,
        message: "Invalid email format",
      } as ContactResponse);
      return;
    }

    // Try to save to Supabase
    const supabaseClient = getSupabaseClient();
    if (supabaseClient) {
      const { error } = await supabaseClient.from("contacts").insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        service: data.service,
        message: data.message,
      });

      if (error) {
        console.error("Supabase insert error:", error);
        // Fall back to in-memory storage
      }
    }

    // Create inquiry object with timestamp and ID
    const inquiry = {
      ...data,
      id: Date.now().toString(),
      submittedAt: new Date().toISOString(),
    };

    // Store in memory as fallback
    contactInquiries.push(inquiry);

    // Send email notification
    if (brevoApiKey) {
      await sendEmailViaBrevo(data);
    } else {
      console.warn("Brevo API key not configured, email notification skipped");
    }

    // Log to console for development
    console.log("New contact inquiry:", inquiry);

    // Send success response
    res.status(200).json({
      success: true,
      message: "Inquiry submitted successfully",
    } as ContactResponse);
  } catch (error) {
    console.error("Error processing contact form:", error);
    res.status(500).json({
      success: false,
      message: "Error processing request",
    } as ContactResponse);
  }
};

// Get all inquiries (for admin use)
export const getInquiries = async () => {
  // Try to fetch from Supabase first
  const supabaseClient = getSupabaseClient();
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data.map((item: any) => ({
          ...item,
          id: item.id.toString(),
          submittedAt: item.submitted_at || item.created_at,
        }));
      }
    } catch (error) {
      console.error("Error fetching from Supabase:", error);
    }
  }

  // Fall back to in-memory storage
  return contactInquiries;
};

// Delete inquiry by ID
export const deleteInquiry = async (id: string) => {
  // Try to delete from Supabase
  const supabaseClient = getSupabaseClient();
  if (supabaseClient) {
    try {
      const numericId = parseInt(id);
      const { error } = await supabaseClient.from("contacts").delete().eq("id", numericId);
      if (!error) {
        return;
      }
    } catch (error) {
      console.error("Error deleting from Supabase:", error);
    }
  }

  // Fall back to in-memory storage
  contactInquiries = contactInquiries.filter((inquiry) => inquiry.id !== id);
};

// Update inquiry by ID
export const updateInquiry = async (id: string, updates: Partial<ContactFormData>) => {
  // Try to update Supabase
  const supabaseClient = getSupabaseClient();
  if (supabaseClient) {
    try {
      const numericId = parseInt(id);
      const { error } = await supabaseClient.from("contacts").update(updates).eq("id", numericId);
      if (!error) {
        return;
      }
    } catch (error) {
      console.error("Error updating Supabase:", error);
    }
  }

  // Fall back to in-memory storage
  const inquiryIndex = contactInquiries.findIndex((inquiry) => inquiry.id === id);
  if (inquiryIndex >= 0) {
    contactInquiries[inquiryIndex] = {
      ...contactInquiries[inquiryIndex],
      ...updates,
    };
  }
};
