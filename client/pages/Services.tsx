import { Link } from "react-router-dom";
import {
  Globe,
  ShoppingCart,
  Palette,
  TrendingUp,
  Wrench,
  Code,
  Check,
  ArrowRight,
  CheckCircle,
  BarChart3,
  LineChart,
  Database,
  PieChart,
  Zap,
} from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: Globe,
      title: "Website Development",
      description:
        "We design and develop high-quality, responsive, and user-friendly websites tailored to your business needs.",
      features: ["Static Websites", "Dynamic Websites", "Corporate Websites", "Portfolio Websites", "Custom Web Applications"],
      benefits: ["Mobile responsive", "Fast loading speed", "SEO optimized", "Modern UI design"],
    },
    {
      icon: ShoppingCart,
      title: "E-Commerce Development",
      description: "We create powerful online stores that help businesses sell products efficiently.",
      features: [
        "Shopping cart integration",
        "Payment gateway setup",
        "Product management system",
        "Order tracking system",
      ],
      benefits: ["Secure transactions", "Easy product management", "Scalable architecture"],
    },
    {
      icon: Palette,
      title: "UI/UX Design",
      description: "We provide creative and user-centered designs to enhance user experience.",
      features: ["Website UI design", "Mobile app design", "Wireframing", "Prototyping"],
      benefits: ["Improved user engagement", "Better usability", "Professional branding"],
    },
    {
      icon: TrendingUp,
      title: "Digital Marketing & SEO",
      description: "We help businesses increase their online visibility and reach.",
      features: [
        "Search Engine Optimization (SEO)",
        "Social Media Marketing",
        "Google Ads Management",
        "Content Marketing",
      ],
      benefits: ["Higher search rankings", "Increased website traffic", "Better customer engagement"],
    },
    {
      icon: Wrench,
      title: "Web Maintenance & Support",
      description: "We provide ongoing support to keep your website running smoothly.",
      features: ["Bug fixing", "Security updates", "Performance optimization", "Backup management"],
      benefits: ["Improved reliability", "Better security", "Optimal performance"],
    },
    {
      icon: Code,
      title: "Custom Software Development",
      description: "We build custom business solutions tailored to your company needs.",
      features: ["CRM Systems", "Admin Dashboards", "Inventory Management Systems", "Booking Systems"],
      benefits: ["Tailored solutions", "Scalability", "Integration capabilities"],
    },
    {
      icon: BarChart3,
      title: "Business Intelligence Dashboards",
      description: "IGA develops interactive dashboards that help organizations monitor performance and make informed decisions.",
      features: ["Real-time data visualization", "KPI tracking", "Custom reports", "Automated insights"],
      benefits: ["Power BI", "Tableau", "Excel Dashboards"],
    },
    {
      icon: LineChart,
      title: "Data Analysis & Reporting",
      description: "We analyze business data to uncover trends, patterns, and opportunities.",
      features: ["Data cleaning & preprocessing", "Statistical analysis", "Trend analysis", "Predictive insights"],
      benefits: ["Actionable insights", "Data-driven decisions", "Improved accuracy"],
    },
    {
      icon: Database,
      title: "SQL Database Management",
      description: "We design and manage databases to store and organize business data efficiently.",
      features: ["MySQL database setup", "Data integration", "Query optimization", "Secure data storage"],
      benefits: ["High performance", "Data security", "Scalable infrastructure"],
    },
    {
      icon: Zap,
      title: "Automated Reporting Solutions",
      description: "We create systems that automatically generate reports for business monitoring.",
      features: ["Scheduled report generation", "Multi-format exports", "Real-time alerts", "Email distribution"],
      benefits: ["Saves time", "Reduces manual work", "Improves accuracy"],
    },
    {
      icon: PieChart,
      title: "Custom Data Analytics Solutions",
      description: "IGA provides tailored analytics solutions based on business needs.",
      features: ["Sales dashboards", "HR analytics dashboards", "Financial reporting systems", "Customer behavior analytics"],
      benefits: ["Customized to your needs", "Competitive advantage", "Strategic insights"],
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-secondary text-primary-foreground py-20 md:py-32">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Our Services
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl">
            Comprehensive Digital Solutions to Grow Your Business
          </p>
        </div>
      </section>

      {/* Main Services Section */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What We Offer
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Explore our comprehensive range of digital services designed to elevate your business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={index}
                  className="bg-white border border-border rounded-xl p-8 hover:shadow-xl hover:border-primary transition-all duration-300 group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {service.title}
                  </h3>

                  <p className="text-muted-foreground mb-6">
                    {service.description}
                  </p>

                  <div className="mb-6">
                    <h4 className="font-semibold text-foreground mb-3 text-sm">
                      Services Included:
                    </h4>
                    <ul className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3 text-sm">
                      Key Benefits:
                    </h4>
                    <ul className="space-y-2">
                      {service.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose IGA Section */}
      <section className="py-20 md:py-32 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Why Choose IGA?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex gap-4">
              <div className="w-6 h-6 bg-white bg-opacity-30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold mb-2">Expert Team Across All Domains</h3>
                <p className="text-sm opacity-90">Experienced developers, designers, and data analysts covering web development, e-commerce, UI/UX, analytics, and custom software</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-6 h-6 bg-white bg-opacity-30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold mb-2">Cutting-Edge Technology Stack</h3>
                <p className="text-sm opacity-90">React, Node.js, Power BI, Tableau, modern frameworks, and latest development tools</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-6 h-6 bg-white bg-opacity-30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold mb-2">Data-Driven Solutions</h3>
                <p className="text-sm opacity-90">Websites, dashboards, and applications backed by analytics and strategic insights</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-6 h-6 bg-white bg-opacity-30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold mb-2">Competitive & Transparent Pricing</h3>
                <p className="text-sm opacity-90">Affordable packages for all business sizes without hidden costs</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-6 h-6 bg-white bg-opacity-30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold mb-2">Guaranteed On-Time Delivery</h3>
                <p className="text-sm opacity-90">Commitment to meeting deadlines across all project types</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-6 h-6 bg-white bg-opacity-30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold mb-2">24/7 Support & Maintenance</h3>
                <p className="text-sm opacity-90">Continuous support, bug fixes, updates, and optimization for websites, dashboards, and applications</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-6 h-6 bg-white bg-opacity-30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold mb-2">Responsive & Scalable Design</h3>
                <p className="text-sm opacity-90">All solutions built for mobile, tablet, and desktop with room to grow</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-6 h-6 bg-white bg-opacity-30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold mb-2">100% Client Satisfaction Guarantee</h3>
                <p className="text-sm opacity-90">Your success is our priority; we ensure every project exceeds expectations</p>
              </div>
            </div>
          </div>
        </div>
      </section>



    </div>
  );
};

export default Services;
