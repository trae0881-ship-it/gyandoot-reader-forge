import { Link, useLocation } from "react-router-dom";
import { BookOpen, ArrowRight, Trash2, LogIn, Lock, Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import useSEO from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { useContinueReading } from "@/components/ContinueReadingSection";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { SITE } from "@/lib/jsonLd";

const Library = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data, isLoading } = useContinueReading(50);

  useSEO({
    title: "My Library — Continue Reading | GyandootNova",
    description:
      "Your personal library on GyandootNova — resume any book from your last saved chapter across every device.",
    canonical: "/library",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "GyandootNova", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "My Library", item: `${SITE}/library` },
      ],
    },
  });

  const removeEntry = async (book_id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("reading_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("book_id", book_id);
    if (error) {
      toast({ title: "Could not remove", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Removed from your library" });
    queryClient.invalidateQueries({ queryKey: ["continue-reading"] });
  };

  const signInHref = `/auth?redirect=${encodeURIComponent(location.pathname)}`;


  return (
    <Layout>
      <section className="border-b border-border/60 bg-gradient-cream">
        <div className="container max-w-5xl px-4 py-14 md:py-20">
          <nav aria-label="Breadcrumb" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link to="/" className="hover:text-primary">GyandootNova</Link></li>
              <li aria-hidden className="opacity-60">/</li>
              <li aria-current="page" className="text-foreground/70">My Library</li>
            </ol>
          </nav>
          <div className="mt-6 flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Aapki Path-yatra · Your library
              </h1>
              <p className="mt-2 text-muted-foreground max-w-2xl">
                Recently opened books, each ready to resume from your last saved chapter.
                Progress syncs across every device you sign in on.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container max-w-5xl px-4">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : !user ? (
            <div
              role="region"
              aria-label="Sign in required"
              data-testid="library-guest"
              className="surface-card p-12 md:p-16 text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="font-serif text-2xl md:text-3xl">Sign in to view your library</h2>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                Apni Path-yatra ka record dekhne ke liye sign in karein. Your saved chapters,
                reading progress and library are private to your account.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg">
                  <Link to={signInHref}>
                    <LogIn className="mr-2 h-4 w-4" /> Sign in to view
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/books">Browse books instead</Link>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                New here?{" "}
                <Link to={signInHref} className="text-primary underline underline-offset-2">
                  Create a free account
                </Link>{" "}
                — it takes under a minute.
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading your library…
            </div>
          ) : !data || data.length === 0 ? (
            <div
              data-testid="library-empty"
              className="surface-card p-12 md:p-16 text-center"
            >
              <BookOpen className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-4 font-serif text-2xl">Aapki library abhi khali hai</h2>
              <p className="mt-2 text-muted-foreground">
                Your library is empty — once you open a book, we'll bookmark your place here.
              </p>
              <Button asChild className="mt-6">
                <Link to="/books">Browse books <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
            </div>

          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {data.map((row) => {
                if (!row.books) return null;
                const chapterSlug = row.book_chapters?.slug;
                const href = chapterSlug
                  ? `/books/${row.books.slug}/${chapterSlug}`
                  : `/books/${row.books.slug}`;
                const percent = Math.max(
                  0,
                  Math.min(100, Math.round(Number(row.scroll_percent) || 0)),
                );
                const updated = new Date(row.updated_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                return (
                  <li key={row.book_id} className="surface-card p-4 flex gap-4">
                    <div className="h-28 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                      {row.books.cover_url ? (
                        <img
                          src={row.books.cover_url}
                          alt={row.books.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-primary/40">
                          <BookOpen className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 font-semibold text-foreground">
                            <Link to={`/books/${row.books.slug}`} className="hover:text-primary">
                              {row.books.title}
                            </Link>
                          </h3>
                          {row.books.author && (
                            <p className="mt-0.5 text-xs text-muted-foreground truncate">
                              {row.books.author}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeEntry(row.book_id)}
                          aria-label="Remove from library"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="mt-2 text-xs text-primary">
                        Chapter {row.book_chapters?.chapter_number ?? row.chapter_number}
                        {row.book_chapters?.title ? ` · ${row.book_chapters.title}` : ""}
                      </p>

                      <div className="mt-3 h-1.5 w-full rounded-full bg-primary/10">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{percent}% through chapter</span>
                        <span>Last opened {updated}</span>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Button asChild size="sm">
                          <Link to={href}>Resume reading</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/books/${row.books.slug}`}>Book details</Link>
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Library;
