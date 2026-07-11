import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Infinity as InfinityIcon,
  Lock,
  CheckCircle2,
  Star,
  Sparkles,
  ScrollText,
  Landmark,
  Heart,
  Music2,
  Flame,
  Feather,
  Smartphone,
  RefreshCw,
  Award,
  Zap,
  Quote,
  ArrowUpRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import useSEO from "@/hooks/useSEO";
import LiveReaderStrip from "@/components/LiveReaderStrip";
import RecentPurchasesToast from "@/components/RecentPurchasesToast";
import FaqStrip from "@/components/FaqStrip";
import NewsletterCta from "@/components/NewsletterCta";
import ContinueReadingSection from "@/components/ContinueReadingSection";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Index = () => {
  const { data: featuredBooks } = useQuery({
    queryKey: ["featured-books"],
    queryFn: async () => {
      const { data } = await supabase
        .from("books")
        .select("id, title, slug, author, cover_url, price, is_free")
        .eq("is_featured", true)
        .limit(6);
      return data ?? [];
    },
  });

  const { data: latestPosts } = useQuery({
    queryKey: ["latest-posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("id, title, slug, excerpt, cover_url, post_type, created_at")
        .eq("is_published", true)
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings-brand"],
    queryFn: async () => {
      const { data } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", ["facebook_url", "instagram_url", "linkedin_url", "youtube_url", "whatsapp_number"]);
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: any) => {
        map[r.key] = (r.value ?? "").trim();
      });
      return map;
    },
  });

  const sameAs = [
    siteSettings?.facebook_url,
    siteSettings?.instagram_url,
    siteSettings?.linkedin_url,
    siteSettings?.youtube_url,
    siteSettings?.whatsapp_number
      ? `https://wa.me/${siteSettings.whatsapp_number.replace(/\s+/g, "").replace(/^\+/, "")}`
      : null,
  ].filter((u): u is string => !!u && /^https?:\/\//.test(u));

  const brandDescription =
    "GyandootNova is a premium digital publisher of India's sacred scriptures — Bhagavad Gita, the four Vedas, Upanishads, Ramayana, Hanuman Chalisa and Vishnu Sahasranama — in a calm, distraction-free reader.";

  useSEO({
    title: "GyandootNova — Premium Digital Publisher of India's Sacred Scriptures",
    description:
      "Read the Bhagavad Gita, Vedas, Upanishads, Ramayana and more in a beautiful, distraction-free reader. Trusted translations, lifetime access, secure payments.",
    canonical: "/",
    ogImage: "https://gyandootnova.in/og-image.png",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": "https://gyandootnova.in/#website",
          url: "https://gyandootnova.in/",
          name: "GyandootNova",
          alternateName: ["Gyandoot Nova", "Gyandoot"],
          inLanguage: "en-IN",
          description: brandDescription,
          publisher: { "@id": "https://gyandootnova.in/#organization" },
          potentialAction: {
            "@type": "SearchAction",
            target: "https://gyandootnova.in/books?search={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        },
        {
          "@type": "Organization",
          "@id": "https://gyandootnova.in/#organization",
          name: "GyandootNova",
          alternateName: ["Gyandoot Nova", "Gyandoot"],
          url: "https://gyandootnova.in/",
          logo: {
            "@type": "ImageObject",
            url: "https://gyandootnova.in/gyandoot-nova-icon.ico",
          },
          description: brandDescription,
          ...(sameAs.length > 0 ? { sameAs } : {}),
        },
      ],
    },
  });

  const categories = [
    { icon: ScrollText, title: "Vedas & Upanishads", desc: "The four Vedas and principal Upanishads, translated with clarity.", to: "/books?category=adhyatm" },
    { icon: Landmark, title: "Itihasa", desc: "Ramayana and Mahabharata — timeless epics in accessible language.", to: "/books?category=katha" },
    { icon: Heart, title: "Bhagavad Gita", desc: "The Gita and thoughtful commentaries for everyday practice.", to: "/books?category=devta" },
    { icon: Music2, title: "Stotra & Mantra", desc: "Vishnu Sahasranama, Hanuman Chalisa and daily chants.", to: "/books?category=devi" },
    { icon: Flame, title: "Puranas", desc: "Bhagavata, Vishnu Purana and devotional narratives.", to: "/books?category=puran" },
    { icon: Feather, title: "Yoga & Sadhana", desc: "Guides on meditation, pranayama and inner practice.", to: "/books?category=other" },
  ];

  const testimonials = [
    { name: "Anjali Sharma", role: "Reader · Bengaluru", quote: "The typography and calm layout make reading the Gita feel sacred again. It's the reading experience I always wished for." },
    { name: "Rohan Iyer", role: "Reader · Mumbai", quote: "Trustworthy translations, no clutter, no distractions. GyandootNova feels like a heritage library reimagined for today." },
    { name: "Meera Nair", role: "Reader · Kochi", quote: "I've bought many editions over the years — none felt this thoughtful. Buy once, read forever, on any device." },
  ];

  const faqs = [
    { q: "Are the translations authentic?", a: "Every text is prepared with reference to original Sanskrit sources and reviewed by scholars before publication." },
    { q: "Do I get lifetime access?", a: "Yes. One purchase gives you lifetime reading access along with all future edition updates — free of charge." },
    { q: "Can I read on my phone?", a: "The reader is fully responsive and works beautifully on phones, tablets and desktops — no app download required." },
    { q: "Is there a refund guarantee?", a: "Absolutely. If you're not satisfied within 7 days of purchase, we'll refund your full amount, no questions asked." },
  ];

  return (
    <Layout>
      <LiveReaderStrip />
      <RecentPurchasesToast />

      {/* ─── 1. HERO ─── */}
      <section className="relative overflow-hidden bg-background">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.35] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 12% 8%, hsl(var(--secondary) / 0.12) 0%, transparent 45%), radial-gradient(ellipse at 90% 20%, hsl(var(--primary) / 0.08) 0%, transparent 40%)",
          }}
        />
        <div className="container relative pt-16 pb-20 md:pt-24 md:pb-28 lg:pt-32 lg:pb-36">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 backdrop-blur px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--royal-blue))] mb-8 shadow-sm">
                <Sparkles className="h-3 w-3" />
                A Premium Digital Publication
              </div>
              <h1 className="font-serif text-[2.6rem] sm:text-5xl lg:text-[4.25rem] font-bold leading-[1.05] tracking-tight text-foreground">
                The sacred, <span className="text-primary">reimagined</span>{" "}
                for the modern reader.
              </h1>
              <p className="mt-8 max-w-xl text-base md:text-lg leading-[1.8] text-muted-foreground">
                Bhagavad Gita, the Vedas, Upanishads, Ramayana and more —
                translated with care and offered in a calm reader designed for
                slow, thoughtful discovery.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 h-12 text-base font-medium shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5"
                  asChild
                >
                  <Link to="/books">
                    Explore the Library <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border bg-card hover:bg-muted rounded-full px-8 h-12 text-base font-medium"
                  asChild
                >
                  <Link to="/books?filter=free">Start Reading Free</Link>
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-secondary text-secondary" />
                    ))}
                  </span>
                  <span className="font-medium text-foreground">4.9</span> · 12,400+ readers
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[hsl(var(--royal-blue))]" />
                  Trusted since 2019
                </span>
              </div>
            </div>

            {/* Hero visual — layered book mockup */}
            <div className="relative animate-fade-in-up delay-200 hidden md:block">
              <div className="relative mx-auto max-w-md aspect-[4/5]">
                <div
                  aria-hidden
                  className="absolute -inset-8 rounded-[2rem] opacity-60 blur-3xl"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 30%, hsl(var(--secondary) / 0.35), transparent 60%), radial-gradient(circle at 70% 70%, hsl(var(--primary) / 0.25), transparent 60%)",
                  }}
                />
                {/* Back book */}
                <div className="absolute right-4 top-8 w-[62%] aspect-[3/4] rounded-2xl bg-gradient-to-br from-[hsl(var(--royal-blue))] to-[hsl(var(--royal-blue-glow))] shadow-2xl rotate-6 transition-transform duration-700 hover:rotate-3">
                  <div className="absolute inset-0 rounded-2xl border border-white/10" />
                  <div className="absolute inset-x-6 top-8 h-px bg-white/30" />
                  <div className="absolute inset-x-6 bottom-10 space-y-2">
                    <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/70">Volume II</p>
                    <p className="font-serif text-xl text-white leading-tight">Upanishads</p>
                  </div>
                </div>
                {/* Front book */}
                <div className="absolute left-2 bottom-0 w-[68%] aspect-[3/4] rounded-2xl bg-gradient-to-br from-primary to-[hsl(var(--primary-glow))] shadow-2xl -rotate-3 transition-transform duration-700 hover:rotate-0">
                  <div className="absolute inset-0 rounded-2xl border border-white/10" />
                  <div className="absolute inset-x-6 top-10 h-px bg-secondary/60" />
                  <div className="absolute inset-x-6 top-14">
                    <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-secondary">Sacred Edition</p>
                  </div>
                  <div className="absolute inset-x-6 bottom-10 space-y-2">
                    <p className="font-serif text-3xl text-primary-foreground leading-[1.05]">
                      Bhagavad<br />Gita
                    </p>
                    <div className="h-px w-10 bg-secondary" />
                    <p className="text-[11px] text-primary-foreground/70">Translated · Annotated</p>
                  </div>
                  <div className="absolute right-5 top-5 h-8 w-8 rounded-full bg-secondary/90 grid place-items-center shadow-lg">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                </div>
                {/* Floating stat card */}
                <div className="absolute -right-2 bottom-16 rounded-2xl bg-card border border-border shadow-xl p-4 w-44 animate-float-slow">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 grid place-items-center">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-serif font-bold text-foreground leading-none">50+</p>
                      <p className="text-[10px] text-muted-foreground">Sacred texts</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. TRUSTED STRIP ─── */}
      <section className="border-y border-border bg-card">
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
            {[
              { icon: Lock, label: "Secure Payments", sub: "256-bit encryption" },
              { icon: InfinityIcon, label: "Lifetime Access", sub: "Buy once, read forever" },
              { icon: Award, label: "Authentic Editions", sub: "Scholar-verified" },
              { icon: Zap, label: "Instant Access", sub: "Read in seconds" },
            ].map((t) => (
              <div key={t.label} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary/15 grid place-items-center shrink-0">
                  <t.icon className="h-4 w-4 text-[hsl(var(--gold-deep))]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ContinueReadingSection />

      {/* ─── 3. FEATURED SCRIPTURES ─── */}
      <section className="bg-background section-rhythm">
        <div className="container">
          <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="section-eyebrow">Featured</span>
              <h2 className="mt-3 font-serif text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                Sacred texts, <span className="text-primary">beautifully edited</span>.
              </h2>
              <p className="mt-4 max-w-xl text-muted-foreground">
                Hand-picked editions from our library — the essential
                scriptures every home library deserves.
              </p>
            </div>
            <Link
              to="/books"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary link-underline shrink-0"
            >
              View all books <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(featuredBooks ?? []).slice(0, 6).map((b: any) => (
              <Link
                key={b.id}
                to={`/books/${b.slug}`}
                className="group relative rounded-2xl bg-card border border-border overflow-hidden transition-all duration-500 hover:shadow-lift hover:-translate-y-1 hover:border-primary/30"
              >
                <div className="aspect-[4/5] overflow-hidden bg-muted">
                  {b.cover_url ? (
                    <img
                      src={b.cover_url}
                      alt={b.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/80 to-[hsl(var(--primary-glow))] grid place-items-center">
                      <BookOpen className="h-14 w-14 text-primary-foreground/70" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {b.title}
                  </h3>
                  {b.author && (
                    <p className="mt-1 text-xs text-muted-foreground">{b.author}</p>
                  )}
                  <div className="mt-5 flex items-center justify-between">
                    <span className="font-serif text-lg font-bold text-foreground">
                      {b.is_free ? "Free" : b.price ? `₹${b.price}` : "—"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      {b.is_free ? "Read Sample" : "Buy Now"} <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {(!featuredBooks || featuredBooks.length === 0) && (
              <div className="col-span-full text-center py-16 text-muted-foreground text-sm">
                Featured books will appear here.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── 4. BROWSE BY CATEGORY ─── */}
      <section className="bg-[hsl(var(--surface))] section-rhythm">
        <div className="container">
          <div className="mb-14 text-center max-w-2xl mx-auto">
            <span className="section-eyebrow">The Library</span>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              Browse by <span className="text-primary">tradition</span>.
            </h2>
            <p className="mt-4 text-muted-foreground">
              50+ carefully curated sacred texts organised the way scholars
              have read them for centuries.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Link
                key={cat.title}
                to={cat.to}
                className="group relative rounded-2xl bg-card border border-border p-7 transition-all duration-400 hover:border-primary/30 hover:shadow-card hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-secondary/15 grid place-items-center shrink-0 group-hover:bg-secondary/25 transition-colors">
                    <cat.icon className="h-5 w-5 text-[hsl(var(--gold-deep))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {cat.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                      {cat.desc}
                    </p>
                    <span className="mt-4 inline-flex items-center text-xs font-semibold text-primary opacity-70 group-hover:opacity-100 transition-opacity">
                      Explore <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. WHY GYANDOOTNOVA ─── */}
      <section className="bg-background section-rhythm">
        <div className="container">
          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] items-center">
            <div>
              <span className="section-eyebrow">Why GyandootNova</span>
              <h2 className="mt-3 font-serif text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                Built for the <span className="text-primary italic font-normal">reader</span>,
                not the algorithm.
              </h2>
              <p className="mt-5 text-muted-foreground leading-relaxed">
                We're a small team of editors, designers and translators
                obsessed with one question: how would you want to read the
                Gita if you were reading it for the first time?
              </p>
              <div className="mt-8 flex items-center gap-3">
                <div className="h-px w-12 bg-secondary" />
                <span className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground">
                  A quiet publishing house
                </span>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: CheckCircle2, title: "Authentic translations", desc: "Verified against original Sanskrit by our scholarly panel." },
                { icon: BookOpen, title: "Effortless reading", desc: "Kindle-quality typography, thoughtful spacing, zero clutter." },
                { icon: RefreshCw, title: "Lifetime updates", desc: "New editions and improvements — always free, forever yours." },
                { icon: Smartphone, title: "Every device", desc: "Read on phone, tablet or desktop. Nothing to download." },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-card hover:border-primary/20"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center mb-4">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-serif text-base font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. MEMBERSHIP ─── */}
      <section className="bg-[hsl(var(--surface))] section-rhythm">
        <div className="container">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <span className="section-eyebrow">Membership</span>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              One home library, <span className="text-primary">forever</span>.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Simple pricing. Lifetime access. Cancel anytime — but you won't.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {[
              {
                name: "Reader",
                price: "Free",
                sub: "Start exploring",
                features: ["3 free scriptures", "Full-text reader", "Read on any device", "No account required"],
                cta: "Start Reading",
                to: "/books?filter=free",
                highlight: false,
              },
              {
                name: "Library",
                price: "₹999",
                sub: "One-time · Lifetime",
                features: ["All 50+ scriptures", "Lifetime updates", "Offline reading", "Priority support", "Ad-free reader"],
                cta: "Get Lifetime Access",
                to: "/books",
                highlight: true,
              },
              {
                name: "Patron",
                price: "₹2,499",
                sub: "Support the mission",
                features: ["Everything in Library", "Early access to new titles", "Named acknowledgement", "Direct scholar Q&A"],
                cta: "Become a Patron",
                to: "/donate",
                highlight: false,
              },
            ].map((p) => (
              <div
                key={p.name}
                className={
                  p.highlight
                    ? "relative rounded-3xl bg-card border-2 border-primary p-8 shadow-xl shadow-primary/10 md:-translate-y-3"
                    : "relative rounded-3xl bg-card border border-border p-8 shadow-card"
                }
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-secondary text-secondary-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] shadow-md">
                    Most Popular
                  </div>
                )}
                <p className={p.highlight ? "text-xs font-semibold uppercase tracking-[0.2em] text-primary" : "text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"}>
                  {p.name}
                </p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-serif text-4xl font-bold text-foreground">{p.price}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{p.sub}</p>
                <ul className="mt-6 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/80">
                      <CheckCircle2 className={p.highlight ? "h-4 w-4 text-primary shrink-0 mt-0.5" : "h-4 w-4 text-[hsl(var(--gold-deep))] shrink-0 mt-0.5"} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={
                    p.highlight
                      ? "mt-8 w-full h-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                      : "mt-8 w-full h-11 rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium"
                  }
                >
                  <Link to={p.to}>{p.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. TESTIMONIALS ─── */}
      <section className="bg-background section-rhythm">
        <div className="container">
          <div className="mb-14 text-center max-w-2xl mx-auto">
            <span className="section-eyebrow">Loved by readers</span>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              A publication readers <span className="text-primary">return to</span>.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="rounded-2xl bg-card border border-border p-7 shadow-card flex flex-col"
              >
                <Quote className="h-6 w-6 text-secondary" />
                <blockquote className="mt-4 text-foreground/90 leading-relaxed font-serif italic text-[17px]">
                  "{t.quote}"
                </blockquote>
                <figcaption className="mt-6 pt-5 border-t border-border flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-[hsl(var(--primary-glow))] grid place-items-center text-primary-foreground font-serif font-semibold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                  <div className="ml-auto flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-secondary text-secondary" />
                    ))}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 8. FAQ ─── */}
      <section className="bg-[hsl(var(--surface))] section-rhythm">
        <div className="container max-w-3xl">
          <div className="mb-10 text-center">
            <span className="section-eyebrow">Questions</span>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              Everything you'd want to <span className="text-primary">know</span>.
            </h2>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-2xl border border-border bg-card px-6 shadow-card"
              >
                <AccordionTrigger className="text-left font-serif text-base font-semibold hover:no-underline py-5">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ─── 9. LATEST ARTICLES ─── */}
      {latestPosts && latestPosts.length > 0 && (
        <section className="bg-background section-rhythm">
          <div className="container">
            <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <span className="section-eyebrow">Journal</span>
                <h2 className="mt-3 font-serif text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                  From our <span className="text-primary">editors</span>.
                </h2>
              </div>
              <Link
                to="/articles"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary link-underline"
              >
                All articles <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {latestPosts.map((p: any) => (
                <Link
                  key={p.id}
                  to={`/articles/${p.slug}`}
                  className="group rounded-2xl overflow-hidden bg-card border border-border transition-all hover:shadow-lift hover:-translate-y-1 hover:border-primary/20"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-muted">
                    {p.cover_url ? (
                      <img
                        src={p.cover_url}
                        alt={p.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-secondary/20 to-primary/10" />
                    )}
                  </div>
                  <div className="p-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--royal-blue))]">
                      {p.post_type || "Essay"}
                    </p>
                    <h3 className="mt-2 font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {p.title}
                    </h3>
                    {p.excerpt && (
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {p.excerpt}
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      Read more <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── 10. NEWSLETTER ─── */}
      <NewsletterCta />

      {/* Retain hidden FAQ strip for SEO structured data continuity if any consumer relies on it */}
      <div className="sr-only">
        <FaqStrip />
      </div>
    </Layout>
  );
};

export default Index;
