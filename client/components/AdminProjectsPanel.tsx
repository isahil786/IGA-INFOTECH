import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Project, ProjectStatus } from "@shared/workflow";

type ProjectWithClient = Project & {
  clients?: { full_name: string; email: string; phone?: string; whatsapp_number?: string };
};

const adminAuthHeaders = (): Record<string, string> => {
  const token = sessionStorage.getItem("adminToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const STATUS_FILTERS: { label: string; value: ProjectStatus | "all" }[] = [
  { label: "Pending Approval", value: "Pending Approval" },
  { label: "All", value: "all" },
];

const statusColor: Record<string, string> = {
  "Pending Approval": "bg-yellow-100 text-yellow-800",
  "Awaiting Advance": "bg-blue-100 text-blue-800",
  "In Development": "bg-purple-100 text-purple-800",
  "Awaiting Final Payment": "bg-orange-100 text-orange-800",
  Completed: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

const AdminProjectsPanel = () => {
  const [projects, setProjects] = useState<ProjectWithClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ProjectStatus | "all">("Pending Approval");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const { toast } = useToast();

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const qs = filter === "all" ? "" : `?status=${encodeURIComponent(filter)}`;
      const response = await fetch(`/api/admin/projects${qs}`, {
        headers: adminAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch projects");
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load projects", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleApprove = async (id: string) => {
    setActioningId(id);
    try {
      const response = await fetch(`/api/admin/projects/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminAuthHeaders() },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Failed to approve");
      toast({ title: "Approved", description: "Project moved to Awaiting Advance." });
      fetchProjects();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      toast({ title: "Reason required", description: "Please provide a rejection reason.", variant: "destructive" });
      return;
    }
    setActioningId(id);
    try {
      const response = await fetch(`/api/admin/projects/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminAuthHeaders() },
        body: JSON.stringify({ rejection_reason: rejectReason }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Failed to reject");
      toast({ title: "Rejected", description: "Project has been rejected." });
      setRejectingId(null);
      setRejectReason("");
      fetchProjects();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.value ? "bg-primary text-primary-foreground" : "bg-white border border-input"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No projects found.</div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project.id} className="bg-white border border-border rounded-lg p-6">
              <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{project.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {project.clients?.full_name} · {project.clients?.email}
                    {project.clients?.phone ? ` · ${project.clients.phone}` : ""}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                    statusColor[project.status] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  {project.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                <div>
                  <p className="text-muted-foreground">Service</p>
                  <p className="font-medium">{project.service_category}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Plan</p>
                  <p className="font-medium">{project.pricing_plan}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-medium">₹{project.total_amount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Advance (50%)</p>
                  <p className="font-medium">₹{project.advance_amount}</p>
                </div>
              </div>

              {project.description && (
                <p className="text-sm text-foreground/80 mb-4">{project.description}</p>
              )}

              {project.status === "Pending Approval" && (
                <div className="flex flex-wrap gap-2 items-start">
                  <button
                    onClick={() => handleApprove(String(project.id))}
                    disabled={actioningId === String(project.id)}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>

                  {rejectingId === String(project.id) ? (
                    <div className="flex gap-2 flex-1 min-w-[280px]">
                      <input
                        type="text"
                        placeholder="Reason for rejection..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="flex-1 px-3 py-2 border border-input rounded-lg text-sm"
                      />
                      <button
                        onClick={() => handleReject(String(project.id))}
                        disabled={actioningId === String(project.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason("");
                        }}
                        className="px-4 py-2 border border-input rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRejectingId(String(project.id))}
                      className="flex items-center gap-2 bg-white border border-red-300 text-red-700 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  )}
                </div>
              )}

              {project.status === "Rejected" && project.rejection_reason && (
                <p className="text-sm text-red-700 bg-red-50 p-2 rounded">
                  Rejection reason: {project.rejection_reason}
                </p>
              )}

              {["In Development", "Awaiting Final Payment", "Completed"].includes(project.status) && (
                <ProjectManagementControls
                  project={project}
                  onUpdated={fetchProjects}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminProjectsPanel;

// Admin controls shown once a project is paid/in-progress: add milestones,
// set a preview link, and (once fully paid) mark final delivery/handover.
function ProjectManagementControls({
  project,
  onUpdated,
}: {
  project: ProjectWithClient;
  onUpdated: () => void;
}) {
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestonePercent, setMilestonePercent] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(project.preview_url || "");
  const [productionUrl, setProductionUrl] = useState(project.production_url || "");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const addMilestone = async () => {
    if (!milestoneTitle.trim()) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminAuthHeaders() },
        body: JSON.stringify({ title: milestoneTitle, percentage_complete: milestonePercent }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Failed to add milestone");
      toast({ title: "Milestone added", description: "Client has been notified by email." });
      setMilestoneTitle("");
      setMilestonePercent(0);
      onUpdated();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const savePreviewUrl = async () => {
    if (!previewUrl.trim()) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/preview-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminAuthHeaders() },
        body: JSON.stringify({ preview_url: previewUrl }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Failed to set preview URL");
      toast({ title: "Preview link saved" });
      onUpdated();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const deliverProject = async () => {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminAuthHeaders() },
        body: JSON.stringify({ production_url: productionUrl }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Failed to mark delivered");
      toast({ title: "Project delivered!", description: "Client has been notified that their project is live." });
      onUpdated();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-4">
      {/* Preview link */}
      <div className="flex gap-2 items-end flex-wrap">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs text-muted-foreground">Preview URL</label>
          <input
            type="url"
            value={previewUrl}
            onChange={(e) => setPreviewUrl(e.target.value)}
            placeholder="https://preview.example.com"
            className="w-full px-3 py-2 border border-input rounded-lg text-sm mt-1"
          />
        </div>
        <button
          onClick={savePreviewUrl}
          disabled={busy}
          className="px-4 py-2 border border-primary text-primary rounded-lg text-sm hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
        >
          Save Preview Link
        </button>
      </div>

      {/* Add milestone */}
      <div className="flex gap-2 items-end flex-wrap">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs text-muted-foreground">Milestone Title</label>
          <input
            type="text"
            value={milestoneTitle}
            onChange={(e) => setMilestoneTitle(e.target.value)}
            placeholder="e.g. Homepage design complete"
            className="w-full px-3 py-2 border border-input rounded-lg text-sm mt-1"
          />
        </div>
        <div className="w-28">
          <label className="text-xs text-muted-foreground">% Complete</label>
          <input
            type="number"
            min={0}
            max={100}
            value={milestonePercent}
            onChange={(e) => setMilestonePercent(Number(e.target.value))}
            className="w-full px-3 py-2 border border-input rounded-lg text-sm mt-1"
          />
        </div>
        <button
          onClick={addMilestone}
          disabled={busy}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-secondary transition-colors disabled:opacity-50"
        >
          Add Milestone
        </button>
      </div>

      {/* Final delivery */}
      {project.status === "Completed" && (
        <div className="flex gap-2 items-end flex-wrap bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs text-muted-foreground">Production / Live URL</label>
            <input
              type="url"
              value={productionUrl}
              onChange={(e) => setProductionUrl(e.target.value)}
              placeholder="https://clientsite.com"
              className="w-full px-3 py-2 border border-input rounded-lg text-sm mt-1"
            />
          </div>
          <button
            onClick={deliverProject}
            disabled={busy}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Mark Delivered & Notify Client
          </button>
        </div>
      )}
    </div>
  );
}
