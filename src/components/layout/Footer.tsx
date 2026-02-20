import { Link } from "react-router-dom";
import { BookOpen, Mail, Facebook, Twitter, Youtube, Instagram, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Footer = () => {
  const [email, setEmail] = useState("");

  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("key, value");
      const map: Record<string, string> = {};
      data?.forEach((s) => { map[s.key] = s.value ?? ""; });
      return map;
    },
  });

  const whatsappNumber = settings?.whatsapp_number?.replace(/\s+/g, "") ?? "";
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber.replace("+", "")}` : null;

  const socialLinks = [
    { icon: Facebook, href: settings?.facebook_url || null, label: "Facebook" },
    { icon: Twitter, href: settings?.twitter_url || null, label: "Twitter" },
    { icon: Instagram, href: settings?.instagram_url || null, label: "Instagram" },
    { icon: Youtube, href: settings?.youtube_url || null, label: "YouTube" },
    { icon: MessageCircle, href: whatsappLink, label: "WhatsApp" },
  ].filter((s) => s.href);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    setEmail("");
  };

  return (
    <footer className="border-t border-border bg-foreground text-background">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4" aria-label="Homepage">
              <BookOpen className="h-6 w-6 text-secondary" />
              <span className="font-serif text-lg font-bold text-secondary">GyandootNova</span>
            </Link>
            <p className="text-sm text-background/60 leading-relaxed">
              Illuminating spiritual seekers with sacred books, articles, and transformative programs.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {socialLinks.length > 0 ? socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10 text-background/70 transition-colors hover:bg-secondary hover:text-secondary-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              )) : (
                [Facebook, Twitter, Instagram, Youtube, MessageCircle].map((Icon, i) => (
                  <span key={i} className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10 text-background/20">
                    <Icon className="h-4 w-4" />
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-serif font-semibold mb-4 text-secondary">Explore</h4>
            <nav aria-label="Footer explore links" className="flex flex-col gap-2.5 text-sm text-background/60">
              <Link to="/" className="hover:text-secondary transition-colors">Home</Link>
              <Link to="/about" className="hover:text-secondary transition-colors">About Us</Link>
              <Link to="/books" className="hover:text-secondary transition-colors">Books</Link>
              <Link to="/articles" className="hover:text-secondary transition-colors">Articles</Link>
              <Link to="/services" className="hover:text-secondary transition-colors">Services</Link>
              <Link to="/portfolio" className="hover:text-secondary transition-colors">Portfolio</Link>
              <Link to="/testimonials" className="hover:text-secondary transition-colors">Testimonials</Link>
            </nav>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-serif font-semibold mb-4 text-secondary">Support</h4>
            <nav aria-label="Footer support links" className="flex flex-col gap-2.5 text-sm text-background/60">
              <Link to="/contact" className="hover:text-secondary transition-colors">Contact</Link>
              <Link to="/faq" className="hover:text-secondary transition-colors">FAQ</Link>
              <Link to="/support" className="hover:text-secondary transition-colors">Help Center</Link>
              <Link to="/donate" className="hover:text-secondary transition-colors">Donate</Link>
              <Link to="/careers" className="hover:text-secondary transition-colors">Careers</Link>
              <a href="https://gyandootnova.in/sitemap.xml" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">Sitemap</a>
              {whatsappLink && (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-secondary transition-colors">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Us
                </a>
              )}
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-serif font-semibold mb-4 text-secondary">Legal</h4>
            <nav aria-label="Footer legal links" className="flex flex-col gap-2.5 text-sm text-background/60">
              <Link to="/privacy-policy" className="hover:text-secondary transition-colors">Privacy Policy</Link>
              <Link to="/terms-conditions" className="hover:text-secondary transition-colors">Terms & Conditions</Link>
              <Link to="/refund-policy" className="hover:text-secondary transition-colors">Refund & Cancellation</Link>
              <Link to="/shipping-policy" className="hover:text-secondary transition-colors">Shipping & Delivery</Link>
            </nav>
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
            <div className="mt-4 flex items-start gap-2">
              <Mail className="h-4 w-4 text-secondary mt-0.5" />
              <p className="text-sm text-background/60">contact@gyandootnova.com</p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-background/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-background/40">
          <p>© {new Date().getFullYear()} GyandootNova. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-secondary transition-colors">Privacy Policy</Link>
            <Link to="/terms-conditions" className="hover:text-secondary transition-colors">Terms of Service</Link>
            <Link to="/refund-policy" className="hover:text-secondary transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
