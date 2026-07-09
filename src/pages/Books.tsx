import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import useSEO from "@/hooks/useSEO";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Loader2, Search, ShieldCheck, Infinity as InfinityIcon, Lock, Star, Users } from "lucide-react";

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
  const filterParam = searchParams.get("filter");
  const initialFilter: "all" | "free" | "paid" =
    filterParam === "free" || filterParam === "paid" ? filterParam : "all";

  const [filter, setFilter] = useState<"all" | "free" | "paid">(initialFilter);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState(initialSearch);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useSEO({
    title: "Hindu Religious Books — Gita, Vedas, Ramayana PDF",
    description: "GyandootNova (Gyandoot Nova) — Hindu religious books online: Bhagavad Gita Hindi PDF, Geeta shlok, 4 Vedas, Upanishads, Ramayana, Hanuman Chalisa, Vishnu Sahasranama aur 50+ dharmik granth free reader ke saath.",
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
      <section className="py-8 md:py-12">
        <div className="container">
          <h1 className="font-serif text-3xl md:text-4xl font-bold">हमारी पूरी Library</h1>
          <p className="mt-2 text-sm md:text-base text-muted-foreground">
            एक बार खरीदिए, जीवनभर पढ़िए — हर book mobile, tablet aur laptop par padh sakte hain.
          </p>

          {/* Trust strip */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs md:text-sm text-foreground/80">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> 7-दिन पैसा वापसी</span>
            <span className="inline-flex items-center gap-1.5"><InfinityIcon className="h-4 w-4 text-primary" /> जीवनभर access</span>
            <span className="inline-flex items-center gap-1.5"><Lock className="h-4 w-4 text-primary" /> Secure payment</span>
            <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" /> 24,000+ पाठक</span>
          </div>

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
              aria-label="Search books by title or author"
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
              <div className="mt-8 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                {visible.map((book) => {
                  const readers = Math.max(book.purchase_count ?? 0, 100);
                  return (
                    <Link key={book.id} to={`/books/${book.slug}`} className="group">
                      <Card className="overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 h-full flex flex-col border-border relative">
                        {/* Top badge */}
                        <div className="absolute top-2 left-2 z-10">
                          {book.is_free ? (
                            <span className="inline-block rounded-md bg-green-600 text-white px-2 py-0.5 text-[10px] font-bold shadow">FREE</span>
                          ) : book.is_featured ? (
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-secondary text-secondary-foreground px-2 py-0.5 text-[10px] font-bold shadow"><Star className="h-2.5 w-2.5 fill-current" /> BESTSELLER</span>
                          ) : null}
                        </div>
                        {!book.is_free && (
                          <div className="absolute top-2 right-2 z-10">
                            <span className="inline-block rounded-md bg-primary/95 text-primary-foreground px-2 py-0.5 text-[10px] font-bold shadow">जीवनभर</span>
                          </div>
                        )}

                        <div className="aspect-[3/4] bg-muted flex items-center justify-center overflow-hidden">
                          {book.cover_url ? (
                            <img src={book.cover_url} alt={book.title} width={300} height={400} decoding="async" loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                          ) : (
                            <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                          )}
                        </div>
                        <CardContent className="p-3 md:p-4 flex flex-col flex-1">
                          <h2 className="font-serif font-semibold text-[15px] leading-snug group-hover:text-primary transition-colors line-clamp-2 min-h-[2.6rem]">
                            {book.title}
                          </h2>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{book.author}</p>

                          {/* Social proof */}
                          <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Star className="h-3 w-3 fill-secondary text-secondary" />
                            <span className="font-medium text-foreground">4.8</span>
                            <span>•</span>
                            <span>{readers.toLocaleString()}+ पाठक</span>
                          </div>

                          {/* Price + CTA (C.3) */}
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <div>
                              {book.is_free ? (
                                <span className="text-base font-bold text-green-700">₹0</span>
                              ) : (
                                <div className="flex items-baseline gap-1">
                                  <span className="text-base font-bold text-primary">₹{book.price}</span>
                                  <span className="text-[10px] text-muted-foreground line-through">₹{Math.round((book.price as number) * 2.5)}</span>
                                </div>
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-primary group-hover:underline">
                              {book.is_free ? "पढ़ें →" : "Buy Now →"}
                            </span>

                          </div>
                          {!book.is_free && (
                            <p className="mt-1.5 text-[10px] text-muted-foreground">
                              Poora granth chahiye? <span className="font-semibold text-primary">→ Premium Lein</span>
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
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
