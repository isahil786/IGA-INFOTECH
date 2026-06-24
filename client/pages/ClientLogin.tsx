import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const ClientLogin = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();

        if (result.token) {
          localStorage.setItem("client_token", result.token);
          localStorage.setItem("client_id", result.client?.id);
        }

        toast({
          title: "Welcome back!",
          description: "Logging you in...",
        });

        setTimeout(() => {
          navigate("/client/dashboard");
        }, 1000);
        return;
      }

      // Client login failed — these credentials might belong to the admin
      // account instead, so try that before giving up.
      const adminResponse = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (adminResponse.ok) {
        const adminResult = await adminResponse.json();
        if (adminResult.success && adminResult.token) {
          sessionStorage.setItem("adminToken", adminResult.token);

          toast({
            title: "Welcome back, Admin!",
            description: "Redirecting to admin dashboard...",
          });

          setTimeout(() => {
            navigate("/admin");
          }, 1000);
          return;
        }
      }

      // Neither client nor admin credentials matched.
      const clientError = await response.json().catch(() => ({}));
      throw new Error(clientError.message || "Login failed");
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <img src="/logo-icon.svg" alt="IGA logo" className="w-12 h-12" />
            <span className="text-white text-2xl font-bold">IGA</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Client Portal</h1>
          <p className="text-white opacity-90">Manage your projects and payments</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="john@example.com"
                  {...register("email")}
                  className="w-full pl-10 pr-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                />
              </div>
              {errors.email && (
                <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <Link
                  to="/client/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="w-full pl-10 pr-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                />
              </div>
              {errors.password && (
                <p className="text-destructive text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:bg-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Logging in..." : "Login to Dashboard"}
              {!isSubmitting && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-input"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-muted-foreground">or</span>
            </div>
          </div>

          {/* Registration Link */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground mb-4">
              Don't have an account?
            </p>
            <Link
              to="/client/register"
              className="w-full border-2 border-primary text-primary py-3 rounded-lg font-bold hover:bg-primary hover:text-primary-foreground transition-colors text-center block"
            >
              Create Free Account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-white text-sm opacity-80">
          <p>
            Need help?{" "}
            <a href="https://wa.me/918806999143" target="_blank" rel="noopener noreferrer" className="hover:opacity-100">
              Contact us on WhatsApp
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientLogin;
