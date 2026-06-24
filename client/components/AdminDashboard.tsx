import { useState, useEffect } from "react";
import { LogOut, Search, Trash2, Edit2, Download, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ContactFormData } from "@shared/api";
import * as XLSX from "xlsx";
import AdminProjectsPanel from "./AdminProjectsPanel";

interface Inquiry extends ContactFormData {
  id: string;
  submittedAt: string;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

const adminAuthHeaders = (): Record<string, string> => {
  const token = sessionStorage.getItem("adminToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState<"projects" | "inquiries">("projects");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ContactFormData>>({});
  const { toast } = useToast();

  useEffect(() => {
    // Fetch inquiries from API
    const fetchInquiries = async () => {
      try {
        const response = await fetch("/api/admin/inquiries", {
          headers: adminAuthHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch inquiries");
        const data = await response.json();
        setInquiries(data.inquiries);
        setFilteredInquiries(data.inquiries);
      } catch (error) {
        console.error("Error fetching inquiries:", error);
        toast({
          title: "Error",
          description: "Failed to load inquiries",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInquiries();
  }, [toast]);

  useEffect(() => {
    const filtered = inquiries.filter(
      (inquiry) =>
        inquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inquiry.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inquiry.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inquiry.service.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredInquiries(filtered);
  }, [searchQuery, inquiries]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this inquiry?")) {
      try {
        const response = await fetch(`/api/admin/inquiries/${id}`, {
          method: "DELETE",
          headers: adminAuthHeaders(),
        });
        if (!response.ok) throw new Error("Failed to delete");
        const updated = inquiries.filter((inquiry) => inquiry.id !== id);
        setInquiries(updated);
        setFilteredInquiries(
          filteredInquiries.filter((inquiry) => inquiry.id !== id)
        );
        toast({
          title: "Deleted",
          description: "Inquiry has been deleted successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete inquiry.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEdit = (inquiry: Inquiry) => {
    setEditingId(inquiry.id);
    setEditData(inquiry);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...adminAuthHeaders() },
        body: JSON.stringify(editData),
      });
      if (!response.ok) throw new Error("Failed to update");
      const updated = inquiries.map((inquiry) =>
        inquiry.id === id ? { ...inquiry, ...editData } : inquiry
      );
      setInquiries(updated);
      setFilteredInquiries(
        filteredInquiries.map((inquiry) =>
          inquiry.id === id ? { ...inquiry, ...editData } : inquiry
        )
      );
      setEditingId(null);
      toast({
        title: "Updated",
        description: "Inquiry has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update inquiry.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    if (filteredInquiries.length === 0) {
      toast({
        title: "No data",
        description: "There are no inquiries to export.",
        variant: "destructive",
      });
      return;
    }

    const data = filteredInquiries.map((inquiry) => ({
      ID: inquiry.id,
      Name: inquiry.name,
      Email: inquiry.email,
      Phone: inquiry.phone,
      Company: inquiry.company,
      Service: inquiry.service,
      Message: inquiry.message,
      "Submitted At": new Date(inquiry.submittedAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inquiries");

    // Set column widths
    const colWidths = [
      { wch: 15 },
      { wch: 20 },
      { wch: 25 },
      { wch: 15 },
      { wch: 20 },
      { wch: 25 },
      { wch: 40 },
      { wch: 20 },
    ];
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(workbook, `IGA-Inquiries-${new Date().toISOString().split("T")[0]}.xlsx`);
    toast({
      title: "Exported",
      description: "Inquiries have been exported to Excel.",
    });
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken");
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab("projects")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "projects"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => setActiveTab("inquiries")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "inquiries"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            }`}
          >
            Contact Inquiries
          </button>
        </div>

        {activeTab === "projects" ? (
          <AdminProjectsPanel />
        ) : (
        <>
        {/* Search and Export Bar */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, company, or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-secondary transition-colors font-medium"
          >
            <Download className="w-5 h-5" />
            Export to Excel
          </button>
        </div>

        {/* Inquiries Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading inquiries...</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="bg-white rounded-lg border border-border p-12 text-center">
            <p className="text-muted-foreground text-lg">No inquiries found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                      Company
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                      Service
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                      Submitted
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInquiries.map((inquiry) => (
                    <tr key={inquiry.id} className="border-b border-border hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-foreground">
                        {editingId === inquiry.id ? (
                          <input
                            type="text"
                            value={editData.name || ""}
                            onChange={(e) =>
                              setEditData({ ...editData, name: e.target.value })
                            }
                            className="w-full px-2 py-1 border border-input rounded bg-white"
                          />
                        ) : (
                          inquiry.name
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {editingId === inquiry.id ? (
                          <input
                            type="email"
                            value={editData.email || ""}
                            onChange={(e) =>
                              setEditData({ ...editData, email: e.target.value })
                            }
                            className="w-full px-2 py-1 border border-input rounded bg-white"
                          />
                        ) : (
                          inquiry.email
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {editingId === inquiry.id ? (
                          <input
                            type="text"
                            value={editData.company || ""}
                            onChange={(e) =>
                              setEditData({ ...editData, company: e.target.value })
                            }
                            className="w-full px-2 py-1 border border-input rounded bg-white"
                          />
                        ) : (
                          inquiry.company
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {editingId === inquiry.id ? (
                          <select
                            value={editData.service || ""}
                            onChange={(e) =>
                              setEditData({ ...editData, service: e.target.value })
                            }
                            className="w-full px-2 py-1 border border-input rounded bg-white"
                          >
                            <option value="Website Development">Website Development</option>
                            <option value="E-commerce Solutions">E-commerce Solutions</option>
                            <option value="Mobile App Development">Mobile App Development</option>
                            <option value="Digital Marketing Services">Digital Marketing Services</option>
                            <option value="Custom Software Development">Custom Software Development</option>
                            <option value="Web Hosting & Maintenance">Web Hosting & Maintenance</option>
                            <option value="UI/UX Design">UI/UX Design</option>
                            <option value="Data Analyst Dashboard">Data Analyst Dashboard</option>
                            <option value="Business Intelligence Dashboards">Business Intelligence Dashboards</option>
                          </select>
                        ) : (
                          inquiry.service
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(inquiry.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {editingId === inquiry.id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(inquiry.id)}
                              className="text-green-600 hover:text-green-700 font-medium mr-4"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-gray-600 hover:text-gray-700 font-medium"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(inquiry)}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 mr-4"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(inquiry.id)}
                              className="inline-flex items-center gap-1 text-red-600 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-border text-sm text-muted-foreground">
              Showing {filteredInquiries.length} of {inquiries.length} inquiries
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
