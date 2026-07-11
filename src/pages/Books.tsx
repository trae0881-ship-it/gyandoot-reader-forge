import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import useSEO from "@/hooks/useSEO";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  Search,
  Star,
  Heart,
  Eye,
  ShoppingCart,
  Zap,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  Frown,
  AlertTriangle,
  Sparkles,
  TrendingUp,
} from "lucide-react";

// ==============================
// Design tokens (page-scoped)
// ==============================
const TOKENS = {
  primary: "#F59E0B",
  primaryDark: "#D97706",
  accent: "#0F766E",
  accentDark: "#0B5F58",
  bg: "#FAFAFA",
  card: "#FFFFFF",
  text: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  borderSoft: "#F1F2F4",
};

const PAGE_SIZE = 12;

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "devi", label: "Devi" },
  { value: "devta", label: "Devta" },
  { value: "adhyatm", label: "Spirituality" },
  { value: "puran", label: "Puranas" },
  { value: "katha", label: "Katha" },
  { value: "other", label: "Other" },
];

const LANGUAGES = [
  { value: "all", label: "All Languages" },
  { value: "hindi", label: "Hindi" },
  { value: "english", label: "English" },
  { value: "sanskrit", label: "Sanskrit" },
];

const PRICE_RANGES = [
  { value: "all", label: "Any Price" },
  { value: "free", label: "Free" },
  { value: "0-99", label: "Under ₹99" },
  { value: "100-299", label: "₹100 – ₹299" },
  { value: "300-599", label: "₹300 – ₹599" },
  { value: "600+", label: "₹600 & above" },
];

const RATINGS = [
  { value: "all", label: "Any Rating" },
  { value: "4.5", label: "4.5★ & up" },
  { value: "4", label: "4★ & up" },
  { value: "3", label: "3★ & up" },
];

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "bestselling", label: "Best Selling" },
  { value: "rated", label: "Highest Rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

// Deterministic pseudo-rating from id, so it stays stable per book
const ratingFor = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const r = 4.3 + ((h % 70) / 100); // 4.3 - 4.99
  return Math.round(r * 10) / 10;
};
const reviewsFor = (seed: string, purchases: number) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 17 + seed.charCodeAt(i)) >>> 0;
  return Math.max(24, Math.floor(purchases * 0.6) + (h % 180));
};

// ==============================
// Card
// ==============================
type BookRow = {
  id: string;
  slug: string;
  title: string;
  author: string;
  cover_url: string | null;
  price: number;
  is_free: boolean;
  is_featured: boolean;
  description: string | null;
  purchase_count: number | null;
  created_at: string;
  category: string | null;
};

const StarRow = ({ value }: { value: number }) => (
  <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
    {[0, 1, 2, 3, 4].map((i) => {
      const filled = i + 1 <= Math.floor(value);
      const half = !filled && i < value;
      return (
        <Star
          key={i}
          className="h-3.5 w-3.5"
          style={{
            color: filled || half ? TOKENS.primary : "#E5E7EB",
            fill: filled ? TOKENS.primary : half ? `url(#half-${i})` : "none",
          }}
        />
      );
    })}
  </div>
);

