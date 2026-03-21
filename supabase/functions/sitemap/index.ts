import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600",
};

const BASE_URL = "https://gyandootnova.in";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  // Fetch books and posts
  const [booksRes, postsRes] = await Promise.all([
    supabase.from("books").select("slug, updated_at").order("created_at", { ascending: false }),
    supabase.from("posts").select("slug, updated_at").eq("is_published", true).order("created_at", { ascending: false }),
  ]);

  const books = booksRes.data ?? [];
  const posts = postsRes.data ?? [];

  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/books", priority: "0.9", changefreq: "daily" },
    { loc: "/articles", priority: "0.9", changefreq: "daily" },
    { loc: "/about", priority: "0.7", changefreq: "monthly" },
    { loc: "/contact", priority: "0.6", changefreq: "monthly" },
    { loc: "/services", priority: "0.7", changefreq: "monthly" },
    { loc: "/faq", priority: "0.5", changefreq: "monthly" },
    { loc: "/donate", priority: "0.6", changefreq: "monthly" },
    { loc: "/testimonials", priority: "0.5", changefreq: "monthly" },
  ];

  let urls = staticPages.map(
    (p) => `  <url><loc>${BASE_URL}${p.loc}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`
  );

  for (const book of books) {
    const lastmod = book.updated_at ? `<lastmod>${book.updated_at.split("T")[0]}</lastmod>` : "";
    urls.push(`  <url><loc>${BASE_URL}/books/${book.slug}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.8</priority></url>`);
  }

  for (const post of posts) {
    const lastmod = post.updated_at ? `<lastmod>${post.updated_at.split("T")[0]}</lastmod>` : "";
    urls.push(`  <url><loc>${BASE_URL}/articles/${post.slug}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.7</priority></url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, { headers: corsHeaders });
});
