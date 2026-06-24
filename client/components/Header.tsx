import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: "Pricing", href: "/pricing" },
    { label: "About", href: "/about" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo and Company Name */}
          <Link to="/" className="flex items-center gap-2 font-bold text-2xl text-primary">
            <img src="/logo-icon.svg" alt="IGA logo" className="w-10 h-10" />
            <span>IGA</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-foreground hover:text-primary font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/client/login"
              className="text-foreground hover:text-primary font-medium transition-colors"
            >
              Client Login
            </Link>
            <Link
              to="/client/register"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold hover:bg-secondary transition-colors"
            >
              Get Started
            </Link>
          </div>


          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 flex flex-col gap-4 pb-4 border-t border-border pt-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-foreground hover:text-primary font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/client/login"
              className="text-foreground hover:text-primary font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Client Login
            </Link>
            <Link
              to="/client/register"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-center hover:bg-secondary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
