import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, Circle, Eye, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Project, ProjectDetails, ProjectMilestone, Payment } from "@shared/workflow";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [details, setDetails] = useState<ProjectDetails | null>(null);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  const token = localStorage.getItem("client_token");

  useEffect(() => {
    if (!token) {
      navigate("/client/login");
      return;
    }
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to load project");
      const data = await response.json();
      setProject(data.project);
      setDetails(data.details);
      setMilestones(data.milestones || []);
      setPayments(data.payments || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load project", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async (paymentType: "advance" | "final") => {
    if (!project) return;
    setIsPaying(true);
    try {
      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ project_id: project.id, payment_type: paymentType }),
      });

      const orderData = await orderResponse.json();
      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.message || "Failed to start payment");
      }

      const razorpay = new window.Razorpay({
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.order_id,
        name: "IGA Digital Solutions",
        description: `${paymentType === "advance" ? "Advance" : "Final"} payment for ${project.title}`,
        handler: async (response: any) => {
          try {
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyResponse.json();
            if (verifyData.success) {
              toast({ title: "Payment successful", description: "Thank you! Your payment has been confirmed." });
              fetchProject();
            } else {
              toast({ title: "Verification failed", description: verifyData.message, variant: "destructive" });
            }
          } catch {
            toast({ title: "Error", description: "Payment verification failed. Contact support if money was deducted.", variant: "destructive" });
          }
        },
        theme: { color: "#0f172a" },
      });

      razorpay.open();
    } catch (error: any) {
      toast({ title: "Payment error", description: error.message || "Could not start payment", variant: "destructive" });
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Project not found.</p>
      </div>
    );
  }

  const totalPaid = project.advance_paid + project.final_paid;
  const overallProgress = Math.round((totalPaid / project.total_amount) * 100);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link to="/client/dashboard" className="inline-flex items-center gap-2 text-primary mb-6 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-border mb-6">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">{project.title}</h1>
              <p className="text-muted-foreground">{project.service_category} • {project.pricing_plan} Plan</p>
            </div>
            <span className="px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary">
              {project.status}
            </span>
          </div>

          {project.description && (
            <p className="text-foreground mb-6">{project.description}</p>
          )}

          {/* Payment summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-xl font-bold">₹{project.total_amount.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Paid So Far</p>
              <p className="text-xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-xl font-bold">₹{(project.total_amount - totalPaid).toLocaleString()}</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <p className="text-sm font-medium">Payment Progress</p>
              <p className="text-sm text-muted-foreground">{overallProgress}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${overallProgress}%` }} />
            </div>
          </div>

          {/* Payment action buttons */}
          {project.status === "Awaiting Advance" && (
            <button
              onClick={() => handlePayment("advance")}
              disabled={isPaying}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold hover:bg-secondary transition-colors inline-flex items-center gap-2 disabled:opacity-50"
            >
              <CreditCard className="w-5 h-5" />
              {isPaying ? "Processing..." : `Pay Advance (₹${(project.advance_amount - project.advance_paid).toLocaleString()})`}
            </button>
          )}
          {project.status === "Awaiting Final Payment" && (
            <button
              onClick={() => handlePayment("final")}
              disabled={isPaying}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold hover:bg-secondary transition-colors inline-flex items-center gap-2 disabled:opacity-50"
            >
              <CreditCard className="w-5 h-5" />
              {isPaying ? "Processing..." : `Pay Final Amount (₹${(project.final_amount - project.final_paid).toLocaleString()})`}
            </button>
          )}
          {project.status === "Pending Approval" && (
            <p className="text-muted-foreground italic">Your project is awaiting admin approval. We'll notify you once it's reviewed.</p>
          )}
          {project.status === "Rejected" && project.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              <strong>Reason:</strong> {project.rejection_reason}
            </div>
          )}

          {project.preview_url && (
            <a
              href={project.preview_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-3 inline-flex items-center gap-2 px-6 py-3 border border-primary text-primary rounded-lg font-bold hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Eye className="w-5 h-5" /> View Preview
            </a>
          )}

          {project.status === "Completed" && project.production_url && (
            <a
              href={project.production_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-3 inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors"
            >
              🎉 View Live Site
            </a>
          )}
        </div>

        {/* Milestones / Progress Tracking */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-border mb-6">
          <h2 className="text-xl font-bold mb-4">Progress & Milestones</h2>
          {milestones.length === 0 ? (
            <p className="text-muted-foreground">No milestones have been added yet. Check back soon!</p>
          ) : (
            <div className="space-y-4">
              {milestones.map((m) => (
                <div key={m.id} className="flex items-start gap-3">
                  {m.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">{m.title}</p>
                      <span className="text-sm text-muted-foreground">{m.percentage_complete}%</span>
                    </div>
                    {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment History */}
        {payments.length > 0 && (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-border">
            <h2 className="text-xl font-bold mb-4">Payment History</h2>
            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p.id} className="flex justify-between items-center border-b border-border pb-3 last:border-0">
                  <div>
                    <p className="font-medium capitalize">{p.payment_type} Payment</p>
                    <p className="text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{Number(p.amount).toLocaleString()}</p>
                    <p className={`text-sm ${p.status === "success" ? "text-green-600" : p.status === "failed" ? "text-red-600" : "text-yellow-600"}`}>
                      {p.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
