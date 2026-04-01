import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, BookOpen, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

const FileBookReader = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

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
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  // Prevent right-click to discourage downloading
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  // Prevent keyboard shortcuts for saving/printing
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "p" || e.key === "S" || e.key === "P")) {
        e.preventDefault();
        return false;
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
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
          <iframe
            src={`${fileData.url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
            className="w-full rounded-lg border border-border"
            style={{ height: "calc(100vh - 100px)" }}
            title={book.title}
          />
        )}

        {fileData?.url && isImage && (
          <div className="flex justify-center">
            <img
              src={fileData.url}
              alt={book.title}
              className="max-w-full rounded-lg shadow-lg pointer-events-none"
              style={{ maxHeight: "calc(100vh - 100px)" }}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            />
          </div>
        )}

        {fileData?.url && isDoc && (
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileData.url)}`}
            className="w-full rounded-lg border border-border"
            style={{ height: "calc(100vh - 100px)" }}
            title={book.title}
          />
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
