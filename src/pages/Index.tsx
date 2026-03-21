import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen, Heart, FileText, Sparkles, Users, Globe, BookMarked,
  Quote, ArrowRight, TrendingUp
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import useSEO from "@/hooks/useSEO";
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
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="font-serif text-4xl font-bold text-secondary md:text-5xl">
      {count.toLocaleString()}{suffix}
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
    title: "Dharmik Granth Online — Vishnu Sahasraname, Bhagwat Geeta, Ramayana | GyandootNova",
    description: "Buy spiritual books online — Vishnu Sahasraname, Bhagwat Geeta, Ramayana, Hanuman Chalisa & more dharmik granth at GyandootNova.",
    canonical: "/",
  });

  return (
    <Layout>
      {/* ─── 1. HERO ─── */}
      <section className="relative overflow-hidden bg-primary py-24 md:py-36">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 40%, hsl(45 97% 58%) 0%, transparent 50%), radial-gradient(circle at 80% 60%, hsl(0 82% 60%) 0%, transparent 50%)",
          }}
        />
        <div className="container relative text-center">
          <h1 className="font-serif text-4xl font-extrabold leading-tight text-primary-foreground md:text-6xl lg:text-7xl">
            Illuminate Your <span className="text-secondary">Spiritual Path</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-primary-foreground/75 md:text-xl">
            Discover sacred books, profound articles, and transformative programs crafted to awaken wisdom and deepen your inner journey.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="bg-primary-foreground text-primary font-semibold hover:bg-primary-foreground/90 shadow-lg px-8" asChild>
              <Link to="/books">
                <BookOpen className="mr-2 h-5 w-5" /> Explore Books
              </Link>
            </Button>
            <Button
              size="lg"
              className="bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/90 shadow-lg px-8"
              asChild
            >
              <Link to="/donate">
                <Heart className="mr-2 h-5 w-5" /> Support Us
              </Link>
            </Button>
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
                We are dedicated to preserving and sharing timeless spiritual wisdom through carefully curated books, insightful articles, and transformative discourse programs. Our mission is to make sacred knowledge accessible to every seeker, everywhere.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                From ancient scriptures to contemporary spiritual thought, explore a growing library designed to guide you on your path to self-realization and inner peace.
              </p>
              <Button variant="outline" className="mt-6 border-primary text-primary hover:bg-primary hover:text-primary-foreground" asChild>
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
                <div key={item.label} className="rounded-xl border border-border bg-card p-5 text-center transition-shadow hover:shadow-md">
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredBooks.map((book) => (
                <Link key={book.id} to={`/books/${book.slug}`}>
                  <Card className="group overflow-hidden border-border transition-all hover:shadow-lg hover:-translate-y-1">
                    <div className="aspect-[3/4] bg-muted flex items-center justify-center overflow-hidden">
                      {book.cover_url ? (
                        <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                      ) : (
                        <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-serif font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {book.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{book.author}</p>
                      <span
                        className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          book.is_free
                            ? "bg-green-100 text-green-700"
                            : "bg-secondary/20 text-secondary-foreground"
                        }`}
                      >
                        {book.is_free ? "Free" : `₹${book.price}`}
                      </span>
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
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" asChild>
              <Link to="/books">View All Books <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── 4. PROGRAMS / DISCOURSES ─── */}
      <section className="py-20">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-3xl font-bold md:text-4xl">Programs & Discourses</h2>
            <p className="mt-2 text-muted-foreground">Transformative sessions for spiritual growth</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { title: "Meditation Retreats", desc: "Guided meditation programs to help you find inner stillness and clarity of mind.", icon: Sparkles },
              { title: "Scripture Discourses", desc: "Deep dives into ancient spiritual texts, decoded for modern seekers.", icon: BookOpen },
              { title: "Spiritual Workshops", desc: "Interactive sessions on mindfulness, self-awareness, and personal transformation.", icon: TrendingUp },
            ].map((program) => (
              <Card key={program.title} className="group border-border p-6 transition-all hover:shadow-md hover:border-primary/30">
                <program.icon className="h-10 w-10 text-primary" />
                <h3 className="mt-4 font-serif text-lg font-semibold text-card-foreground">{program.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{program.desc}</p>
                <Link to="/articles" className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline">
                  Learn More <ArrowRight className="ml-1 h-3 w-3" />
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
                          Read More <ArrowRight className="ml-1 h-3 w-3" />
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
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" asChild>
              <Link to="/articles">View All Articles <ArrowRight className="ml-2 h-4 w-4" /></Link>
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
                <p className="mt-2 text-sm font-medium text-primary-foreground/70">{stat.label}</p>
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
              { quote: "These books have transformed my understanding of spirituality. Every page carries profound wisdom.", name: "Aarav S.", role: "Spiritual Seeker" },
              { quote: "The articles are beautifully written and deeply insightful. A treasure trove for anyone on the spiritual path.", name: "Priya M.", role: "Daily Reader" },
              { quote: "The meditation programs helped me find inner peace during the most challenging time of my life.", name: "Rajan K.", role: "Program Participant" },
            ].map((t) => (
              <Card key={t.name} className="border-border p-6">
                <Quote className="h-8 w-8 text-secondary" />
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed italic">"{t.quote}"</p>
                <div className="mt-5 border-t border-border pt-4">
                  <p className="font-serif font-semibold text-card-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 8. SUPPORT US CTA ─── */}
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
                Support Us
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-primary-foreground/75 leading-relaxed">
                Your generosity helps us publish and share spiritual knowledge with seekers worldwide. Every contribution makes a difference.
              </p>
              <Button
                size="lg"
                className="mt-8 bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/90 shadow-lg px-10"
                asChild
              >
                <Link to="/donate">Support Us <Heart className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