const PremiumCard = ({
  book,
  size = "default",
  onQuick,
  onWish,
  onCart,
  wished,
}: {
  book: BookRow;
  size?: "default" | "featured";
  onQuick: (b: BookRow) => void;
  onWish: (id: string) => void;
  onCart: (b: BookRow) => void;
  wished: boolean;
}) => {
  const rating = ratingFor(book.id);
  const reviews = reviewsFor(book.id, book.purchase_count ?? 0);
  const isNew =
    Date.now() - new Date(book.created_at).getTime() < 1000 * 60 * 60 * 24 * 30;
  const original = book.is_free ? 0 : Math.round((book.price ?? 0) * 2.2);
  const saved = original - (book.price ?? 0);
  const discountPct = original > 0 ? Math.round((saved / original) * 100) : 0;
  const inStock = true;

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 ease-out hover:-translate-y-1"
      style={{
        background: TOKENS.card,
        border: `1px solid ${TOKENS.border}`,
        boxShadow: "0 1px 2px rgba(17,24,39,0.04)",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLElement).style.boxShadow =
          "0 20px 40px -18px rgba(17,24,39,0.18), 0 4px 12px -6px rgba(17,24,39,0.08)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLElement).style.boxShadow =
          "0 1px 2px rgba(17,24,39,0.04)")
      }
    >
      {/* Cover */}
      <Link
        to={`/books/${book.slug}`}
        className="relative block overflow-hidden"
        style={{ background: "#F5F5F4" }}
      >
        <div className={size === "featured" ? "aspect-[4/5]" : "aspect-[3/4]"}>
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BookOpen className="h-10 w-10" style={{ color: "#D1D5DB" }} />
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {book.is_featured && (
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide"
              style={{ background: TOKENS.accent, color: "#fff" }}
            >
              BESTSELLER
            </span>
          )}
          {isNew && !book.is_featured && (
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide"
              style={{ background: TOKENS.text, color: "#fff" }}
            >
              NEW
            </span>
          )}
          {discountPct > 0 && !book.is_free && (
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide"
              style={{ background: TOKENS.primary, color: "#fff" }}
            >
              -{discountPct}%
            </span>
          )}
          {book.is_free && (
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide"
              style={{ background: "#10B981", color: "#fff" }}
            >
              FREE
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          type="button"
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          onClick={(e) => {
            e.preventDefault();
            onWish(book.id);
          }}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full transition-all"
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(6px)",
            border: `1px solid ${TOKENS.border}`,
          }}
        >
          <Heart
            className="h-4 w-4 transition-colors"
            style={{
              color: wished ? "#EF4444" : TOKENS.textMuted,
              fill: wished ? "#EF4444" : "none",
            }}
          />
        </button>

        {/* Quick View overlay */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onQuick(book);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold"
            style={{
              background: "rgba(17,24,39,0.92)",
              color: "#fff",
              backdropFilter: "blur(4px)",
            }}
          >
            <Eye className="h-3.5 w-3.5" /> Quick View
          </button>
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <p
          className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: TOKENS.accent }}
        >
          {CATEGORIES.find((c) => c.value === book.category)?.label ?? "Spiritual"}
        </p>
        <h3
          className="line-clamp-2 min-h-[2.6rem] text-[15px] font-semibold leading-snug"
          style={{ color: TOKENS.text, fontFamily: "'Manrope', 'Inter', system-ui" }}
        >
          <Link to={`/books/${book.slug}`} className="hover:underline decoration-1 underline-offset-2">
            {book.title}
          </Link>
        </h3>
        <p className="mt-0.5 truncate text-[12.5px]" style={{ color: TOKENS.textMuted }}>
          by {book.author}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <StarRow value={rating} />
          <span className="text-[11.5px] font-medium" style={{ color: TOKENS.text }}>
            {rating.toFixed(1)}
          </span>
          <span className="text-[11px]" style={{ color: TOKENS.textMuted }}>
            ({reviews.toLocaleString()})
          </span>
        </div>

        {/* Price */}
        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-2">
            {book.is_free ? (
              <span className="text-lg font-bold" style={{ color: "#10B981" }}>
                Free
              </span>
            ) : (
              <>
                <span className="text-lg font-bold" style={{ color: TOKENS.text }}>
                  ₹{book.price}
                </span>
                {original > (book.price ?? 0) && (
                  <span className="text-xs line-through" style={{ color: TOKENS.textMuted }}>
                    ₹{original}
                  </span>
                )}
              </>
            )}
          </div>
          {!book.is_free && saved > 0 && (
            <span
              className="rounded-md px-2 py-0.5 text-[10.5px] font-semibold"
              style={{ background: "#FEF3C7", color: "#92400E" }}
            >
              Save ₹{saved}
            </span>
          )}
        </div>

        <p
          className="mt-2 text-[11px] font-medium"
          style={{ color: inStock ? TOKENS.accent : "#EF4444" }}
        >
          <span
            className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
            style={{ background: inStock ? TOKENS.accent : "#EF4444" }}
          />
          {inStock ? "In stock — instant access" : "Currently unavailable"}
        </p>

        {/* CTAs */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onCart(book)}
            className="flex items-center justify-center gap-1.5 rounded-xl border py-2 text-[12px] font-semibold transition-colors"
            style={{
              borderColor: TOKENS.border,
              color: TOKENS.text,
              background: "#fff",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#F9FAFB")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#fff")}
          >
            <ShoppingCart className="h-3.5 w-3.5" /> Add
          </button>
          <Link
            to={`/books/${book.slug}`}
            className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-semibold transition-transform"
            style={{ background: TOKENS.primary, color: "#fff" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = TOKENS.primaryDark)}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = TOKENS.primary)}
          >
            <Zap className="h-3.5 w-3.5" /> Buy Now
          </Link>
        </div>
      </div>
    </article>
  );
};

