import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PRICING_PLANS } from "@shared/workflow";

const projectSchema = z.object({
  title: z.string().min(5, "Project title must be at least 5 characters"),
  service_category: z.string().min(1, "Please select a service category"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  technology_stack: z.array(z.string()).optional(),
  timeline_days: z.coerce.number().optional(),
  budget_range: z.string().optional(),
  reference_links: z.array(z.string().url()).optional().default([]),
  additional_requirements: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

const SERVICE_CATEGORIES = [
  "Website Development",
  "E-commerce Solutions",
  "Mobile App Development",
  "Digital Marketing Services",
  "Custom Software Development",
  "Web Hosting & Maintenance",
  "UI/UX Design",
  "Data Analytics Dashboards",
  "AI-Powered Solutions",
];

const TECH_STACKS = [
  "React",
  "Vue.js",
  "Angular",
  "Node.js",
  "Python",
  "Django",
  "Flask",
  "PHP",
  "Laravel",
  "WordPress",
  "Shopify",
  "PostgreSQL",
  "MongoDB",
  "MySQL",
  "AWS",
  "Google Cloud",
  "Azure",
];

const CreateProject = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [techStack, setTechStack] = useState<string[]>([]);
  const [refLinks, setRefLinks] = useState<string[]>([""]); // Start with one empty field
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Get selected plan from sessionStorage
    const plan = sessionStorage.getItem("selectedPricingPlan");
    if (!plan) {
      navigate("/pricing");
      return;
    }
    setSelectedPlan(plan);
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("client_token");
      if (!token) {
        navigate("/client/login");
        return;
      }

      if (!selectedPlan) {
        throw new Error("Please select a pricing plan");
      }

      const planDetails = PRICING_PLANS[selectedPlan as keyof typeof PRICING_PLANS];

      const projectData = {
        title: data.title,
        service_category: data.service_category,
        pricing_plan: selectedPlan,
        description: data.description,
        technology_stack: techStack,
        timeline_days: data.timeline_days,
        budget_range: data.budget_range,
        reference_links: refLinks.filter((link) => link.trim()),
        additional_requirements: data.additional_requirements,
      };

      const response = await fetch("/api/projects/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create project");
      }

      const result = await response.json();

      toast({
        title: "Success!",
        description: "Project created successfully. Our team will review it shortly.",
      });

      sessionStorage.removeItem("selectedPricingPlan");
      navigate(`/client/projects/${result.project.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  const planDetails = PRICING_PLANS[selectedPlan as keyof typeof PRICING_PLANS];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => navigate("/pricing")}
          className="flex items-center gap-2 text-primary hover:text-secondary mb-8 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Pricing
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl p-8 border border-border mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Create Your Project
          </h1>
          <p className="text-muted-foreground mb-6">
            Tell us about your project details and requirements
          </p>

          {/* Plan Summary */}
          <div className="bg-primary bg-opacity-5 border border-primary border-opacity-20 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Selected Plan</p>
                <p className="text-2xl font-bold text-foreground">{planDetails.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Cost</p>
                <p className="text-2xl font-bold text-primary">₹{planDetails.price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Payment Terms</p>
                <p className="text-2xl font-bold text-secondary">
                  50% Now, 50% Later
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl p-8 border border-border space-y-6">
          {/* Project Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Project Title *
            </label>
            <input
              type="text"
              placeholder="e.g., E-commerce Platform for Fashion Brand"
              {...register("title")}
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            />
            {errors.title && (
              <p className="text-destructive text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Service Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Service Category *
            </label>
            <select
              {...register("service_category")}
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="">Select a service category</option>
              {SERVICE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.service_category && (
              <p className="text-destructive text-sm mt-1">{errors.service_category.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Project Description *
            </label>
            <textarea
              placeholder="Tell us more about your project, goals, and any specific requirements..."
              rows={5}
              {...register("description")}
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white resize-none"
            />
            {errors.description && (
              <p className="text-destructive text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Technology Stack */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Technology Stack (select as many as needed)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {TECH_STACKS.map((tech) => (
                <label key={tech} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={techStack.includes(tech)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTechStack([...techStack, tech]);
                      } else {
                        setTechStack(techStack.filter((t) => t !== tech));
                      }
                    }}
                    className="rounded border-input"
                  />
                  <span className="text-sm text-foreground">{tech}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Expected Timeline (days)
            </label>
            <input
              type="number"
              placeholder="e.g., 60"
              {...register("timeline_days")}
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            />
          </div>

          {/* Budget Range */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Budget Range
            </label>
            <select
              {...register("budget_range")}
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="">Select budget range</option>
              <option value="0-50000">₹0 - ₹50,000</option>
              <option value="50000-100000">₹50,000 - ₹100,000</option>
              <option value="100000-500000">₹100,000 - ₹500,000</option>
              <option value="500000+">₹500,000+</option>
            </select>
          </div>

          {/* Reference Links */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Reference Links (similar projects, references)
            </label>
            <div className="space-y-2">
              {refLinks.map((link, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={link}
                    onChange={(e) => {
                      const newLinks = [...refLinks];
                      newLinks[idx] = e.target.value;
                      setRefLinks(newLinks);
                    }}
                    className="flex-1 px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  />
                  {refLinks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setRefLinks(refLinks.filter((_, i) => i !== idx));
                      }}
                      className="px-3 py-3 text-destructive hover:bg-destructive hover:text-white rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setRefLinks([...refLinks, ""])}
                className="flex items-center gap-2 text-primary hover:text-secondary font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Another Link
              </button>
            </div>
          </div>

          {/* Additional Requirements */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Additional Requirements
            </label>
            <textarea
              placeholder="Any other details we should know about?"
              rows={3}
              {...register("additional_requirements")}
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-bold hover:bg-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
          >
            {isSubmitting ? "Creating Project..." : "Create Project & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
