import { RequestHandler } from "express";
import type { ClientRegistration, ClientLogin, AuthResponse } from "@shared/workflow";
import { getSupabaseClient } from "../lib/supabase";
import { hashPassword, verifyPassword, generateToken, verifyToken } from "../lib/auth";

export const register: RequestHandler = async (req, res) => {
  try {
    const { email, password, full_name, company_name, phone, whatsapp_number }: ClientRegistration = req.body;

    if (!email || !password || !full_name) {
      res.status(400).json({
        success: false,
        message: "Missing required fields",
      } as AuthResponse);
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      } as AuthResponse);
      return;
    }

    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      res.status(500).json({
        success: false,
        message: "Database connection failed",
      } as AuthResponse);
      return;
    }

    const { data: existingClient } = await supabaseClient
      .from("clients")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingClient) {
      res.status(400).json({
        success: false,
        message: "Email already registered",
      } as AuthResponse);
      return;
    }

    const password_hash = await hashPassword(password);

    const { data, error } = await supabaseClient
      .from("clients")
      .insert({
        email,
        password_hash,
        full_name,
        company_name,
        phone,
        whatsapp_number,
        notification_preference: whatsapp_number ? "both" : "email",
      })
      .select()
      .single();

    if (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create account",
      } as AuthResponse);
      return;
    }

    const token = generateToken(String(data.id));

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      client: {
        ...data,
        password_hash: undefined,
      },
    } as AuthResponse);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    } as AuthResponse);
  }
};

export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password }: ClientLogin = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      } as AuthResponse);
      return;
    }

    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      res.status(500).json({
        success: false,
        message: "Database connection failed",
      } as AuthResponse);
      return;
    }

    const { data: client, error } = await supabaseClient
      .from("clients")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    // Same error message whether the email doesn't exist or the password is
    // wrong, so we don't leak which emails are registered.
    if (error || !client) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      } as AuthResponse);
      return;
    }

    const passwordOk = await verifyPassword(password, client.password_hash);
    if (!passwordOk) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      } as AuthResponse);
      return;
    }

    const token = generateToken(String(client.id));

    res.json({
      success: true,
      message: "Login successful",
      token,
      client: {
        ...client,
        password_hash: undefined,
      },
    } as AuthResponse);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    } as AuthResponse);
  }
};

export const getProfile: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }
    const { clientId } = decoded;

    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      res.status(500).json({ error: "Database connection failed" });
      return;
    }

    const { data: client, error: clientError } = await supabaseClient
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    const { data: projects, error: projectError } = await supabaseClient
      .from("projects")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (projectError) {
      console.error("Project fetch error:", projectError);
    }

    res.json({
      client: {
        ...client,
        password_hash: undefined,
      },
      projects: projects || [],
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};
