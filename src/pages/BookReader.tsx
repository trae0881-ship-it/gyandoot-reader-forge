import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, ArrowLeft, Sun, Moon, Minus, Plus, BookOpen } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

const BookReader = () => {
  const { slug, chapterSlug } = useParams<{ slug: string; chapterSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [fontSize, setFontSize] = useState(18);
  const [darkMode, setDarkMode] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: book } = useQuery({
    queryKey: ["book", slug],
    queryFn: async () => {
      const { data } = await supabase.from("books").select("*").eq("slug", slug!).single();
      return data;
    },
    enabled: !!slug,
  });

  const { data: chapters } = useQuery({
    queryKey: ["all-chapters", book?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("book_chapters")
        .select("*")
        .eq("book_id", book!.id)
        .order("chapter_number");
      return data ?? [];
    },
    enabled: !!book?.id,
  });

  const { data: hasPurchased } = useQuery({
    queryKey: ["purchase-check", book?.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_purchased_book", { _user_id: user!.id, _book_id: book!.id });
      return !!data;
    },
    enabled: !!book?.id && !!user?.id && !book?.is_free,
  });

  const chapter = chapters?.find((c) => c.slug === chapterSlug);
  const currentIndex = chapters?.findIndex((c) => c.slug === chapterSlug) ?? -1;
  const prevChapter = currentIndex > 0 ? chapters?.[currentIndex - 1] : null;
  const nextChapter = chapters && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
  const totalChapters = chapters?.length ?? 1;
  const chapterProgress = totalChapters > 0 ? ((currentIndex + 1) / totalChapters) * 100 : 0;

  // Save progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: async ({ scrollPct }: { scrollPct: number }) => {
      if (!user || !book?.id || !chapter?.id) return;
      await supabase.from("reading_progress").upsert(
        {
          user_id: user.id,
          book_id: book.id,
          chapter_id: chapter.id,
          chapter_number: chapter.chapter_number,
          scroll_percent: Math.round(scrollPct),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,book_id" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reading-progress", book?.id, user?.id] });
    },
  });

  // Scroll tracking + debounced save
  const handleScroll = useCallback(() => {
    const el = document.documentElement;
    const scrolled = el.scrollTop / (el.scrollHeight - el.clientHeight);
    const pct = Math.min(scrolled * 100, 100) || 0;
    setScrollProgress(pct);

    if (user && book?.id && chapter?.id) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveProgressMutation.mutate({ scrollPct: pct });
      }, 1500);
    }
  }, [user, book?.id, chapter?.id]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [handleScroll]);

  // Save progress when chapter changes (on mount)
  useEffect(() => {
    if (user && book?.id && chapter?.id) {
      window.scrollTo(0, 0);
      saveProgressMutation.mutate({ scrollPct: 0 });
    }
  }, [chapter?.id]);

  const canRead = book?.is_free || chapter?.is_preview || hasPurchased;

  if (!chapter || !book) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Chapter not found.</p>
      </div>
    );
  }

  if (!canRead) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <BookOpen className="h-12 w-12 text-primary" />
        <h2 className="font-serif text-2xl font-bold">Purchase Required</h2>
        <p className="text-muted-foreground">This chapter requires purchasing the book.</p>
        <Button asChild><Link to={`/books/${slug}`}>Back to Book</Link></Button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${darkMode ? "bg-gray-900 text-gray-100" : "bg-background text-foreground"}`}>
      {/* Top reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Progress value={scrollProgress} className="h-1 rounded-none" />
      </div>

      {/* Toolbar */}
      <div className={`sticky top-0 z-40 border-b px-4 py-2 ${darkMode ? "border-gray-700 bg-gray-900/95" : "bg-background/95 backdrop-blur"}`}>
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/books/${slug}`}><ArrowLeft className="mr-1 h-4 w-4" /> {book.title}</Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setFontSize((s) => Math.max(14, s - 2))}><Minus className="h-4 w-4" /></Button>
            <span className="text-xs w-6 text-center">{fontSize}</span>
            <Button variant="ghost" size="icon" onClick={() => setFontSize((s) => Math.min(28, s + 2))}><Plus className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Chapter content */}
      <article className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-2 text-sm text-muted-foreground">
          Chapter {chapter.chapter_number} of {totalChapters}
        </div>
        <h1 className="font-serif text-3xl font-bold mb-8">{chapter.title}</h1>
        <div
          className="prose prose-lg max-w-none leading-relaxed"
          style={{ fontSize: `${fontSize}px` }}
        >
          {chapter.content?.split("\n").map((p, i) => (
            <p key={i} className="mb-4">{p}</p>
          ))}
        </div>
      </article>

      {/* Book progress bar (chapters completed) */}
      <div className="mx-auto max-w-3xl px-6 pb-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="shrink-0">Chapter {currentIndex + 1}/{totalChapters}</span>
          <Progress value={chapterProgress} className="flex-1 h-2" />
          <span className="shrink-0">{Math.round(chapterProgress)}%</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="mx-auto max-w-3xl px-6 pb-10">
        <div className="flex justify-between">
          {prevChapter ? (
            <Button variant="outline" onClick={() => navigate(`/books/${slug}/${prevChapter.slug}`)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
          ) : <div />}
          {nextChapter ? (
            <Button onClick={() => navigate(`/books/${slug}/${nextChapter.slug}`)}>
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link to={`/books/${slug}`}>
                🎉 Finished! Back to Book
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookReader;
