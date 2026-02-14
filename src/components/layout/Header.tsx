import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, BookOpen, Heart, User, LogOut, Shield } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About Us" },
    { to: "/books", label: "Books" },
    { to: "/articles", label: "Articles" },
    { to: "/services", label: "Services" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2" aria-label="Go to homepage">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-serif text-lg font-bold text-primary">GyandootNova</span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className="flex items-center gap-1 text-sm font-medium text-primary">
              <Shield className="h-4 w-4" /> Admin
            </Link>
          )}
          <Button
            size="sm"
            className="bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/90 shadow-sm"
            asChild
          >
            <Link to="/donate">
              <Heart className="mr-1.5 h-4 w-4" /> Donate Now
            </Link>
          </Button>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{user.email?.split("@")[0]}</span>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
              <User className="mr-1 h-4 w-4" /> Sign In
            </Button>
          )}
        </nav>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-border bg-background p-4 lg:hidden">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className="text-sm font-medium" onClick={() => setMobileOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link
              to="/donate"
              className="text-sm font-semibold text-secondary-foreground bg-secondary rounded-md px-3 py-2 text-center"
              onClick={() => setMobileOpen(false)}
            >
              Donate Now
            </Link>
            {isAdmin && (
              <Link to="/admin" className="text-sm font-medium text-primary" onClick={() => setMobileOpen(false)}>
                Admin Panel
              </Link>
            )}
            {user ? (
              <Button variant="outline" size="sm" onClick={() => { signOut(); setMobileOpen(false); }}>
                Sign Out
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => { navigate("/auth"); setMobileOpen(false); }}>
                Sign In
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
