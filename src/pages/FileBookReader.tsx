import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, BookOpen, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import SecurePdfViewer from "@/components/SecurePdfViewer";

const FileBookReader = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // On sign out → immediately revoke access & redirect
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        // Clear all cached file URLs
        queryClient.removeQueries({ queryKey: ["book-file-url"] });
        navigate(`/books/${slug}`, { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [queryClient, navigate, slug]);

  const { data: book } = useQuery({
    queryKey: ["book", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("books")
        .select("id, title, slug, author, file_type, is_free, price")
        .eq("slug", slug!)
        .single();
      return data;
    },
    enabled: !!slug,
  });

  const { data: fileData, isLoading, error } = useQuery({
    queryKey: ["book-file-url", book?.id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-book-file-url", {
        body: { book_id: book!.id },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data as { url: string; file_type: string };
    },
    enabled: !!book?.id && !authLoading,
    // Short stale time - URL expires in 5 min
    staleTime: 4 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    // Refetch when window regains focus to keep URL fresh
    refetchOnWindowFocus: true,
  });

  // Prevent right-click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  // Prevent keyboard shortcuts for saving/printing/developer tools
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Block Ctrl+S, Ctrl+P, Ctrl+Shift+I, F12
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "p" || e.key === "S" || e.key === "P")) {
        e.preventDefault();
        return false;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j")) {
        e.preventDefault();
        return false;
      }
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Block drag & drop events globally
  useEffect(() => {
    const handler = (e: DragEvent) => {
      e.preventDefault();
    };
    document.addEventListener("dragstart", handler);
    document.addEventListener("drop", handler);
    return () => {
      document.removeEventListener("dragstart", handler);
      document.removeEventListener("drop", handler);
    };
  }, []);

  if (authLoading || !book) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const fileType = fileData?.file_type ?? book.file_type ?? "";
  const isImage = ["jpeg", "jpg", "png", "webp"].includes(fileType);
  const isPdf = fileType === "pdf";
  const isDoc = ["doc", "docx"].includes(fileType);

  // Watermark text — user email for traceability
  const watermarkText = user?.email || "GyandootNova";

  const WatermarkOverlay = () => (
    <div
      className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
      aria-hidden="true"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 180px,
            rgba(0,0,0,0.03) 180px,
            rgba(0,0,0,0.03) 181px
          )`,
        }}
      />
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 4 }).map((_, col) => (
          <span
            key={`${row}-${col}`}
            className="absolute text-[11px] font-medium whitespace-nowrap"
            style={{
              top: `${12 + row * 12}%`,
              left: `${5 + col * 28}%`,
              transform: "rotate(-35deg)",
              opacity: 0.07,
              color: darkMode ? "#ffffff" : "#000000",
              letterSpacing: "2px",
              pointerEvents: "none",
            }}
          >
            {watermarkText}
          </span>
        ))
      )}
    </div>
  );

  return (
    <div
      className={`min-h-screen select-none ${darkMode ? "bg-gray-900 text-gray-100" : "bg-background text-foreground"}`}
      style={{ WebkitUserSelect: "none", userSelect: "none" }}
    >
      {/* Toolbar */}
      <div className={`sticky top-0 z-40 border-b px-4 py-2 ${darkMode ? "border-gray-700 bg-gray-900/95" : "bg-background/95 backdrop-blur"}`}>
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/books/${slug}`}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">{book.title}</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase">{fileType}</span>
            <Button variant="ghost" size="sm" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? "☀️" : "🌙"}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading book file...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-destructive font-medium">{(error as Error).message}</p>
            {!user && (
              <p className="text-sm text-muted-foreground">Please sign in to read this book.</p>
            )}
            <Button asChild variant="outline">
              <Link to={`/books/${slug}`}>Back to Book</Link>
            </Button>
          </div>
        )}

        {fileData?.url && isPdf && (
          <div className="relative">
            <SecurePdfViewer url={fileData.url} title={book.title} darkMode={darkMode} />
            <WatermarkOverlay />
          </div>
        )}

        {fileData?.url && isImage && (
          <div className="relative flex justify-center">
            <img
              src={fileData.url}
              alt={book.title}
              className="max-w-full rounded-lg shadow-lg pointer-events-none"
              style={{ maxHeight: "calc(100vh - 100px)" }}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            />
            <WatermarkOverlay />
          </div>
        )}

        {fileData?.url && isDoc && (
          <div className="relative" onContextMenu={(e) => e.preventDefault()}>
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileData.url)}`}
              className="w-full rounded-lg border border-border"
              style={{ height: "calc(100vh - 100px)" }}
              title={book.title}
            />
            <WatermarkOverlay />
          </div>
        )}

        {fileData?.url && !isPdf && !isImage && !isDoc && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">This file format ({fileType}) cannot be previewed inline.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileBookReader;
