# IGA Infotech Project Workflow Implementation Plan

## Overview
Building a complete project management & payment workflow with client portal, admin dashboard, and payment integration.

## Tech Stack
- **Frontend**: React + TypeScript + Tailwind
- **Backend**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Payment**: Razorpay
- **Email**: Brevo (existing)
- **WhatsApp**: Brevo WhatsApp API
- **Preview Hosting**: Vercel API

## Requirements Gathered
- **Pricing Plans**: Basic, Standard, Premium
- **Project Types**: Predefined services + custom details
- **Notifications**: Email + WhatsApp (both client & admin)
- **Preview Hosting**: Vercel
- **Admin Notifications**: Email + WhatsApp

---

## Phase 1: Client Authentication & Portal (Week 1)

### 1.1 Database Schema
Create Supabase tables:
- `clients` - client registration
- `projects` - project details
- `project_status_history` - tracking changes
- `payments` - payment records

### 1.2 Client Auth System
- Registration page
- Login page
- Email verification
- Password reset flow

### 1.3 Client Dashboard
- View projects
- Project details
- Profile management
- Payment history

### 1.4 Routes
- `/client/register`
- `/client/login`
- `/client/dashboard`
- `/client/profile`

---

## Phase 2: Project Management (Week 2)

### 2.1 Pricing Plans Page
- Display 3 pricing tiers
- Feature comparison
- "Select Plan" button

### 2.2 Project Creation Form
- Service category dropdown
- Custom details (technology stack, timeline, budget, etc.)
- File uploads (references, documents)
- Submit to create project with "Pending Approval" status

### 2.3 Admin Approval System
- Upgrade admin dashboard
- View pending projects
- Approve/Reject with notes
- Send automated notification when approved

### 2.4 Routes
- `/client/projects/new`
- `/admin/projects`
- `/admin/projects/:id`

---

## Phase 3: Payment System (Week 3)

### 3.1 Razorpay Integration
- Server-side Razorpay setup
- Payment order creation
- Client-side payment modal
- Webhook for payment verification

### 3.2 Payment Flow
- Generate 50% advance payment order
- Client pays via Razorpay
- Webhook confirms payment
- Update project status to "In Development"
- Send email + WhatsApp to client

### 3.3 Routes
- `POST /api/payments/create-order`
- `POST /api/payments/verify-webhook`
- `GET /api/payments/status/:projectId`

---

## Phase 4: Progress Tracking (Week 4)

### 4.1 Admin Progress Management
- Add milestones/progress updates
- Generate preview link
- Update project status

### 4.2 Client Dashboard Enhancement
- Progress bar visualization
- Milestone checklist
- Preview link (when available)
- Status history

### 4.3 Preview Link Generation
- Generate Vercel preview
- Store preview URL in database
- Provide link to client

---

## Phase 5: Final Delivery (Week 5)

### 5.1 Final Payment
- Generate final 50% payment order
- Client reviews preview
- Client approves and pays balance
- Webhook triggers final payment processing

### 5.2 Credentials Handover
- Generate admin credentials
- Host access details
- Domain access
- Send via secure email/portal

### 5.3 Live Launch
- Deploy to production
- Update status to "Completed"
- Archive project
- Collect feedback

---

## Database Schema Details

### clients table
```sql
id BIGINT PRIMARY KEY
email TEXT UNIQUE NOT NULL
password_hash TEXT NOT NULL
phone TEXT
full_name TEXT
company_name TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### projects table
```sql
id BIGINT PRIMARY KEY
client_id BIGINT FK (clients)
title TEXT NOT NULL
service_category TEXT NOT NULL
description TEXT
pricing_plan TEXT (Basic/Standard/Premium)
total_amount DECIMAL
advance_paid DECIMAL DEFAULT 0
final_paid DECIMAL DEFAULT 0
status TEXT (Pending Approval/Awaiting Advance/In Development/Awaiting Final Payment/Completed)
preview_url TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### payments table
```sql
id BIGINT PRIMARY KEY
project_id BIGINT FK (projects)
razorpay_order_id TEXT
razorpay_payment_id TEXT
amount DECIMAL
payment_type TEXT (advance/final)
status TEXT (pending/success/failed)
created_at TIMESTAMP
updated_at TIMESTAMP
```

---

## Implementation Order
1. Create Supabase tables
2. Build client auth system
3. Add pricing & project creation
4. Integrate Razorpay
5. Build progress tracking
6. Final payment & delivery

---

## Next Steps
Start with Phase 1: Creating database schema and client authentication system.
