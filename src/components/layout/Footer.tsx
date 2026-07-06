import { Link } from "react-router-dom";
import { BookOpen, Mail, Facebook, Linkedin, Youtube, Instagram, MessageCircle } from "lucide-react";
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
    <footer className="w-full border-t border-border bg-foreground text-background">
      <div className="w-full max-w-screen-2xl mx-auto px-4 lg:px-8 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4" aria-label="Homepage">
              <BookOpen className="h-6 w-6 text-secondary" />
              <span className="font-serif text-lg font-bold text-secondary">GyandootNova</span>
            </Link>
            <p className="text-sm text-background/70 leading-relaxed">
              प्राचीन ग्रंथों को नए दौर के पाठक तक पहुँचाने की एक ईमानदार कोशिश — शुद्ध पाठ, सरल भाषा, शांत reader।
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
                : [Facebook, Linkedin, Instagram, Youtube, MessageCircle].map((Icon, i) => (
                    <span
                      key={i}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10 text-background/20"
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                  ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-serif font-semibold mb-4 text-secondary">घूमिए</h3>
            <nav aria-label="Footer explore links" className="flex flex-col gap-2.5 text-sm text-background/70">
              <Link to="/" className="hover:text-secondary transition-colors">मुख्य पृष्ठ</Link>
              <Link to="/about" className="hover:text-secondary transition-colors">हमारी कहानी</Link>
              <Link to="/books" className="hover:text-secondary transition-colors">ग्रंथ-भंडार</Link>
              <Link to="/articles" className="hover:text-secondary transition-colors">लेख</Link>
              <Link to="/services" className="hover:text-secondary transition-colors">सेवाएँ</Link>
              <Link to="/portfolio" className="hover:text-secondary transition-colors">कार्य-सूची</Link>
              <Link to="/testimonials" className="hover:text-secondary transition-colors">पाठकों की राय</Link>
            </nav>

          </div>

          {/* Support */}
          <div>
            <h3 className="font-serif font-semibold mb-4 text-secondary">सहायता</h3>
            <nav aria-label="Footer support links" className="flex flex-col gap-2.5 text-sm text-background/70">
              <Link to="/contact" className="hover:text-secondary transition-colors">सम्पर्क</Link>
              <Link to="/support-us" className="hover:text-secondary transition-colors">सहयोग दें</Link>
              <Link to="/faq" className="hover:text-secondary transition-colors">सवाल-जवाब</Link>
              <Link to="/support" className="hover:text-secondary transition-colors">सहायता केंद्र</Link>
              <Link to="/careers" className="hover:text-secondary transition-colors">हमारे साथ जुड़िए</Link>
              <a
                href="https://gyandootnova.in/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-secondary transition-colors"
              >
                साइट-मानचित्र
              </a>
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-secondary transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp पर लिखिए
                </a>
              )}
            </nav>

          </div>

          {/* Legal */}
          <div>
            <h3 className="font-serif font-semibold mb-4 text-secondary">नियम</h3>
            <nav aria-label="Footer legal links" className="flex flex-col gap-2.5 text-sm text-background/70">
              <Link to="/privacy-policy" className="hover:text-secondary transition-colors">गोपनीयता नीति</Link>
              <Link to="/terms-conditions" className="hover:text-secondary transition-colors">उपयोग की शर्तें</Link>
              <Link to="/refund-policy" className="hover:text-secondary transition-colors">refund व रद्दीकरण</Link>
              <Link to="/shipping-policy" className="hover:text-secondary transition-colors">डिलीवरी</Link>
            </nav>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-serif font-semibold mb-4 text-secondary">जुड़े रहिए</h3>
            <p className="text-sm text-background/70 mb-3">हफ़्ते में एक चुना हुआ लेख — बस इतना ही, कोई spam नहीं।</p>
            <form onSubmit={handleNewsletter} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="आपका ईमेल"
                className="flex-1 rounded-md bg-background/10 border border-background/20 px-3 py-2 text-sm text-background placeholder:text-background/40 focus:outline-none focus:ring-1 focus:ring-secondary"
              />
              <Button type="submit" size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                जोड़ें
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
              Roz naye granth aur articles ke liye humse judiye — WhatsApp par updates paayein.
            </p>
            <Button asChild size="lg" className="bg-secondary text-secondary-foreground font-bold hover:bg-secondary/90 shrink-0">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp Par Judiye
              </a>
            </Button>
          </div>
        )}

        <div className="mt-8 border-t border-background/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-background/40">
          <p>© {new Date().getFullYear()} GyandootNova. सर्वाधिकार सुरक्षित।</p>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-secondary transition-colors">गोपनीयता</Link>
            <Link to="/terms-conditions" className="hover:text-secondary transition-colors">शर्तें</Link>
            <Link to="/refund-policy" className="hover:text-secondary transition-colors">refund</Link>
          </div>

        </div>

      </div>
    </footer>
  );
};

export default Footer;
