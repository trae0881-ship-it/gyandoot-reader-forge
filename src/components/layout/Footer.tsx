import { Link } from "react-router-dom";
import { Mail, Facebook, Linkedin, Youtube, Instagram, MessageCircle } from "lucide-react";
import brandLogo from "@/assets/gyandootnova-logo.png.asset.json";
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
      data?.forEach((s) => {
        map[s.key] = s.value ?? "";
      });
      return map;
    },
  });

  const whatsappNumber = settings?.whatsapp_number?.replace(/\s+/g, "") ?? "";
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber.replace("+", "")}` : null;

  const socialLinks = [
    { icon: Facebook, href: settings?.facebook_url || null, label: "Facebook" },
    { icon: Linkedin, href: settings?.linkedin_url || null, label: "LinkedIn" },
    { icon: Instagram, href: settings?.instagram_url || null, label: "Instagram" },
    { icon: Youtube, href: settings?.youtube_url || null, label: "YouTube" },
    { icon: MessageCircle, href: whatsappLink, label: "WhatsApp" },
  ].filter((s) => s.href);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    setEmail("");
  };

  return (
    <footer className="relative w-full border-t border-border/60 bg-ink text-cream overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 15% 0%, hsl(var(--primary) / 0.35), transparent 55%), radial-gradient(ellipse at 90% 100%, hsl(var(--gold) / 0.18), transparent 55%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
      <div className="relative w-full max-w-screen-2xl mx-auto px-4 lg:px-8 py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex items-center mb-4" aria-label="GyandootNova homepage">
              <img
                src={brandLogo.url}
                alt="GyandootNova logo"
                width={260}
                height={60}
                className="h-14 w-auto rounded-md"
                loading="lazy"
              />
            </Link>
            <p className="text-sm text-background/70 leading-relaxed">
              A trusted publishing home where timeless scriptures, modern ideas and thoughtful readers come together.
            </p>


            <div className="mt-5 flex flex-wrap gap-3">
              {socialLinks.length > 0
                ? socialLinks.map(({ icon: Icon, href, label }) => (
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
                  ))
                : [
                    { Icon: Facebook, label: "Facebook" },
                    { Icon: Linkedin, label: "LinkedIn" },
                    { Icon: Instagram, label: "Instagram" },
                    { Icon: Youtube, label: "YouTube" },
                    { Icon: MessageCircle, label: "WhatsApp" },
                  ].map(({ Icon, label }) => (
                    <span
                      key={label}
                      role="img"
                      aria-label={`${label} (coming soon)`}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10 text-background/20"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">{label} (coming soon)</span>
                    </span>
                  ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-serif font-semibold mb-4 text-secondary">Explore</h3>
            <nav aria-label="Footer explore links" className="flex flex-col gap-2.5 text-sm text-background/70">
              <Link to="/" className="hover:text-secondary transition-colors">Home</Link>
              <Link to="/about" className="hover:text-secondary transition-colors">Our Story</Link>
              <Link to="/books" className="hover:text-secondary transition-colors">Books</Link>
              <Link to="/articles" className="hover:text-secondary transition-colors">Articles</Link>
              <Link to="/services" className="hover:text-secondary transition-colors">Services</Link>
              <Link to="/portfolio" className="hover:text-secondary transition-colors">Portfolio</Link>
              <Link to="/testimonials" className="hover:text-secondary transition-colors">Testimonials</Link>
            </nav>

          </div>

          {/* Support */}
          <div>
            <h3 className="font-serif font-semibold mb-4 text-secondary">Support</h3>
            <nav aria-label="Footer support links" className="flex flex-col gap-2.5 text-sm text-background/70">
              <Link to="/contact" className="hover:text-secondary transition-colors">Contact</Link>
              <Link to="/support-us" className="hover:text-secondary transition-colors">Support Us</Link>
              <Link to="/faq" className="hover:text-secondary transition-colors">FAQ</Link>
              <Link to="/support" className="hover:text-secondary transition-colors">Help Center</Link>
              <Link to="/careers" className="hover:text-secondary transition-colors">Careers</Link>
              <a
                href="https://gyandootnova.in/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-secondary transition-colors"
              >
                Sitemap
              </a>
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-secondary transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Message on WhatsApp
                </a>
              )}
            </nav>

          </div>

          {/* Legal */}
          <div>
            <h3 className="font-serif font-semibold mb-4 text-secondary">Legal</h3>
            <nav aria-label="Footer legal links" className="flex flex-col gap-2.5 text-sm text-background/70">
              <Link to="/privacy-policy" className="hover:text-secondary transition-colors">Privacy Policy</Link>
              <Link to="/terms-conditions" className="hover:text-secondary transition-colors">Terms & Conditions</Link>
              <Link to="/refund-policy" className="hover:text-secondary transition-colors">Refund & Cancellation</Link>
              <Link to="/shipping-policy" className="hover:text-secondary transition-colors">Shipping</Link>
            </nav>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-serif font-semibold mb-4 text-secondary">Stay Connected</h3>
            <p className="text-sm text-background/70 mb-3">One curated article a week — that's all, no spam.</p>
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
                Subscribe
              </Button>
            </form>

            <div className="mt-4 flex items-start gap-2">
              <Mail className="h-4 w-4 text-secondary mt-0.5" />
              <p className="text-sm text-background/70">amrendra8765@gmail.com</p>
            </div>
          </div>
        </div>

        {/* WhatsApp CTA row (C.6) — replaces old keyword-stuffed line */}
        {whatsappLink && (
          <div className="mt-10 rounded-xl border border-background/15 bg-background/5 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-background/80 text-center md:text-left">
              Get daily updates on new scriptures and articles — join us on WhatsApp.
            </p>
            <Button asChild size="lg" className="bg-secondary text-secondary-foreground font-bold hover:bg-secondary/90 shrink-0">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" /> Join on WhatsApp
              </a>
            </Button>
          </div>
        )}

        <div className="mt-8 border-t border-background/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-background/40">
          <p>© {new Date().getFullYear()} GyandootNova. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-secondary transition-colors">Privacy</Link>
            <Link to="/terms-conditions" className="hover:text-secondary transition-colors">Terms</Link>
            <Link to="/refund-policy" className="hover:text-secondary transition-colors">Refund</Link>
          </div>
        </div>
        <p
          className="mt-3 text-center text-[10px] font-mono text-background/30"
          title={`Built ${__BUILT_AT__}`}
          data-build-id={__BUILD_ID__}
        >
          build {String(__BUILD_ID__).slice(0, 12)} · {__BUILT_AT__}
        </p>


      </div>
    </footer>
  );
};

export default Footer;
