import { Check, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PRICING_PLANS } from "@shared/workflow";

const PricingPlans = () => {
  const navigate = useNavigate();

  const handleSelectPlan = (plan: string) => {
    // Store selected plan in sessionStorage
    sessionStorage.setItem("selectedPricingPlan", plan);
    navigate("/client/projects/new");
  };

  const plans = Object.values(PRICING_PLANS);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-secondary text-primary-foreground py-20 md:py-32">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl opacity-90">
            Choose the perfect plan for your project. All plans include 50% advance payment with balance due on completion.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                  plan.name === "Standard"
                    ? "border-2 border-primary shadow-2xl md:scale-105 bg-white"
                    : "border border-border hover:shadow-lg bg-white"
                }`}
              >
                {/* Popular Badge */}
                {plan.name === "Standard" && (
                  <div className="bg-primary text-white py-3 text-center text-sm font-bold">
                    MOST POPULAR
                  </div>
                )}

                {/* Plan Details */}
                <div className="p-8">
                  {/* Plan Name */}
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-5xl font-bold text-primary">
                        ₹{plan.price.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">one-time</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <Check className="w-4 h-4" />
                      50% advance, 50% on completion
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan.name)}
                    className={`w-full py-3 rounded-lg font-bold transition-colors mb-8 flex items-center justify-center gap-2 ${
                      plan.name === "Standard"
                        ? "bg-primary text-white hover:bg-secondary"
                        : "border-2 border-primary text-primary hover:bg-primary hover:text-white"
                    }`}
                  >
                    Start Project
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Features */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-foreground text-sm uppercase tracking-wide">
                      What's Included
                    </h3>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex gap-3">
                          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground text-sm">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-border">
                <h3 className="font-bold text-foreground mb-2">
                  What's included in the advance payment?
                </h3>
                <p className="text-muted-foreground">
                  The 50% advance covers project setup, initial design, and development kickoff. The remaining 50% is due upon project completion and delivery.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-border">
                <h3 className="font-bold text-foreground mb-2">
                  How long does each plan take?
                </h3>
                <p className="text-muted-foreground">
                  Basic plans typically take 2-3 weeks, Standard plans 4-6 weeks, and Premium plans 8-12 weeks depending on complexity.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-border">
                <h3 className="font-bold text-foreground mb-2">
                  Can I customize my plan?
                </h3>
                <p className="text-muted-foreground">
                  Absolutely! These are starting prices. We can customize any plan based on your specific requirements. Contact us for a custom quote.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-border">
                <h3 className="font-bold text-foreground mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-muted-foreground">
                  We accept all major payment methods via Razorpay including credit/debit cards, net banking, UPI, and wallet payments.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-border">
                <h3 className="font-bold text-foreground mb-2">
                  Is support included?
                </h3>
                <p className="text-muted-foreground">
                  Yes! All plans include post-launch support for the specified duration (1-6 months). Additional support packages are available.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-primary text-primary-foreground py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Project?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Choose your plan and fill out a quick requirement form. We'll review and get back to you within 24 hours.
          </p>
          <button
            onClick={() => navigate("/client/register")}
            className="bg-white text-primary px-10 py-4 rounded-lg font-bold hover:bg-opacity-90 transition-colors inline-flex items-center gap-2"
          >
            Create Account
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default PricingPlans;
