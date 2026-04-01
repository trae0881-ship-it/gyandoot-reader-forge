import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import useSEO from "@/hooks/useSEO";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Loader2, Search } from "lucide-react";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "devi", label: "देवी" },
  { value: "devta", label: "देवता" },
  { value: "adhyatm", label: "अध्यात्म" },
  { value: "puran", label: "पुराण" },
  { value: "katha", label: "कथा" },
  { value: "other", label: "अन्य" },
];

const PAGE_SIZE = 8;

const Books = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";

  const [filter, setFilter] = useState<"all" | "free" | "paid">("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState(initialSearch);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useSEO({
    title: "Dharmik Granth & Spiritual Books Online — GyandootNova",
    description: "Browse and buy spiritual books — Vishnu Sahasraname, Bhagwat Geeta, Ramayana, Hanuman Chalisa & more dharmik granth online.",
    canonical: "/books",
  });

  const { data: books, isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const { data } = await supabase
        .from("books")
        .select("id, title, slug, author, cover_url, price, is_free, is_featured, description, preview_chapters, purchase_count, created_at, updated_at, file_type, category")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    if (!books) return [];
    let result = books;
    if (filter === "free") result = result.filter((b) => b.is_free);
    if (filter === "paid") result = result.filter((b) => !b.is_free);
    if (category !== "all") result = result.filter((b) => b.category === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          (b.description ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [books, filter, category, search]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Infinite scroll
  const loaderRef = useRef<HTMLDivElement>(null);
  const loadMore = useCallback(() => {
    if (hasMore) setVisibleCount((prev) => prev + PAGE_SIZE);
  }, [hasMore]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <Layout>
      <section className="py-12">
        <div className="container">
          <h1 className="font-serif text-4xl font-bold">Books Library</h1>
          <p className="mt-2 text-muted-foreground">Explore our collection of spiritual literature</p>

          {/* Search */}
          <div className="mt-6 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Search books by title, author..."
              className="pl-10"
            />
          </div>

          {/* Category filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                variant={category === cat.value ? "default" : "outline"}
                size="sm"
                onClick={() => { setCategory(cat.value); setVisibleCount(PAGE_SIZE); }}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Free / Paid filters */}
          <div className="mt-3 flex gap-2">
            {(["all", "free", "paid"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "secondary" : "ghost"}
                size="sm"
                onClick={() => { setFilter(f); setVisibleCount(PAGE_SIZE); }}
                className="capitalize"
              >
                {f === "all" ? "All" : f === "free" ? "Free" : "Paid"}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : visible.length > 0 ? (
            <>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {visible.map((book) => (
                  <Link key={book.id} to={`/books/${book.slug}`}>
                    <Card className="group overflow-hidden transition-shadow hover:shadow-lg h-full">
                      <div className="aspect-[3/4] bg-muted flex items-center justify-center">
                        {book.cover_url ? (
                          <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h2 className="font-serif font-semibold group-hover:text-primary transition-colors line-clamp-2">{book.title}</h2>
                        <p className="text-sm text-muted-foreground">{book.author}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${book.is_free ? "bg-green-100 text-green-700" : "bg-secondary/20 text-secondary-foreground"}`}>
                            {book.is_free ? "Free" : `₹${book.price}`}
                          </span>
                          {book.category && (
                            <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground capitalize">
                              {CATEGORIES.find((c) => c.value === book.category)?.label ?? book.category}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {hasMore && (
                <div ref={loaderRef} className="mt-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                  <p className="text-xs text-muted-foreground mt-2">Loading more books...</p>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center text-muted-foreground">No books found.</div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Books;
