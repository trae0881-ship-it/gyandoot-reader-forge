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
        .limit(4);
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
    title: "Dharmik Granth Online — Geeta, Ramayana | GyandootNova",
    description:
      "Dharmik granth online padhein — Vishnu Sahasraname, Bhagwat Geeta, Ramayana, Hanuman Chalisa aur anek spiritual books Hindi mein. GyandootNova par padhein.",
    canonical: "/",
    ogImage: "https://gyandootnova.in/og-image.png",
  });

  return (
    <Layout>
      <LiveReaderStrip />
      <RecentPurchasesToast />
      {/* ─── 1. HERO ─── */}
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
            <Star className="h-3.5 w-3.5 fill-secondary" /> 4.8/5 • 24,000+ संतुष्ट पाठक
          </div>
          <h1 className="font-serif text-3xl font-extrabold leading-tight text-primary-foreground md:text-5xl lg:text-6xl">
            अधूरे ज्ञान को छोड़िए — <span className="text-secondary">200,000+ प्रामाणिक ग्रंथ</span>,
            <br className="hidden md:block" /> एक बार खरीदिए, <span className="underline decoration-secondary decoration-4 underline-offset-4">जीवनभर पढ़िए।</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/90 md:text-lg">
            मोबाइल, टैबलेट, लैपटॉप — कहीं भी, कभी भी। पन्ने टूटेंगे नहीं, खोएंगे नहीं, चोरी नहीं होंगे।
            <strong className="text-secondary"> आपकी अपनी डिजिटल आध्यात्मिक लाइब्रेरी।</strong>
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="bg-secondary text-secondary-foreground font-bold hover:bg-secondary/90 shadow-xl px-8 text-base"
              asChild
            >
              <Link to="/books">
                <BookOpen className="mr-2 h-5 w-5" /> ₹49 से पढ़ना शुरू करें →
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 font-semibold px-8"
              asChild
            >
              <Link to="/books?filter=free">
                पहला अध्याय मुफ़्त पढ़ें
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs md:text-sm text-primary-foreground/80">
            <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-secondary" /> सुरक्षित पढ़ाई</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-secondary" /> 7-दिन पैसा वापसी</span>
            <span className="inline-flex items-center gap-1.5"><InfinityIcon className="h-3.5 w-3.5 text-secondary" /> जीवनभर access</span>
            <span className="inline-flex items-center gap-1.5"><RefreshCw className="h-3.5 w-3.5 text-secondary" /> Free updates</span>
          </div>
        </div>
      </section>

      {/* ─── 1.5. WHY NO DOWNLOAD — Objection → Trust ─── */}
      <section className="bg-muted/40 py-14">
        <div className="container max-w-5xl">
          <div className="text-center mb-10">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
              आपके फ़ायदे के लिए
            </span>
            <h2 className="mt-3 font-serif text-2xl md:text-3xl font-bold">
              PDF download क्यों नहीं? <span className="text-primary">क्योंकि यह आपके लिए बेहतर है।</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">हमने वो problem solve किया है जो हर e-book का है।</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
              <h3 className="font-semibold text-destructive mb-3 flex items-center gap-2">❌ साधारण PDF Download</h3>
              <ul className="space-y-2 text-sm text-foreground/80">
                <li>📵 फ़ोन बदला/खोया → फ़ाइल गई</li>
                <li>💾 Storage भरता है</li>
                <li>📑 पन्ने corrupt, format टूटता है</li>
                <li>🔓 चोरी / forward का डर</li>
                <li>🚫 कोई update नहीं मिलता</li>
              </ul>
            </div>
            <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 shadow-md">
              <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">✅ GyandootNova Lifetime Reader</h3>
              <ul className="space-y-2 text-sm text-foreground/90 font-medium">
                <li>🔐 एक login = हमेशा available</li>
                <li>☁️ 0 MB आपके device पर</li>
                <li>📖 हमेशा HD, हमेशा clean</li>
                <li>🛡️ सिर्फ़ आप पढ़ सकते हैं</li>
                <li>🎁 Author updates <strong>मुफ़्त lifetime</strong></li>
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
                A Platform for <span className="text-primary">Spiritual Seekers</span>
              </h2>
              <div className="mt-3 h-1 w-16 rounded-full bg-primary" />
              <p className="mt-6 text-muted-foreground leading-relaxed">
                We are dedicated to preserving and sharing timeless spiritual wisdom through carefully curated books,
                insightful articles, and transformative discourse programs. Our mission is to make sacred knowledge
                accessible to every seeker, everywhere.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                From ancient scriptures to contemporary spiritual thought, explore a growing library designed to guide
                you on your path to self-realization and inner peace.
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
                { icon: BookMarked, label: "Sacred Books", desc: "Curated spiritual literature" },
                { icon: FileText, label: "Articles", desc: "Insights for daily life" },
                { icon: Users, label: "Community", desc: "Global seekers network" },
                { icon: Globe, label: "Accessible", desc: "Read anywhere, anytime" },
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
            <h2 className="font-serif text-3xl font-bold md:text-4xl">Featured Books</h2>
            <p className="mt-2 text-muted-foreground">Handpicked spiritual literature for seekers</p>
          </div>
          {featuredBooks && featuredBooks.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredBooks.map((book) => (
                <Link key={book.id} to={`/books/${book.slug}`} className="group">
                  <Card className="overflow-hidden border-border transition-all hover:shadow-xl hover:-translate-y-1 h-full flex flex-col relative">
                    <div className="absolute top-2 left-2 z-10">
                      {book.is_free ? (
                        <span className="inline-block rounded-md bg-green-600 text-white px-2 py-0.5 text-[10px] font-bold shadow">FREE</span>
                      ) : (
                        <span className="inline-block rounded-md bg-secondary text-secondary-foreground px-2 py-0.5 text-[10px] font-bold shadow">⭐ BESTSELLER</span>
                      )}
                    </div>
                    {!book.is_free && (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="inline-block rounded-md bg-primary/95 text-primary-foreground px-2 py-0.5 text-[10px] font-bold shadow">जीवनभर</span>
                      </div>
                    )}
                    <div className="aspect-[3/4] bg-muted flex items-center justify-center overflow-hidden">
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt={book.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
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
                          {book.is_free ? "पढ़ें →" : "Unlock →"}
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
                View All Books <ArrowRight className="ml-2 h-4 w-4" />
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
            <p className="mt-2 text-muted-foreground">Transformative sessions for spiritual growth</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Meditation Retreats",
                desc: "Guided meditation programs to help you find inner stillness and clarity of mind.",
                icon: Sparkles,
              },
              {
                title: "Scripture Discourses",
                desc: "Deep dives into ancient spiritual texts, decoded for modern seekers.",
                icon: BookOpen,
              },
              {
                title: "Spiritual Workshops",
                desc: "Interactive sessions on mindfulness, self-awareness, and personal transformation.",
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
                  View {program.title} details <ArrowRight className="ml-1 h-3 w-3" />
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
            <h2 className="font-serif text-3xl font-bold md:text-4xl">Latest Articles & Insights</h2>
            <p className="mt-2 text-muted-foreground">Wisdom for daily life from spiritual traditions</p>
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
                          Read full article <ArrowRight className="ml-1 h-3 w-3" />
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
              <p className="mt-3 text-muted-foreground">Articles coming soon.</p>
            </div>
          )}
          <div className="mt-10 text-center">
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              asChild
            >
              <Link to="/articles">
                View All Articles <ArrowRight className="ml-2 h-4 w-4" />
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
              { target: 500, suffix: "+", label: "Books Published" },
              { target: 10000, suffix: "+", label: "Readers Worldwide" },
              { target: 200, suffix: "+", label: "Articles Written" },
              { target: 50, suffix: "+", label: "Programs Hosted" },
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
            <h2 className="font-serif text-3xl font-bold md:text-4xl">What Readers Say</h2>
            <p className="mt-2 text-muted-foreground">Voices from our community of seekers</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                quote: "मैं रोज़ सुबह 20 मिनट गीता पढ़ता हूँ। 3 महीने में जीवन का नज़रिया ही बदल गया। एक बार खरीदी, अब हमेशा मेरे साथ है।",
                name: "राजेश शर्मा",
                role: "जयपुर, राजस्थान",
                rating: 5,
              },
              {
                quote: "PDF download नहीं होती ये पहले अजीब लगा, लेकिन अब समझ आया — मेरा फ़ोन बदला फिर भी सारी books वहीं की वहीं। बहुत smart system है।",
                name: "प्रिया मिश्रा",
                role: "लखनऊ, उत्तर प्रदेश",
                rating: 5,
              },
              {
                quote: "Sundarkand और हनुमान चालीसा रोज़ पढ़ता हूँ। Dark mode से रात को आँख नहीं दुखती। एक ही जगह सारे ग्रंथ — पैसा वसूल।",
                name: "राजन कुमार",
                role: "पटना, बिहार",
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
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

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
                Support Our Mission
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-primary-foreground/90 leading-relaxed">
                Your generosity helps us publish and share spiritual knowledge with seekers worldwide. Every
                contribution makes a difference in preserving dharmik granth for future generations.
              </p>
              <Button
                size="lg"
                className="mt-8 bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/90 shadow-lg px-10"
                asChild
              >
                <Link to="/support-us">
                  Support Us <Heart className="ml-2 h-4 w-4" />
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