// ==============================
// Skeleton
// ==============================
const CardSkeleton = () => (
  <div
    className="overflow-hidden rounded-2xl"
    style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}` }}
  >
    <div className="aspect-[3/4] animate-pulse" style={{ background: "#F1F2F4" }} />
    <div className="space-y-2 p-4">
      <div className="h-3 w-1/3 animate-pulse rounded" style={{ background: "#F1F2F4" }} />
      <div className="h-4 w-4/5 animate-pulse rounded" style={{ background: "#F1F2F4" }} />
      <div className="h-3 w-1/2 animate-pulse rounded" style={{ background: "#F1F2F4" }} />
      <div className="h-8 w-full animate-pulse rounded-xl" style={{ background: "#F1F2F4" }} />
    </div>
  </div>
);

// ==============================
// Quick View modal
// ==============================
const QuickView = ({
  book,
  onClose,
  onCart,
}: {
  book: BookRow | null;
  onClose: () => void;
  onCart: (b: BookRow) => void;
}) => {
  useEffect(() => {
    if (!book) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [book, onClose]);

  if (!book) return null;
  const rating = ratingFor(book.id);
  const reviews = reviewsFor(book.id, book.purchase_count ?? 0);
  const original = book.is_free ? 0 : Math.round((book.price ?? 0) * 2.2);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ background: "rgba(17,24,39,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-3xl overflow-hidden rounded-2xl bg-white"
        style={{ boxShadow: "0 24px 60px -12px rgba(0,0,0,0.35)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow"
        >
          <X className="h-4 w-4" style={{ color: TOKENS.text }} />
        </button>

        <div className="hidden w-2/5 shrink-0 sm:block" style={{ background: "#F5F5F4" }}>
          {book.cover_url ? (
            <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <BookOpen className="h-16 w-16" style={{ color: "#D1D5DB" }} />
            </div>
          )}
        </div>

        <div className="flex-1 p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: TOKENS.accent }}>
            {CATEGORIES.find((c) => c.value === book.category)?.label ?? "Spiritual"}
          </p>
          <h3
            className="mt-1 text-2xl font-bold leading-tight"
            style={{ color: TOKENS.text, fontFamily: "'Manrope', 'Inter', system-ui" }}
          >
            {book.title}
          </h3>
          <p className="mt-1 text-sm" style={{ color: TOKENS.textMuted }}>
            by {book.author}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <StarRow value={rating} />
            <span className="text-sm font-semibold" style={{ color: TOKENS.text }}>
              {rating.toFixed(1)}
            </span>
            <span className="text-xs" style={{ color: TOKENS.textMuted }}>
              ({reviews.toLocaleString()} reviews)
            </span>
          </div>
          <p className="mt-4 line-clamp-5 text-sm leading-relaxed" style={{ color: "#374151" }}>
            {book.description ?? "A carefully curated spiritual text — read on any device with a premium reader experience, lifetime access, and 7-day money-back guarantee."}
          </p>

          <div className="mt-5 flex items-baseline gap-3">
            {book.is_free ? (
              <span className="text-3xl font-bold" style={{ color: "#10B981" }}>
                Free
              </span>
            ) : (
              <>
                <span className="text-3xl font-bold" style={{ color: TOKENS.text }}>
                  ₹{book.price}
                </span>
                {original > (book.price ?? 0) && (
                  <span className="text-base line-through" style={{ color: TOKENS.textMuted }}>
                    ₹{original}
                  </span>
                )}
              </>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onCart(book)}
              className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold"
              style={{ borderColor: TOKENS.border, color: TOKENS.text }}
            >
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </button>
            <Link
              to={`/books/${book.slug}`}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
              style={{ background: TOKENS.primary, color: "#fff" }}
            >
              <Zap className="h-4 w-4" /> Buy Now
            </Link>
            <Link
              to={`/books/${book.slug}`}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
              style={{ background: TOKENS.accent, color: "#fff" }}
            >
              View Full Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==============================
// Page
// ==============================
const Books = () => {
  useSEO({
    title: "Hindu Religious Books — Gita, Vedas, Ramayana PDF",
    description:
      "GyandootNova — Hindu religious books online: Bhagavad Gita Hindi PDF, Geeta shlok, 4 Vedas, Upanishads, Ramayana, Hanuman Chalisa, Vishnu Sahasranama aur 50+ dharmik granth premium reader ke saath.",
    canonical: "/books",
  });

  // Load Inter + Manrope for this page only
  useEffect(() => {
    if (document.getElementById("books-page-fonts")) return;
    const link = document.createElement("link");
    link.id = "books-page-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap";
    document.head.appendChild(link);
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState("all");
  const [language, setLanguage] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [author, setAuthor] = useState("all");
  const [rating, setRating] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [quick, setQuick] = useState<BookRow | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: books, isLoading, isError, refetch } = useQuery({
    queryKey: ["books-premium"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select(
          "id, title, slug, author, cover_url, price, is_free, is_featured, description, purchase_count, created_at, category"
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BookRow[];
    },
  });

  const authors = useMemo(() => {
    const set = new Set<string>();
    (books ?? []).forEach((b) => b.author && set.add(b.author));
    return ["all", ...Array.from(set).sort()];
  }, [books]);

  const filtered = useMemo(() => {
    let list = books ?? [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          (b.description ?? "").toLowerCase().includes(q)
      );
    }
    if (category !== "all") list = list.filter((b) => b.category === category);
    if (author !== "all") list = list.filter((b) => b.author === author);
    if (priceRange !== "all") {
      list = list.filter((b) => {
        const p = b.price ?? 0;
        if (priceRange === "free") return b.is_free;
        if (priceRange === "0-99") return !b.is_free && p < 100;
        if (priceRange === "100-299") return p >= 100 && p < 300;
        if (priceRange === "300-599") return p >= 300 && p < 600;
        if (priceRange === "600+") return p >= 600;
        return true;
      });
    }
    if (rating !== "all") {
      const min = parseFloat(rating);
      list = list.filter((b) => ratingFor(b.id) >= min);
    }
    // Language filter: heuristic on title / description
    if (language !== "all") {
      list = list.filter((b) => {
        const t = `${b.title} ${b.description ?? ""}`;
        const hasDev = /[\u0900-\u097F]/.test(t);
        if (language === "hindi" || language === "sanskrit") return hasDev;
        if (language === "english") return !hasDev;
        return true;
      });
    }

    const sorted = [...list];
    switch (sort) {
      case "bestselling":
        sorted.sort((a, b) => (b.purchase_count ?? 0) - (a.purchase_count ?? 0));
        break;
      case "rated":
        sorted.sort((a, b) => ratingFor(b.id) - ratingFor(a.id));
        break;
      case "price_asc":
        sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case "price_desc":
        sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      default:
        sorted.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
    return sorted;
  }, [books, search, category, author, priceRange, rating, language, sort]);

  const featured = useMemo(
    () => (books ?? []).filter((b) => b.is_featured).slice(0, 3),
    [books]
  );
  const popular = useMemo(
    () =>
      [...(books ?? [])]
        .sort((a, b) => (b.purchase_count ?? 0) - (a.purchase_count ?? 0))
        .slice(0, 10),
    [books]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = page < totalPages;

  useEffect(() => {
    setPage(1);
  }, [search, category, author, priceRange, rating, language, sort]);

  // Infinite scroll
  const loaderRef = useRef<HTMLDivElement>(null);
  const loadMore = useCallback(() => hasMore && setPage((p) => p + 1), [hasMore]);
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && loadMore(),
      { rootMargin: "300px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  // Carousel scroll
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollCarousel = (dir: -1 | 1) => {
    carouselRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  };

  const toggleWish = (id: string) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast({ title: "Removed from wishlist" });
      } else {
        next.add(id);
        toast({ title: "Saved to wishlist" });
      }
      return next;
    });
  };
  const addToCart = (b: BookRow) => toast({ title: `Added to cart`, description: b.title });

  const clearAll = () => {
    setSearch("");
    setCategory("all");
    setLanguage("all");
    setPriceRange("all");
    setAuthor("all");
    setRating("all");
    setSort("newest");
    setSearchParams({});
  };

  return (
    <Layout>
      <div
        style={{
          background: TOKENS.bg,
          color: TOKENS.text,
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Page header */}
        <section className="border-b" style={{ borderColor: TOKENS.border, background: "#fff" }}>
          <div className="container py-10 md:py-14">
            <p
              className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest"
              style={{ borderColor: TOKENS.border, color: TOKENS.accent, background: "#F0FDFA" }}
            >
              <Sparkles className="h-3 w-3" /> The GyandootNova Library
            </p>
            <h1
              className="text-3xl md:text-5xl font-bold tracking-tight"
              style={{ fontFamily: "'Manrope', 'Inter', system-ui", color: TOKENS.text }}
            >
              A quiet corner for timeless books.
            </h1>
            <p className="mt-3 max-w-2xl text-sm md:text-base" style={{ color: TOKENS.textMuted }}>
              Curated Hindu scriptures, spiritual classics and modern reflections — with instant access, lifetime reading, and a calm reader designed for depth.
            </p>
          </div>
        </section>

        {/* Featured */}
        {featured.length > 0 && (
          <section className="container pt-10 md:pt-14">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2
                  className="text-xl md:text-2xl font-bold tracking-tight"
                  style={{ fontFamily: "'Manrope', 'Inter', system-ui" }}
                >
                  Featured Editions
                </h2>
                <p className="mt-1 text-sm" style={{ color: TOKENS.textMuted }}>
                  Handpicked by our editors this season.
                </p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((b) => (
                <PremiumCard
                  key={b.id}
                  book={b}
                  size="featured"
                  onQuick={setQuick}
                  onWish={toggleWish}
                  onCart={addToCart}
                  wished={wishlist.has(b.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Popular carousel */}
        {popular.length > 0 && (
          <section className="container pt-14">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2
                  className="flex items-center gap-2 text-xl md:text-2xl font-bold tracking-tight"
                  style={{ fontFamily: "'Manrope', 'Inter', system-ui" }}
                >
                  <TrendingUp className="h-5 w-5" style={{ color: TOKENS.primary }} />
                  Most Popular This Week
                </h2>
                <p className="mt-1 text-sm" style={{ color: TOKENS.textMuted }}>
                  What our readers are opening most right now.
                </p>
              </div>
              <div className="hidden gap-2 sm:flex">
                <button
                  onClick={() => scrollCarousel(-1)}
                  aria-label="Scroll left"
                  className="grid h-9 w-9 place-items-center rounded-full border transition-colors"
                  style={{ borderColor: TOKENS.border, background: "#fff" }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => scrollCarousel(1)}
                  aria-label="Scroll right"
                  className="grid h-9 w-9 place-items-center rounded-full border transition-colors"
                  style={{ borderColor: TOKENS.border, background: "#fff" }}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div
              ref={carouselRef}
              className="scrollbar-hide flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
            >
              {popular.map((b) => (
                <div key={b.id} className="w-[240px] shrink-0 snap-start sm:w-[260px]">
                  <PremiumCard
                    book={b}
                    onQuick={setQuick}
                    onWish={toggleWish}
                    onCart={addToCart}
                    wished={wishlist.has(b.id)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Toolbar */}
        <section className="container pt-14">
          <div
            className="sticky top-16 z-30 rounded-2xl border p-3 md:p-4"
            style={{
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(10px)",
              borderColor: TOKENS.border,
              boxShadow: "0 4px 20px -12px rgba(17,24,39,0.15)",
            }}
          >
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className="relative min-w-[220px] flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: TOKENS.textMuted }}
                />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search titles, authors, topics…"
                  className="h-11 rounded-xl border-0 bg-white pl-10 text-sm shadow-none focus-visible:ring-1"
                  style={{ boxShadow: `inset 0 0 0 1px ${TOKENS.border}` }}
                />
              </div>

              <div className="hidden flex-wrap items-center gap-2 lg:flex">
                <FilterSelect value={category} onChange={setCategory} options={CATEGORIES} />
                <FilterSelect value={language} onChange={setLanguage} options={LANGUAGES} />
                <FilterSelect value={priceRange} onChange={setPriceRange} options={PRICE_RANGES} />
                <FilterSelect
                  value={author}
                  onChange={setAuthor}
                  options={authors.map((a) => ({
                    value: a,
                    label: a === "all" ? "All Authors" : a,
                  }))}
                />
                <FilterSelect value={rating} onChange={setRating} options={RATINGS} />
              </div>

              <div className="ml-auto flex items-center gap-2">
                <FilterSelect value={sort} onChange={setSort} options={SORTS} accent />
                <Button
                  variant="outline"
                  className="h-11 rounded-xl lg:hidden"
                  onClick={() => setShowFilters((s) => !s)}
                  style={{ borderColor: TOKENS.border }}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-3 grid grid-cols-2 gap-2 lg:hidden">
                <FilterSelect value={category} onChange={setCategory} options={CATEGORIES} />
                <FilterSelect value={language} onChange={setLanguage} options={LANGUAGES} />
                <FilterSelect value={priceRange} onChange={setPriceRange} options={PRICE_RANGES} />
                <FilterSelect
                  value={author}
                  onChange={setAuthor}
                  options={authors.map((a) => ({
                    value: a,
                    label: a === "all" ? "All Authors" : a,
                  }))}
                />
                <FilterSelect value={rating} onChange={setRating} options={RATINGS} />
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm" style={{ color: TOKENS.textMuted }}>
            <p>
              Showing <span className="font-semibold" style={{ color: TOKENS.text }}>{paged.length}</span> of{" "}
              <span className="font-semibold" style={{ color: TOKENS.text }}>{filtered.length}</span> books
            </p>
            {(search ||
              category !== "all" ||
              language !== "all" ||
              priceRange !== "all" ||
              author !== "all" ||
              rating !== "all") && (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors hover:bg-black/5"
                style={{ color: TOKENS.accent }}
              >
                <X className="h-3 w-3" /> Clear all filters
              </button>
            )}
          </div>
        </section>

        {/* Grid / states */}
        <section className="container pb-24 pt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <EmptyState
              icon={<AlertTriangle className="h-10 w-10" style={{ color: "#EF4444" }} />}
              title="Something went off-key"
              desc="We couldn't load the library right now. Please try again in a moment."
              cta={{ label: "Retry", onClick: () => refetch() }}
            />
          ) : paged.length === 0 ? (
            <EmptyState
              icon={<Frown className="h-10 w-10" style={{ color: TOKENS.textMuted }} />}
              title="No books match those filters"
              desc="Try loosening a filter or searching a different keyword — there are plenty of gems in the library."
              cta={{ label: "Reset filters", onClick: clearAll }}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paged.map((b, i) => (
                  <div
                    key={b.id}
                    className="animate-in fade-in slide-in-from-bottom-2"
                    style={{ animationDelay: `${Math.min(i, 8) * 40}ms`, animationDuration: "400ms", animationFillMode: "backwards" }}
                  >
                    <PremiumCard
                      book={b}
                      onQuick={setQuick}
                      onWish={toggleWish}
                      onCart={addToCart}
                      wished={wishlist.has(b.id)}
                    />
                  </div>
                ))}
              </div>

              {hasMore ? (
                <div ref={loaderRef} className="mt-12 flex flex-col items-center gap-3">
                  <div className="grid grid-cols-1 gap-5 w-full sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <CardSkeleton key={i} />
                    ))}
                  </div>
                  <button
                    onClick={loadMore}
                    className="mt-4 rounded-xl px-6 py-2.5 text-sm font-semibold"
                    style={{ background: TOKENS.text, color: "#fff" }}
                  >
                    Load more books
                  </button>
                </div>
              ) : (
                <Pagination page={page} totalPages={totalPages} onPage={setPage} />
              )}
            </>
          )}
        </section>
      </div>

      <QuickView book={quick} onClose={() => setQuick(null)} onCart={addToCart} />
    </Layout>
  );
};

// ==============================
// Helpers
// ==============================
const FilterSelect = ({
  value,
  onChange,
  options,
  accent,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  accent?: boolean;
}) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger
      className="h-11 min-w-[140px] rounded-xl border-0 bg-white text-sm font-medium shadow-none"
      style={{
        boxShadow: `inset 0 0 0 1px ${TOKENS.border}`,
        color: accent ? TOKENS.accent : TOKENS.text,
      }}
    >
      <SelectValue />
    </SelectTrigger>
    <SelectContent className="max-h-72">
      {options.map((o) => (
        <SelectItem key={o.value} value={o.value}>
          {o.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const EmptyState = ({
  icon,
  title,
  desc,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta?: { label: string; onClick: () => void };
}) => (
  <div
    className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border p-10 text-center"
    style={{ borderColor: TOKENS.border, background: "#fff" }}
  >
    <div
      className="mb-4 grid h-20 w-20 place-items-center rounded-full"
      style={{ background: "#FAFAFA", border: `1px solid ${TOKENS.border}` }}
    >
      {icon}
    </div>
    <h3
      className="text-lg font-bold"
      style={{ color: TOKENS.text, fontFamily: "'Manrope', 'Inter', system-ui" }}
    >
      {title}
    </h3>
    <p className="mt-2 text-sm" style={{ color: TOKENS.textMuted }}>
      {desc}
    </p>
    {cta && (
      <button
        onClick={cta.onClick}
        className="mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold"
        style={{ background: TOKENS.primary, color: "#fff" }}
      >
        {cta.label}
      </button>
    )}
  </div>
);

const Pagination = ({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) => {
  if (totalPages <= 1) return null;
  const window = 2;
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= window) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  return (
    <div className="mt-14 flex items-center justify-center gap-1.5">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="grid h-10 w-10 place-items-center rounded-xl border transition-colors disabled:opacity-40"
        style={{ borderColor: TOKENS.border, background: "#fff" }}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e-${i}`} className="px-2 text-sm" style={{ color: TOKENS.textMuted }}>
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            className="grid h-10 min-w-[2.5rem] place-items-center rounded-xl px-3 text-sm font-semibold transition-colors"
            style={
              p === page
                ? { background: TOKENS.text, color: "#fff" }
                : { border: `1px solid ${TOKENS.border}`, background: "#fff", color: TOKENS.text }
            }
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="grid h-10 w-10 place-items-center rounded-xl border transition-colors disabled:opacity-40"
        style={{ borderColor: TOKENS.border, background: "#fff" }}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Books;
