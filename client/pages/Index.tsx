import { Link } from "react-router-dom";
import { ArrowRight, Globe, ShoppingCart, Smartphone, TrendingUp, Code } from "lucide-react";

const Index = () => {
  const services = [
    {
      icon: Globe,
      title: "Professional Website Development",
      description: "Create stunning, high-performance websites tailored to your business needs.",
    },
    {
      icon: ShoppingCart,
      title: "E-commerce Solutions",
      description: "Build powerful online stores that drive sales and customer engagement.",
    },
    {
      icon: Smartphone,
      title: "Mobile App Development",
      description: "Develop native and cross-platform mobile applications for iOS and Android.",
    },
    {
      icon: TrendingUp,
      title: "Digital Marketing Services",
      description: "Boost your online presence with SEO, content marketing, and social media strategies.",
    },
    {
      icon: Code,
      title: "Custom Software Development",
      description: "Build enterprise-level solutions tailored to your unique business requirements.",
    },
    {
      icon: Globe,
      title: "Web Hosting & Maintenance",
      description: "Reliable hosting services and ongoing maintenance to keep your site running smoothly.",
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-secondary text-primary-foreground py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              We Build Digital Solutions for Your Business Growth
            </h1>
            <p className="text-lg md:text-xl mb-8 opacity-90">
              IGA is your trusted partner for web development, e-commerce, mobile apps, and digital marketing services. Let's transform your vision into reality.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/services"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-white hover:bg-opacity-10 transition-colors flex items-center justify-center gap-2 text-center"
              >
                Explore Services
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Highlights */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Core Services
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We offer comprehensive digital solutions to help your business thrive in the digital landscape
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={index}
                  className="p-8 border border-border rounded-xl hover:shadow-lg hover:border-primary transition-all duration-300 group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {service.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-16 text-center">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-primary font-bold hover:gap-4 transition-all"
            >
              View All Services
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Let's discuss your project and create a digital solution that drives real results for your business.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Index;
