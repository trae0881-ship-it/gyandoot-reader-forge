import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
  "Access-Control-Allow-Origin": "*",
};

const BASE_URL = "https://gyandootnova.in";

const encPath = (path: string) =>
  "/" + path.split("/").filter(Boolean).map(encodeURIComponent).join("/");

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!
  );

  const [booksRes, postsRes, chaptersRes] = await Promise.all([
    supabase.from("books").select("id, slug, updated_at").order("created_at", { ascending: false }),
    supabase.from("posts").select("slug, updated_at").eq("is_published", true).order("created_at", { ascending: false }),
    supabase.from("book_chapters").select("book_id, slug, updated_at, is_preview, chapter_number").order("chapter_number", { ascending: true }),
  ]);

  const books = booksRes.data ?? [];
  const posts = postsRes.data ?? [];
  const chapters = chaptersRes.data ?? [];
  const bookSlugById = new Map((books as Array<{ id?: string; slug?: string }>).filter((b) => b.id && b.slug).map((b) => [b.id!, b.slug!]));

  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/books", priority: "0.9", changefreq: "daily" },
    { loc: "/articles", priority: "0.9", changefreq: "daily" },
    { loc: "/about", priority: "0.7", changefreq: "monthly" },
    { loc: "/services", priority: "0.7", changefreq: "monthly" },
    { loc: "/contact", priority: "0.6", changefreq: "monthly" },
    { loc: "/faq", priority: "0.5", changefreq: "monthly" },
    { loc: "/donate", priority: "0.6", changefreq: "monthly" },
    { loc: "/testimonials", priority: "0.5", changefreq: "monthly" },
    { loc: "/portfolio", priority: "0.5", changefreq: "monthly" },
    { loc: "/careers", priority: "0.4", changefreq: "monthly" },
    { loc: "/support", priority: "0.4", changefreq: "monthly" },
    { loc: "/support-us", priority: "0.5", changefreq: "monthly" },
    { loc: "/sitemap", priority: "0.3", changefreq: "monthly" },
    { loc: "/keywords", priority: "0.7", changefreq: "weekly" },
    { loc: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
    { loc: "/terms-conditions", priority: "0.3", changefreq: "yearly" },
    { loc: "/refund-policy", priority: "0.3", changefreq: "yearly" },
    { loc: "/shipping-policy", priority: "0.3", changefreq: "yearly" },
  ];

  const today = new Date().toISOString().split("T")[0];
  const urls: string[] = staticPages.map(
    (p) => `  <url><loc>${BASE_URL}${p.loc}</loc><lastmod>${today}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`
  );

  for (const book of books) {
    const lastmod = book.updated_at ? book.updated_at.split("T")[0] : today;
    urls.push(`  <url><loc>${BASE_URL}${encPath(`/books/${book.slug}`)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
  }

  for (const chapter of chapters) {
    const bookSlug = bookSlugById.get(chapter.book_id);
    if (!bookSlug || !chapter.slug) continue;
    const lastmod = chapter.updated_at ? chapter.updated_at.split("T")[0] : today;
    urls.push(`  <url><loc>${BASE_URL}${encPath(`/books/${bookSlug}/${chapter.slug}`)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>${chapter.is_preview ? "0.65" : "0.5"}</priority></url>`);
  }

  for (const post of posts) {
    const lastmod = post.updated_at ? post.updated_at.split("T")[0] : today;
    urls.push(`  <url><loc>${BASE_URL}${encPath(`/articles/${post.slug}`)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, { headers });
});
