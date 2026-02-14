import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Heart, FileText, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";

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

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary py-20 md:py-32">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, hsl(45 97% 58%) 0%, transparent 60%)" }} />
        <div className="container relative text-center">
          <h1 className="font-serif text-4xl font-bold text-primary-foreground md:text-6xl">
            GyandootNova
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80">
            Illuminate your spiritual path through sacred books, profound articles, and transformative programs.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/books"><BookOpen className="mr-2 h-5 w-5" /> Explore Books</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/donate"><Heart className="mr-2 h-5 w-5" /> Donate</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Books */}
      <section className="py-16">
        <div className="container">
          <div className="mb-8 text-center">
            <h2 className="font-serif text-3xl font-bold">Featured Books</h2>
            <p className="mt-2 text-muted-foreground">Handpicked spiritual literature for seekers</p>
          </div>
          {featuredBooks && featuredBooks.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredBooks.map((book) => (
                <Link key={book.id} to={`/books/${book.slug}`}>
                  <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
                    <div className="aspect-[3/4] bg-muted flex items-center justify-center">
                      {book.cover_url ? (
                        <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-serif font-semibold group-hover:text-primary transition-colors line-clamp-1">{book.title}</h3>
                      <p className="text-sm text-muted-foreground">{book.author}</p>
                      <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${book.is_free ? "bg-green-100 text-green-700" : "bg-secondary/20 text-secondary-foreground"}`}>
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
          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link to="/books">View All Books</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      <section className="bg-muted/30 py-16">
        <div className="container">
          <div className="mb-8 text-center">
            <h2 className="font-serif text-3xl font-bold">Latest Articles & Programs</h2>
            <p className="mt-2 text-muted-foreground">Insights and wisdom for daily life</p>
          </div>
          {latestPosts && latestPosts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {latestPosts.map((post) => (
                <Link key={post.id} to={`/articles/${post.slug}`}>
                  <Card className="group h-full transition-shadow hover:shadow-lg">
                    {post.cover_url && (
                      <div className="aspect-video overflow-hidden">
                        <img src={post.cover_url} alt={post.title} className="h-full w-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <CardContent className="p-5">
                      <span className="text-xs font-medium uppercase tracking-wider text-primary">{post.post_type}</span>
                      <h3 className="mt-1 font-serif text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
                      {post.excerpt && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-muted-foreground">Articles coming soon.</p>
            </div>
          )}
          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link to="/articles">View All Articles</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Donation CTA */}
      <section className="py-16">
        <div className="container">
          <div className="rounded-2xl bg-primary p-8 text-center md:p-12">
            <Heart className="mx-auto h-10 w-10 text-secondary" />
            <h2 className="mt-4 font-serif text-3xl font-bold text-primary-foreground">Support Our Mission</h2>
            <p className="mx-auto mt-3 max-w-lg text-primary-foreground/80">
              Your generosity helps us publish and share spiritual knowledge with seekers worldwide.
            </p>
            <Button size="lg" variant="secondary" className="mt-6" asChild>
              <Link to="/donate">Donate Now</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
