import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  Heart,
  FileText,
  Sparkles,
  Users,
  Globe,
  BookMarked,
  Quote,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Infinity as InfinityIcon,
  RefreshCw,
  Lock,
  CheckCircle2,
  Star,
  XCircle,
  Smartphone,
  HardDrive,
  FileWarning,
  Unlock,
  Ban,
  Cloud,
  Gift,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import useSEO from "@/hooks/useSEO";
import LiveReaderStrip from "@/components/LiveReaderStrip";
import RecentPurchasesToast from "@/components/RecentPurchasesToast";
import CompareSection from "@/components/CompareSection";
import GuaranteeSection from "@/components/GuaranteeSection";
import FaqStrip from "@/components/FaqStrip";
import NewsletterCta from "@/components/NewsletterCta";
import { useEffect, useRef, useState } from "react";

/* ─── Animated Counter ─── */
const AnimatedCounter = ({ target, suffix = "" }: { target: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let current = 0;
          const step = Math.ceil(target / 40);
          const timer = setInterval(() => {
            current += step;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            setCount(current);
          }, 30);
        }
      },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="font-serif text-4xl font-bold text-secondary md:text-5xl">
      {count.toLocaleString()}
      {suffix}
    </div>
  );
};

/* ─── Main Page ─── */
const Index = () => {
  const { data: featuredBooks } = useQuery({
    queryKey: ["featured-books"],
    queryFn: async () => {
      const { data } = await supabase
        .from("books")
        .select("id, title, slug, author, cover_url, price, is_free")
        .eq("is_featured", true)
        .limit(5);
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
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  useSEO({
    title: "GyandootNova (Gyandoot Nova) — Gita, Vedas, Ramayana Online",
    description:
      "GyandootNova (Gyandoot Nova) — Bhagwat Geeta Hindi PDF, Geeta shlok, Vedas, Upanishads, Ramayana aur Hindu religious books online padhein. Dhyan kaise kare, meditation ke fayde aur spiritual gyan Hindi mein — Gyandoot Nova par.",
    canonical: "/",
    ogImage: "https://gyandootnova.in/og-image.png",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": "https://gyandootnova.in/#website",
          "url": "https://gyandootnova.in/",
          "name": "GyandootNova",
          "alternateName": ["Gyandoot Nova", "Gyandoot", "Gyan Doot", "gyandootnova.in"],
          "inLanguage": "hi-IN",
          "description":
            "GyandootNova (Gyandoot Nova) — dharmik granth online padhein: Geeta, Ramayana, Hanuman Chalisa aur 50+ spiritual books Hindi mein.",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://gyandootnova.in/books?search={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        },
        {
          "@type": "Organization",
          "@id": "https://gyandootnova.in/#organization",
          "name": "GyandootNova",
          "alternateName": ["Gyandoot Nova", "Gyandoot", "Gyan Doot"],
          "url": "https://gyandootnova.in/",
          "logo": "https://gyandootnova.in/gyandoot-nova-icon.ico",
        },
        ...((featuredBooks ?? []).length > 0
          ? [{
              "@type": "ItemList",
              "name": "Featured Dharmik Granth",
              "itemListElement": (featuredBooks ?? []).map((b, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "url": `https://gyandootnova.in/books/${b.slug}`,
                "name": b.title,
              })),
            }]
          : []),
      ],
    },
  });


  return (
    <Layout>
      <LiveReaderStrip />
      <RecentPurchasesToast />
      {/* ─── 1. HERO (C.1) ─── */}
      <section className="relative overflow-hidden bg-primary py-14 md:py-20">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 40%, hsl(45 97% 58%) 0%, transparent 50%), radial-gradient(circle at 80% 60%, hsl(0 82% 60%) 0%, transparent 50%)",
          }}
        />
        <div className="container relative text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/20 px-4 py-1.5 text-xs font-semibold text-secondary mb-5">
            <Star className="h-3.5 w-3.5 fill-secondary" /> Trusted by 24,000+ readers worldwide
          </div>
          <h1 className="font-serif text-3xl font-extrabold leading-tight text-primary-foreground md:text-5xl lg:text-6xl">
            Ancient Indian Scriptures, Online —{" "}
            <span className="text-secondary">Bhagavad Gita, Ramayana, Hanuman Chalisa</span>
            <br className="hidden md:block" /> in Clear English & Hindi
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/90 md:text-lg">
            50+ sacred texts in one library. Start reading free, or{" "}
            <strong className="text-secondary">unlock premium editions for lifetime access to timeless wisdom.</strong>
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="bg-secondary text-secondary-foreground font-bold hover:bg-secondary/90 shadow-xl px-8 text-base"
              asChild
            >
              <Link to="/books?filter=free">
                <BookOpen className="mr-2 h-5 w-5" /> Start Reading Free →
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 font-semibold px-8"
              asChild
            >
              <Link to="/books?filter=paid">
                Explore Premium Editions
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs md:text-sm text-primary-foreground/80">
            <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-secondary" /> Private & Secure</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-secondary" /> 7-day full refund guarantee</span>
            <span className="inline-flex items-center gap-1.5"><InfinityIcon className="h-3.5 w-3.5 text-secondary" /> Lifetime access, read forever</span>
            <span className="inline-flex items-center gap-1.5"><RefreshCw className="h-3.5 w-3.5 text-secondary" /> Free updates & new editions</span>
          </div>

        </div>
      </section>

      {/* ─── 1.1 TRUST SECTION (C.2) ─── */}
      <section className="border-b border-border bg-background py-10 md:py-14">
        <div className="container max-w-5xl text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold">
            Why <span className="text-primary">Thousands of Readers</span> Trust GyandootNova
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm md:text-base text-muted-foreground leading-relaxed">
            Every scripture is translated from original Sanskrit into clear English and Hindi, curated by scholars. No hidden charges, no app downloads — read instantly in your browser.
          </p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { icon: Lock, label: "Safe & Secure Payments" },
              { icon: CheckCircle2, label: "Scholar-verified content" },
              { icon: BookOpen, label: "Read on any device" },
              { icon: ShieldCheck, label: "7-day refund guarantee" },
            ].map((b) => (
              <div
                key={b.label}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center shadow-sm"
              >
                <b.icon className="h-6 w-6 text-primary" />
                <span className="text-xs md:text-sm font-semibold text-card-foreground leading-tight">
                  {b.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ─── 1.5. WHY NO DOWNLOAD — Objection → Trust ─── */}
      <section className="bg-muted/40 py-14">
        <div className="container max-w-5xl">
          <div className="text-center mb-10">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
              Designed with care
            </span>
            <h2 className="mt-3 font-serif text-2xl md:text-3xl font-bold">
              Why we don't hand out PDFs? <span className="text-primary">For your peace of mind.</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">The old e-book headaches are a thing of the past.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
              <h3 className="font-semibold text-destructive mb-3 flex items-center gap-2">
                <XCircle className="h-5 w-5" /> The old PDF world
              </h3>
              <ul className="space-y-2 text-sm text-foreground/80">
                {[
                  { Icon: Smartphone, text: "Phone lost — your whole library gone with it" },
                  { Icon: HardDrive, text: "GBs fill up, new apps can't be installed" },
                  { Icon: FileWarning, text: "Text breaks, pages refuse to open" },
                  { Icon: Unlock, text: "Anyone can forward it on WhatsApp" },
                  { Icon: Ban, text: "Fixes and updates never reach you" },
                ].map(({ Icon, text }) => (
                  <li key={text} className="flex items-start gap-2">
                    <Icon className="h-4 w-4 mt-0.5 text-destructive/70 shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 shadow-md">
              <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" /> The GyandootNova way
              </h3>
              <ul className="space-y-2 text-sm text-foreground/90 font-medium">
                {[
                  { Icon: Lock, text: "One ID — your library on every device" },
                  { Icon: Cloud, text: "Zero bytes taken from your phone's memory" },
                  { Icon: BookOpen, text: "Always crisp, HD and easy to read" },
                  { Icon: ShieldCheck, text: "For your eyes only — nobody else's" },
                  { Icon: Gift, text: "Every author update reaches you, free" },
                ].map(({ Icon, text }) => (
                  <li key={text} className="flex items-start gap-2">
                    <Icon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </section>


      {/* ─── 2. ABOUT ─── */}
      <section className="py-20">
        <div className="container">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="font-serif text-3xl font-bold md:text-4xl">
                Where scriptures meet <span className="text-primary">curious minds</span>
              </h2>
              <div className="mt-3 h-1 w-16 rounded-full bg-primary" />
              <p className="mt-6 text-muted-foreground leading-relaxed">
                GyandootNova is a small effort to bring the sacred texts once locked in
                grandmothers' cupboards back into your hands. We track down old manuscripts,
                work with Sanskrit scholars, and deliver them to you in language that
                actually reads well today.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Reading a scripture shouldn't feel like homework. Our reader is designed
                so a five-minute break is enough for a shloka and its meaning to land.
              </p>
              <Button
                variant="outline"
                className="mt-6 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                asChild
              >
                <Link to="/articles">
                  Read Our Articles <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: BookMarked, label: "Ancient Scriptures", desc: "Original text, verified translations" },
                { icon: FileText, label: "Life-Sutra Articles", desc: "Today's questions, timeless answers" },
                { icon: Users, label: "Global Community", desc: "Readers from across the world" },
                { icon: Globe, label: "Anywhere You Are", desc: "Wherever there's internet, your library follows" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-border bg-card p-5 text-center transition-shadow hover:shadow-md"
                >
                  <item.icon className="mx-auto h-8 w-8 text-primary" />
                  <h3 className="mt-3 font-serif font-semibold text-card-foreground">{item.label}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ─── 3. FEATURED BOOKS ─── */}
      <section className="bg-muted/40 py-20">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-3xl font-bold md:text-4xl">Readers' Favourites</h2>
            <p className="mt-2 text-muted-foreground">The most-read and most-loved editions in our library</p>

          </div>
          {featuredBooks && featuredBooks.length > 0 ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {featuredBooks.map((book) => (
                <Link key={book.id} to={`/books/${book.slug}`} className="group">
                  <Card className="overflow-hidden border-border transition-all hover:shadow-xl hover:-translate-y-1 h-full flex flex-col relative">
                    <div className="absolute top-2 left-2 z-10">
                      {book.is_free ? (
                        <span className="inline-block rounded-md bg-green-600 text-white px-2 py-0.5 text-[10px] font-bold shadow">FREE</span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-secondary text-secondary-foreground px-2 py-0.5 text-[10px] font-bold shadow"><Star className="h-2.5 w-2.5 fill-current" /> BESTSELLER</span>
                      )}
                    </div>
                    {!book.is_free && (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="inline-block rounded-md bg-primary/95 text-primary-foreground px-2 py-0.5 text-[10px] font-bold shadow">LIFETIME</span>
                      </div>
                    )}
                    <div className="aspect-[3/4] bg-muted flex items-center justify-center overflow-hidden">
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt={book.title}
                          width={300}
                          height={400}
                          decoding="async"
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />

                      ) : (
                        <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                      )}
                    </div>
                    <CardContent className="p-3 md:p-4 flex flex-col flex-1">
                      <h3 className="font-serif font-semibold text-[15px] leading-snug text-card-foreground group-hover:text-primary transition-colors line-clamp-2 min-h-[2.6rem]">
                        {book.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{book.author}</p>
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Star className="h-3 w-3 fill-secondary text-secondary" />
                        <span className="font-medium text-foreground">4.8</span>
                        <span>• Verified</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        {book.is_free ? (
                          <span className="text-base font-bold text-green-700">₹0</span>
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-bold text-primary">₹{book.price}</span>
                            <span className="text-[10px] text-muted-foreground line-through">₹{Math.round((book.price as number) * 2.5)}</span>
                          </div>
                        )}
                        <span className="text-[11px] font-bold text-primary group-hover:underline">
                          {book.is_free ? "Read →" : "Buy Now →"}
                        </span>

                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Sparkles className="mx-auto h-10 w-10 text-secondary" />
              <p className="mt-3 text-muted-foreground">Books coming soon. Stay tuned!</p>
            </div>
          )}
          <div className="mt-10 text-center">
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              asChild
            >
              <Link to="/books">
                Browse the Full Library <ArrowRight className="ml-2 h-4 w-4" />

              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── 3.5. COMPARE — printed vs PDF vs us ─── */}
      <CompareSection />

      {/* ─── 4. PROGRAMS / DISCOURSES ─── */}
      <section className="py-20">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-3xl font-bold md:text-4xl">Programs & Discourses</h2>
            <p className="mt-2 text-muted-foreground">Beyond reading — a chance to listen and experience</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Silence Retreat",
                desc: "Give a tired mind a few days of rest — breath, meditation and a simple practice for turning inward.",
                icon: Sparkles,
              },
              {
                title: "Shloka Discourse",
                desc: "Short sessions on chosen sutras from the Upanishads and the Gita — one verse, one direction for life.",
                icon: BookOpen,
              },
              {
                title: "Self-Awakening Workshop",
                desc: "How the scriptures help with everyday knots — conversation, practice and real experience.",
                icon: TrendingUp,
              },

            ].map((program) => (
              <Card
                key={program.title}
                className="group border-border p-6 transition-all hover:shadow-md hover:border-primary/30"
              >
                <program.icon className="h-10 w-10 text-primary" />
                <h3 className="mt-4 font-serif text-lg font-semibold text-card-foreground">{program.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{program.desc}</p>
                <Link
                  to="/articles"
                  className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline"
                >
                  View details <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. BLOG / ARTICLES ─── */}
      <section className="bg-muted/30 py-20">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-3xl font-bold md:text-4xl">नई सोच, नए लेख</h2>
            <p className="mt-2 text-muted-foreground">रोज़मर्रा के सवालों पर शास्त्रों की सरल राय</p>

          </div>
          {latestPosts && latestPosts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {latestPosts.map((post) => (
                <Link key={post.id} to={`/articles/${post.slug}`}>
                  <article>
                    <Card className="group h-full border-border transition-all hover:shadow-lg hover:-translate-y-1">
                      {post.cover_url && (
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={post.cover_url}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <CardContent className="p-5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                          {post.post_type}
                        </span>
                        <h3 className="mt-1.5 font-serif text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                        )}
                        <span className="mt-3 inline-flex items-center text-sm font-medium text-primary">
                          पूरा लेख पढ़िए <ArrowRight className="ml-1 h-3 w-3" />

                        </span>
                      </CardContent>
                    </Card>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-muted-foreground">जल्द ही नए लेख आ रहे हैं।</p>
            </div>
          )}
          <div className="mt-10 text-center">
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              asChild
            >
              <Link to="/articles">
                सारे लेख देखिए <ArrowRight className="ml-2 h-4 w-4" />

              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── 6. IMPACT / STATS ─── */}
      <section className="bg-primary py-16">
        <div className="container">
          <div className="grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
            {[
              { target: 500, suffix: "+", label: "प्रकाशित ग्रंथ" },
              { target: 10000, suffix: "+", label: "जुड़े हुए पाठक" },
              { target: 200, suffix: "+", label: "लेख और सूत्र" },
              { target: 50, suffix: "+", label: "सत्संग-कार्यक्रम" },

            ].map((stat) => (
              <div key={stat.label}>
                <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                <p className="mt-2 text-sm font-medium text-primary-foreground/90">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. TESTIMONIALS ─── */}
      <section className="py-20">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-3xl font-bold md:text-4xl">In Our Readers' Own Words</h2>
            <p className="mt-2 text-muted-foreground">Hear from the people who actually read here every day</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                quote: "One chapter of the Gita on my metro ride home — that's all I do, and the noise in my head is already half gone. Knowing the book is always with me is the best part.",
                name: "Anil Tiwari",
                role: "Software Engineer, Bengaluru",
                rating: 5,
              },
              {
                quote: "At first I worried — no download, how will this work? Then I logged in on my new phone and everything was exactly where I left it. Genuinely effortless.",
                name: "Seema Agarwal",
                role: "Teacher & Homemaker, Indore",
                rating: 5,
              },
              {
                quote: "My father struggled to read fine print. We enlarged the font, turned on night mode, and now he reads the Hanuman Chalisa for half an hour every evening. Thank you to this team.",
                name: "Gaurav Mishra",
                role: "Business Owner, Varanasi",
                rating: 5,
              },

            ].map((t) => (
              <Card key={t.name} className="border-border p-6 relative">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                  ))}
                </div>
                <Quote className="h-6 w-6 text-secondary/40" />
                <p className="mt-3 text-sm text-foreground/85 leading-relaxed">"{t.quote}"</p>
                <div className="mt-5 border-t border-border pt-4 flex items-center justify-between">
                  <div>
                    <p className="font-serif font-semibold text-card-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verified Reader
                  </span>

                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7.5. GUARANTEE / TRUST ─── */}
      <GuaranteeSection />

      {/* ─── 7.7. FAQ STRIP ─── */}
      <FaqStrip />

      {/* ─── 7.9. NEWSLETTER ─── */}
      <NewsletterCta />

      {/* ─── 8. SEO CONTENT — KEYWORD-RICH ─── */}
      <section className="py-20">
        <div className="container max-w-4xl">
          <h2 className="font-serif text-3xl font-bold md:text-4xl text-center">
            Dharmik Granth Online — Buy Spiritual Books at GyandootNova
          </h2>
          <div className="mt-3 mx-auto h-1 w-16 rounded-full bg-primary" />
          <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed">
            <p>
              GyandootNova is India's trusted online platform for{" "}
              <strong className="text-foreground">dharmik granth</strong>, sacred spiritual books, and religious
              literature. Whether you are looking for a{" "}
              <strong className="text-foreground">Vishnu Sahasraname book</strong> with meaning in Hindi and English,
              the complete <strong className="text-foreground">Bhagwat Geeta in Hindi</strong>, or the timeless{" "}
              <strong className="text-foreground">Ramayana book</strong> — we have an ever-growing library of authentic
              spiritual texts available to read online instantly.
            </p>
            <p>
              Our collection includes beloved titles such as{" "}
              <strong className="text-foreground">Hanuman Chalisa book</strong>,{" "}
              <strong className="text-foreground">Mahabharat in Hindi</strong>,{" "}
              <strong className="text-foreground">Sundarkand path book</strong>,{" "}
              <strong className="text-foreground">Vishnu Purana</strong>,{" "}
              <strong className="text-foreground">Shrimad Bhagwatam</strong>, and{" "}
              <strong className="text-foreground">Chalisa Sangrah</strong>. Every book is published with care,
              preserving the sanctity of the original Sanskrit shlokas while providing clear Hindi and English
              translations for modern readers.
            </p>

            <h3 className="font-serif text-xl font-semibold text-foreground pt-2">
              Why Choose GyandootNova for Spiritual Books?
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-foreground">Read Online Instantly</strong> — No downloads required. Our
                distraction-free reader supports dark mode, font resizing, bookmarks, and reading progress tracking.
              </li>
              <li>
                <strong className="text-foreground">Authentic & Verified Content</strong> — Every text is carefully
                curated from trusted spiritual sources and ancient manuscripts.
              </li>
              <li>
                <strong className="text-foreground">Free & Premium Books</strong> — Many dharmik granth are completely
                free. Premium books start at just ₹99.
              </li>
              <li>
                <strong className="text-foreground">Secure Payments</strong> — Pay safely via Razorpay (India) or PayPal
                (international). UPI, cards, and net banking accepted.
              </li>
              <li>
                <strong className="text-foreground">Available Worldwide</strong> — Readers from India, USA, UK, Canada,
                Australia, and Japan access our books daily.
              </li>
            </ul>

            <h3 className="font-serif text-xl font-semibold text-foreground pt-2">
              Popular Dharmik Books on GyandootNova
            </h3>
            <p>
              Our most-read books include the{" "}
              <strong className="text-foreground">Vishnu Sahasraname with meaning in English</strong> — a complete guide
              to the 1000 divine names of Lord Vishnu, the{" "}
              <strong className="text-foreground">Bhagavad Gita simplified</strong> for daily guidance, and the{" "}
              <strong className="text-foreground">Ramayana in Hindi</strong> narrating the divine journey of Shri Ram.
              We also feature <strong className="text-foreground">stotra sangrah</strong>,{" "}
              <strong className="text-foreground">aarti sangrah</strong>, and mantra collections for daily pooja.
            </p>

            <h3 className="font-serif text-xl font-semibold text-foreground pt-2">Spiritual Articles & Insights</h3>
            <p>
              Beyond books, GyandootNova publishes insightful articles on meditation techniques, the significance of{" "}
              <strong className="text-foreground">Sanskrit shlokas</strong>, guides to performing{" "}
              <strong className="text-foreground">Ramayana path at home</strong>, deep dives into Geeta's 18 chapters,
              and the spiritual meaning behind Hindu festivals. Our content helps seekers worldwide deepen their
              understanding of Sanatan Dharma.
            </p>

            <h3 className="font-serif text-xl font-semibold text-foreground pt-2">How to Buy Hindu Books Online</h3>
            <p>
              Buying <strong className="text-foreground">Hindu books online</strong> at GyandootNova is simple: browse
              our{" "}
              <Link to="/books" className="text-primary hover:underline font-medium">
                Books Library
              </Link>
              , select a title, and start reading — free books open instantly. For premium titles, complete a quick
              secure payment and the full book unlocks in your account forever. No subscription needed. Have questions?
              Visit our{" "}
              <Link to="/faq" className="text-primary hover:underline font-medium">
                FAQ
              </Link>{" "}
              or{" "}
              <Link to="/contact" className="text-primary hover:underline font-medium">
                Contact Us
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ─── 9. SUPPORT US CTA ─── */}
      <section className="py-20">
        <div className="container">
          <div className="rounded-2xl bg-primary p-10 text-center md:p-16 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: "radial-gradient(circle at 70% 30%, hsl(45 97% 58%) 0%, transparent 50%)",
              }}
            />
            <div className="relative">
              <Heart className="mx-auto h-12 w-12 text-secondary" />
              <h2 className="mt-5 font-serif text-3xl font-bold text-primary-foreground md:text-4xl">
                एक छोटा हाथ, बहुत बड़ी सेवा
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-primary-foreground/90 leading-relaxed">
                आपका एक-एक योगदान किसी छूट रहे ग्रंथ को फिर से जीवित करता है, किसी नए पाठक तक
                पहुँचाता है। इस यज्ञ में साथ जुड़िए — जितना बन पड़े, उतना दीजिए।
              </p>
              <Button
                size="lg"
                className="mt-8 bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/90 shadow-lg px-10"
                asChild
              >
                <Link to="/support-us">
                  सहयोग दीजिए <Heart className="ml-2 h-4 w-4" />

                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
