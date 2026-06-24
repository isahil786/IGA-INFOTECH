import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Plus, FileText, Clock, CheckCircle, AlertCircle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Client, Project } from "@shared/workflow";

const ClientDashboard = () => {
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("client_token");
    if (!token) {
      navigate("/client/login");
      return;
    }

    fetchClientData(token);
  }, [navigate]);

  const fetchClientData = async (token: string) => {
    try {
      const response = await fetch("/api/client/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setClient(data.client);
      setProjects(data.projects || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
      localStorage.removeItem("client_token");
      navigate("/client/login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("client_token");
    localStorage.removeItem("client_id");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/client/login");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending Approval":
        return "bg-yellow-100 text-yellow-800 border border-yellow-300";
      case "Awaiting Advance":
        return "bg-blue-100 text-blue-800 border border-blue-300";
      case "In Development":
        return "bg-purple-100 text-purple-800 border border-purple-300";
      case "Awaiting Final Payment":
        return "bg-orange-100 text-orange-800 border border-orange-300";
      case "Completed":
        return "bg-green-100 text-green-800 border border-green-300";
      case "Rejected":
        return "bg-red-100 text-red-800 border border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending Approval":
        return <Clock className="w-4 h-4" />;
      case "Completed":
        return <CheckCircle className="w-4 h-4" />;
      case "Rejected":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                {client?.full_name.charAt(0) || "C"}
              </div>
              <div>
                <h1 className="font-bold text-foreground">Welcome, {client?.full_name}!</h1>
                <p className="text-sm text-muted-foreground">{client?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-destructive hover:bg-destructive hover:text-white rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
            <p className="text-muted-foreground text-sm mb-2">Total Projects</p>
            <p className="text-3xl font-bold text-foreground">{projects.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
            <p className="text-muted-foreground text-sm mb-2">Active</p>
            <p className="text-3xl font-bold text-primary">
              {projects.filter(p => !["Completed", "Rejected"].includes(p.status)).length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
            <p className="text-muted-foreground text-sm mb-2">Completed</p>
            <p className="text-3xl font-bold text-green-600">
              {projects.filter(p => p.status === "Completed").length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
            <p className="text-muted-foreground text-sm mb-2">Total Spent</p>
            <p className="text-3xl font-bold text-foreground">
              ₹{projects.reduce((sum, p) => sum + (p.advance_paid + p.final_paid), 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* New Project Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/client/projects/new")}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold hover:bg-secondary transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Start New Project
          </button>
        </div>

        {/* Projects Section */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Your Projects</h2>

          {projects.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-border">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-foreground mb-2">No Projects Yet</h3>
              <p className="text-muted-foreground mb-6">
                Get started by creating your first project. We'll guide you through the process.
              </p>
              <button
                onClick={() => navigate("/client/projects/new")}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:bg-secondary transition-colors"
              >
                Create First Project
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {project.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(project.status)}`}>
                          {getStatusIcon(project.status)}
                          {project.status}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {project.service_category}
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          {project.pricing_plan} Plan
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        ₹{project.total_amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Paid: ₹{(project.advance_paid + project.final_paid).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-foreground">Payment Progress</p>
                      <p className="text-sm text-muted-foreground">
                        {Math.round(((project.advance_paid + project.final_paid) / project.total_amount) * 100)}%
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${((project.advance_paid + project.final_paid) / project.total_amount) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/client/projects/${project.id}`)}
                      className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-medium"
                    >
                      View Details
                    </button>
                    {project.preview_url && (
                      <a
                        href={project.preview_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
