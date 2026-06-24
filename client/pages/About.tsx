import { Globe, Zap, BarChart3, Bot, ShoppingCart, Lock, CheckCircle, ArrowRight, MessageCircle } from "lucide-react";

const About = () => {
  const services = [
    { icon: Globe, title: "Website Development", subtitle: "Static & Dynamic" },
    { icon: Zap, title: "Web Applications", subtitle: "Flask, React, MERN" },
    { icon: BarChart3, title: "Data Analytics", subtitle: "Dashboards" },
    { icon: Bot, title: "AI-Powered Solutions", subtitle: "Smart Systems" },
    { icon: ShoppingCart, title: "E-commerce", subtitle: "Development" },
    { icon: Lock, title: "Secure Systems", subtitle: "Scalable Solutions" },
  ];

  const reasons = [
    "Client-focused approach",
    "Modern and responsive designs",
    "Scalable and secure architecture",
    "Fast delivery with quality assurance",
    "Affordable and customized solutions",
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-secondary text-primary-foreground py-24 md:py-32">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            About IGA Infotech
          </h1>
          <p className="text-xl md:text-2xl opacity-90 mb-8 leading-relaxed">
            Learn more about our mission, vision, and the team behind our success
          </p>
          <a
            href="https://wa.me/918806999143"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-primary px-8 py-4 rounded-lg font-bold hover:bg-opacity-90 transition-colors inline-flex items-center gap-2"
            aria-label="Contact us via WhatsApp"
          >
            <MessageCircle className="w-5 h-5" />
            Contact Us
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Who We Are */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
            Who We Are
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            IGA Infotech is a forward-thinking digital solutions company dedicated to building modern, scalable, and high-performing websites and applications. We specialize in delivering customized web development, AI-powered solutions, and data analytics dashboards that help businesses grow and succeed in the digital world. Our team focuses on innovation, quality, and client satisfaction.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            With a passion for technology and a commitment to excellence, we transform ideas into powerful digital experiences that drive real business results.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 md:py-32 bg-secondary bg-opacity-5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Mission */}
            <div className="bg-white rounded-xl shadow-lg p-8 md:p-10 hover:shadow-xl transition-shadow border border-border">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Our Mission
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Our mission is to empower businesses with smart digital solutions that drive growth, efficiency, and innovation. We aim to bridge the gap between technology and business success by delivering reliable and future-ready solutions.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white rounded-xl shadow-lg p-8 md:p-10 hover:shadow-xl transition-shadow border border-border">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mb-6">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Our Vision
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Our vision is to become a trusted global technology partner known for creativity, integrity, and excellence. We strive to continuously evolve with technology trends and deliver impactful digital transformation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-center">
              What We Do
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-16">
              A comprehensive range of digital solutions tailored to your needs
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <div key={service.title} className="p-8 border border-border rounded-xl hover:shadow-lg hover:border-primary transition-all duration-300 group">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {service.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {service.subtitle}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose IGA */}
      <section className="bg-primary text-primary-foreground py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">
              Why Choose IGA Infotech
            </h2>
            <p className="text-lg opacity-90 text-center mb-16">
              Here's what sets us apart from the competition
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reasons.map((reason) => (
                <div key={reason} className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                  <p className="text-lg leading-relaxed">
                    {reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Ready to Transform Your Business with Technology?
            </h2>
            <p className="text-xl text-muted-foreground">
              Let's discuss how IGA Infotech can help you achieve your digital goals
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
