// Client-related types
export interface Client {
  id: string;
  email: string;
  full_name: string;
  company_name?: string;
  phone?: string;
  country: string;
  timezone: string;
  notification_preference: 'email' | 'whatsapp' | 'both';
  whatsapp_number?: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientRegistration {
  email: string;
  password: string;
  full_name: string;
  company_name?: string;
  phone?: string;
  whatsapp_number?: string;
  notification_preference?: 'email' | 'whatsapp' | 'both';
}

export interface ClientLogin {
  email: string;
  password: string;
}

// Project-related types
export type ProjectStatus = 
  | 'Pending Approval'
  | 'Awaiting Advance'
  | 'In Development'
  | 'Awaiting Final Payment'
  | 'Completed'
  | 'Rejected';

export type PricingPlan = 'Basic' | 'Standard' | 'Premium';

export interface Project {
  id: string;
  client_id: string;
  title: string;
  service_category: string;
  description?: string;
  pricing_plan: PricingPlan;
  total_amount: number;
  advance_amount: number;
  final_amount: number;
  advance_paid: number;
  final_paid: number;
  status: ProjectStatus;
  rejection_reason?: string;
  preview_url?: string;
  production_url?: string;
  admin_notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectDetails {
  id?: string;
  project_id: string;
  technology_stack?: string[];
  timeline_days?: number;
  budget_range?: string;
  reference_links?: string[];
  additional_requirements?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectCreateRequest {
  title: string;
  service_category: string;
  pricing_plan: PricingPlan;
  description?: string;
  technology_stack?: string[];
  timeline_days?: number;
  budget_range?: string;
  reference_links?: string[];
  additional_requirements?: string;
}

// Payment-related types
export type PaymentType = 'advance' | 'final';
export type PaymentStatus = 'pending' | 'success' | 'failed';

export interface Payment {
  id: string;
  project_id: string;
  client_id: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  amount: number;
  payment_type: PaymentType;
  status: PaymentStatus;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface RazorpayOrderRequest {
  project_id: string;
  payment_type: PaymentType;
  amount: number;
}

export interface RazorpayWebhookPayload {
  event: string;
  payload: {
    payment: {
      entity: {
        id: string;
        order_id: string;
        status: string;
        amount: number;
      };
    };
  };
}

// Milestone/Progress types
export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  percentage_complete: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

// Status history
export interface ProjectStatusHistory {
  id: string;
  project_id: string;
  old_status?: string;
  new_status: string;
  changed_by?: string;
  notes?: string;
  created_at: string;
}

// Pricing plan details
export interface PricingPlanDetail {
  name: PricingPlan;
  price: number;
  description: string;
  features: string[];
  advance_percentage: number; // 50 for 50% advance
}

export const PRICING_PLANS: Record<PricingPlan, PricingPlanDetail> = {
  Basic: {
    name: 'Basic',
    price: 2999,
    description: 'Perfect for small businesses and startups',
    features: [
      'Responsive website design',
      '5 web pages',
      'Mobile optimized',
      'Basic SEO setup',
      '1 month support included',
    ],
    advance_percentage: 50,
  },
  Standard: {
    name: 'Standard',
    price: 7999,
    description: 'Ideal for growing businesses',
    features: [
      'Everything in Basic',
      'E-commerce integration',
      'Up to 15 pages',
      'Advanced SEO optimization',
      '3 months support included',
      'Performance optimization',
    ],
    advance_percentage: 50,
  },
  Premium: {
    name: 'Premium',
    price: 15999,
    description: 'For enterprises and large-scale projects',
    features: [
      'Everything in Standard',
      'Custom web application',
      'Unlimited pages',
      'Digital marketing campaign',
      '6 months support included',
      'Analytics and reporting',
      'Custom integrations',
    ],
    advance_percentage: 50,
  },
};

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  client?: Client;
}
