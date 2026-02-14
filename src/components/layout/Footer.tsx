import { Link } from "react-router-dom";
import { BookOpen, Heart, Mail, Facebook, Twitter, Youtube, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    setEmail("");
  };

  return (
    <footer className="border-t border-border bg-foreground text-background">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4" aria-label="Homepage">
              <BookOpen className="h-6 w-6 text-secondary" />
              <span className="font-serif text-lg font-bold text-secondary">GyandootNova</span>
            </Link>
            <p className="text-sm text-background/60 leading-relaxed">
              A spiritual publication and knowledge platform dedicated to illuminating seekers with sacred books, articles, and transformative programs.
            </p>
            <div className="mt-5 flex gap-3">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label={`Social link ${i + 1}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10 text-background/70 transition-colors hover:bg-secondary hover:text-secondary-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore links */}
          <div>
            <h4 className="font-serif font-semibold mb-4 text-secondary">Explore</h4>
            <nav aria-label="Footer explore links" className="flex flex-col gap-2.5 text-sm text-background/60">
              <Link to="/" className="hover:text-secondary transition-colors">Home</Link>
              <Link to="/books" className="hover:text-secondary transition-colors">Books</Link>
              <Link to="/articles" className="hover:text-secondary transition-colors">Articles & Programs</Link>
              <Link to="/donate" className="hover:text-secondary transition-colors">Donate</Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif font-semibold mb-4 text-secondary">Contact</h4>
            <div className="space-y-2.5 text-sm text-background/60">
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-secondary" /> contact@gyandootnova.com</p>
              <p>New Delhi, India</p>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-serif font-semibold mb-4 text-secondary">Stay Connected</h4>
            <p className="text-sm text-background/60 mb-3">Subscribe for spiritual wisdom and updates.</p>
            <form onSubmit={handleNewsletter} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="flex-1 rounded-md bg-background/10 border border-background/20 px-3 py-2 text-sm text-background placeholder:text-background/40 focus:outline-none focus:ring-1 focus:ring-secondary"
              />
              <Button type="submit" size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                Join
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-10 border-t border-background/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-background/40">
          <p>© {new Date().getFullYear()} GyandootNova. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-secondary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-secondary transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
