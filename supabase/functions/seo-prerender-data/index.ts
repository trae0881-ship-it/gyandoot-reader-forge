import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=900, s-maxage=900",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_LOCKED_EXCERPT_CHARS = 12000;

function stripTags(input: string) {
  return (input ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const [booksRes, chaptersRes] = await Promise.all([
      supabase
        .from("books")
        .select("id,title,slug,author,cover_url,description,is_free,preview_chapters,created_at,updated_at,file_type")
        .order("created_at", { ascending: false }),
      supabase
        .from("book_chapters")
        .select("id,book_id,title,slug,chapter_number,is_preview,content,updated_at")
        .order("chapter_number", { ascending: true }),
    ]);

    if (booksRes.error) throw booksRes.error;
    if (chaptersRes.error) throw chaptersRes.error;

    const books = booksRes.data ?? [];
    const bookById = new Map(books.map((book) => [book.id, book]));
    const chapters = (chaptersRes.data ?? [])
      .map((chapter) => {
        const book = bookById.get(chapter.book_id);
        if (!book?.slug || !chapter.slug) return null;
        const previewLimit = Number(book.preview_chapters ?? 0);
        const canExposeFull = Boolean(book.is_free || chapter.is_preview || chapter.chapter_number <= previewLimit);
        const rawContent = chapter.content ?? "";
        const content = canExposeFull ? rawContent : stripTags(rawContent).slice(0, MAX_LOCKED_EXCERPT_CHARS);

        return {
          book_id: book.id,
          book_title: book.title,
          book_slug: book.slug,
          author: book.author,
          cover_url: book.cover_url,
          book_description: book.description,
          is_free: book.is_free,
          preview_chapters: previewLimit,
          file_type: book.file_type,
          chapter_id: chapter.id,
          chapter_title: chapter.title,
          chapter_slug: chapter.slug,
          chapter_number: chapter.chapter_number,
          is_preview: chapter.is_preview,
          updated_at: chapter.updated_at ?? book.updated_at ?? book.created_at,
          content,
          is_excerpt: !canExposeFull,
        };
      })
      .filter(Boolean);

    return new Response(JSON.stringify({ generated_at: new Date().toISOString(), chapters }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers,
    });
  }
});