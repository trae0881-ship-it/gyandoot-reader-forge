import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft, ChevronRight, ArrowLeft, Sun, Moon, Minus, Plus,
  BookOpen, Bookmark, BookmarkCheck, StickyNote, X, Save, Highlighter, Trash2
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

/* ─── Types ─────────────────────────────────────────────────────────── */
interface Highlight {
  id: string;
  selected_text: string;
  paragraph_index: number;
  start_offset: number;
  end_offset: number;
  color: string;
}

/* ─── Main Component ─────────────────────────────────────────────────── */
const BookReader = () => {
  const { slug, chapterSlug } = useParams<{ slug: string; chapterSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reader settings
  const [fontSize, setFontSize] = useState(18);
  const [darkMode, setDarkMode] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Panels
  const [showNotes, setShowNotes] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [showHighlightBar, setShowHighlightBar] = useState(false);
  const [selectionInfo, setSelectionInfo] = useState<{
    text: string; paraIdx: number; start: number; end: number;
  } | null>(null);
  const [highlightBarPos, setHighlightBarPos] = useState({ x: 0, y: 0 });

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  /* ─── Queries ──────────────────────────────────────────────────────── */
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
        .from("book_chapters").select("*").eq("book_id", book!.id).order("chapter_number");
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

  /* ─── Highlights ───────────────────────────────────────────────────── */
  const { data: highlights = [] } = useQuery<Highlight[]>({
    queryKey: ["highlights", chapter?.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("text_highlights")
        .select("id, selected_text, paragraph_index, start_offset, end_offset, color")
        .eq("chapter_id", chapter!.id)
        .eq("user_id", user!.id);
      return (data ?? []) as Highlight[];
    },
    enabled: !!chapter?.id && !!user?.id,
  });

  const addHighlightMutation = useMutation({
    mutationFn: async (h: Omit<Highlight, "id">) => {
      await supabase.from("text_highlights").insert({
        user_id: user!.id,
        book_id: book!.id,
        chapter_id: chapter!.id,
        selected_text: h.selected_text,
        paragraph_index: h.paragraph_index,
        start_offset: h.start_offset,
        end_offset: h.end_offset,
        color: h.color,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["highlights", chapter?.id, user?.id] });
      toast({ title: "Highlighted!", description: "Text saved to your highlights." });
    },
  });

  const deleteHighlightMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("text_highlights").delete().eq("id", id).eq("user_id", user!.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["highlights", chapter?.id, user?.id] }),
  });

  /* ─── Notes ────────────────────────────────────────────────────────── */
  const { data: existingNote } = useQuery({
    queryKey: ["chapter-note", chapter?.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("chapter_notes")
        .select("id, content")
        .eq("chapter_id", chapter!.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!chapter?.id && !!user?.id,
  });

  useEffect(() => {
    if (existingNote) setNoteText(existingNote.content);
    else setNoteText("");
  }, [existingNote]);

  const saveNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      if (existingNote?.id) {
        await supabase.from("chapter_notes").update({ content }).eq("id", existingNote.id);
      } else {
        await supabase.from("chapter_notes").insert({
          user_id: user!.id,
          book_id: book!.id,
          chapter_id: chapter!.id,
          content,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chapter-note", chapter?.id, user?.id] });
      toast({ title: "Note saved!" });
    },
  });

  /* ─── Bookmarks ────────────────────────────────────────────────────── */
  const { data: isBookmarked } = useQuery({
    queryKey: ["bookmark", chapter?.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("chapter_id", chapter!.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!chapter?.id && !!user?.id,
  });

  const toggleBookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        await supabase.from("bookmarks").delete()
          .eq("chapter_id", chapter!.id).eq("user_id", user!.id);
      } else {
        await supabase.from("bookmarks").insert({
          user_id: user!.id,
          book_id: book!.id,
          chapter_id: chapter!.id,
          chapter_number: chapter!.chapter_number,
          chapter_title: chapter!.title,
          book_title: book!.title,
          book_slug: slug!,
          chapter_slug: chapter!.slug,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmark", chapter?.id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["user-bookmarks", user?.id] });
      toast({ title: isBookmarked ? "Bookmark removed" : "Chapter bookmarked!" });
    },
  });

  /* ─── Reading progress ─────────────────────────────────────────────── */
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

  useEffect(() => {
    if (user && book?.id && chapter?.id) {
      window.scrollTo(0, 0);
      saveProgressMutation.mutate({ scrollPct: 0 });
    }
  }, [chapter?.id]);

  /* ─── Text selection / highlight bar ──────────────────────────────── */
  const handleMouseUp = useCallback(() => {
    if (!user) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setShowHighlightBar(false);
      return;
    }

    // Find paragraph index
    const range = sel.getRangeAt(0);
    const container = range.startContainer.parentElement;
    const paragraphs = contentRef.current?.querySelectorAll("p[data-para-idx]");
    let paraIdx = 0;
    if (paragraphs) {
      paragraphs.forEach((p) => {
        if (p.contains(container)) paraIdx = parseInt(p.getAttribute("data-para-idx") ?? "0");
      });
    }

    const rect = range.getBoundingClientRect();
    setHighlightBarPos({ x: rect.left + rect.width / 2, y: rect.top + window.scrollY - 48 });
    setSelectionInfo({
      text: sel.toString(),
      paraIdx,
      start: range.startOffset,
      end: range.endOffset,
    });
    setShowHighlightBar(true);
  }, [user]);

  const saveHighlight = () => {
    if (!selectionInfo) return;
    addHighlightMutation.mutate({
      selected_text: selectionInfo.text,
      paragraph_index: selectionInfo.paraIdx,
      start_offset: selectionInfo.start,
      end_offset: selectionInfo.end,
      color: "yellow",
    });
    window.getSelection()?.removeAllRanges();
    setShowHighlightBar(false);
    setSelectionInfo(null);
  };

  /* ─── Render paragraph with highlights ────────────────────────────── */
  const renderParagraph = (text: string, idx: number) => {
    const paraHighlights = highlights.filter((h) => h.paragraph_index === idx);
    if (!paraHighlights.length) {
      return <p key={idx} data-para-idx={idx} className="mb-4">{text}</p>;
    }

    // Build segments with highlights applied
    const segments: { text: string; highlighted: boolean; highlightId?: string }[] = [];
    let lastEnd = 0;
    const sorted = [...paraHighlights].sort((a, b) => a.start_offset - b.start_offset);

    sorted.forEach((h) => {
      const start = Math.max(0, h.start_offset);
      const end = Math.min(text.length, h.end_offset);
      if (start > lastEnd) segments.push({ text: text.slice(lastEnd, start), highlighted: false });
      if (end > start) segments.push({ text: text.slice(start, end), highlighted: true, highlightId: h.id  });
      lastEnd = end;
    });
    if (lastEnd < text.length) segments.push({ text: text.slice(lastEnd), highlighted: false });

    return (
      <p key={idx} data-para-idx={idx} className="mb-4">
        {segments.map((seg, si) =>
          seg.highlighted ? (
            <mark
              key={si}
              className="bg-yellow-200 dark:bg-yellow-700/60 rounded px-0.5 cursor-pointer group relative"
              title="Click to remove highlight"
              onClick={() => seg.highlightId && deleteHighlightMutation.mutate(seg.highlightId)}
            >
              {seg.text}
            </mark>
          ) : (
            <span key={si}>{seg.text}</span>
          )
        )}
      </p>
    );
  };

  /* ─── Access check ─────────────────────────────────────────────────── */
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

  const paragraphs = chapter.content?.split("\n") ?? [];

  return (
    <div
      className={`min-h-screen transition-colors ${darkMode ? "bg-gray-900 text-gray-100" : "bg-background text-foreground"}`}
      onMouseUp={handleMouseUp}
    >
      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Progress value={scrollProgress} className="h-1 rounded-none" />
      </div>

      {/* Floating highlight toolbar */}
      {showHighlightBar && selectionInfo && (
        <div
          className="fixed z-[60] flex items-center gap-1 rounded-lg border bg-popover shadow-lg px-2 py-1 -translate-x-1/2"
          style={{ left: highlightBarPos.x, top: highlightBarPos.y }}
        >
          <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs" onClick={saveHighlight}>
            <Highlighter className="h-3.5 w-3.5 text-yellow-500" /> Highlight
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowHighlightBar(false)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <div className={`sticky top-0 z-40 border-b px-4 py-2 ${darkMode ? "border-gray-700 bg-gray-900/95" : "bg-background/95 backdrop-blur"}`}>
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/books/${slug}`}><ArrowLeft className="mr-1 h-4 w-4" /> {book.title}</Link>
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setFontSize((s) => Math.max(14, s - 2))}><Minus className="h-4 w-4" /></Button>
            <span className="text-xs w-6 text-center">{fontSize}</span>
            <Button variant="ghost" size="icon" onClick={() => setFontSize((s) => Math.min(28, s + 2))}><Plus className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {user && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Notes"
                  onClick={() => setShowNotes(!showNotes)}
                  className={showNotes ? "text-primary" : ""}
                >
                  <StickyNote className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title={isBookmarked ? "Remove bookmark" : "Bookmark chapter"}
                  onClick={() => toggleBookmarkMutation.mutate()}
                  disabled={toggleBookmarkMutation.isPending}
                >
                  {isBookmarked
                    ? <BookmarkCheck className="h-4 w-4 text-primary fill-primary" />
                    : <Bookmark className="h-4 w-4" />}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notes panel */}
      {showNotes && user && (
        <div className={`sticky top-[57px] z-30 border-b px-4 py-3 ${darkMode ? "border-gray-700 bg-gray-800" : "bg-muted/60 backdrop-blur"}`}>
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <StickyNote className="h-4 w-4 text-primary" /> My Notes — {chapter.title}
              </p>
              <Button size="sm" variant="ghost" onClick={() => setShowNotes(false)}><X className="h-4 w-4" /></Button>
            </div>
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write your notes for this chapter…"
              className="min-h-[80px] text-sm resize-none bg-background"
            />
            <div className="flex justify-end mt-2 gap-2">
              <Button
                size="sm"
                onClick={() => saveNoteMutation.mutate(noteText)}
                disabled={saveNoteMutation.isPending}
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {saveNoteMutation.isPending ? "Saving…" : "Save Note"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chapter content */}
      <article className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-2 text-sm text-muted-foreground">
          Chapter {chapter.chapter_number} of {totalChapters}
        </div>
        <h1 className="font-serif text-3xl font-bold mb-4">{chapter.title}</h1>
        {user && highlights.length > 0 && (
          <p className="text-xs text-muted-foreground mb-8 flex items-center gap-1">
            <Highlighter className="h-3 w-3 text-yellow-500" />
            {highlights.length} highlight{highlights.length !== 1 ? "s" : ""} in this chapter — click any to remove
          </p>
        )}
        <div
          ref={contentRef}
          className="prose prose-lg max-w-none leading-relaxed"
          style={{ fontSize: `${fontSize}px` }}
        >
          {paragraphs.map((p, i) => renderParagraph(p, i))}
        </div>
      </article>

      {/* Book progress bar */}
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
              <Link to={`/books/${slug}`}>🎉 Finished! Back to Book</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookReader;
