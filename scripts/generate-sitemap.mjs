#!/usr/bin/env node
/**
 * Build-time sitemap generator.
 * Fetches all public book + article slugs from Supabase REST and writes
 * public/sitemap.xml (which vite copies into dist/ at build time).
 * Runs via `prebuild`.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE_URL = "https://gyandootnova.in";
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://vrzngahawxtbpwrgxtmb.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyem5nYWhhd3h0YnB3cmd4dG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDYxNjQsImV4cCI6MjA4NjYyMjE2NH0.f1ua55Aav2XbTx9QoYlR7B1WS_flsxR7o-hyu6aiYIY";

const STATIC = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/books", changefreq: "daily", priority: "0.9" },
  { path: "/articles", changefreq: "daily", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/services", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.5" },
  { path: "/donate", changefreq: "monthly", priority: "0.6" },
  { path: "/support-us", changefreq: "monthly", priority: "0.5" },
  { path: "/testimonials", changefreq: "monthly", priority: "0.5" },
  { path: "/portfolio", changefreq: "monthly", priority: "0.5" },
  { path: "/careers", changefreq: "monthly", priority: "0.4" },
  { path: "/support", changefreq: "monthly", priority: "0.4" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms-conditions", changefreq: "yearly", priority: "0.3" },
  { path: "/refund-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/shipping-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/sitemap", changefreq: "monthly", priority: "0.3" },
];

async function fetchRows(table, select) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${select}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!r.ok) {
    console.warn(`[sitemap] ${table} fetch failed (${r.status})`);
    return [];
  }
  return r.json();
}

function xmlEscape(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function encPath(p) {
  return "/" + p.split("/").filter(Boolean).map(encodeURIComponent).join("/");
}

function entry({ path, lastmod, changefreq, priority }) {
  return [
    "  <url>",
    `    <loc>${xmlEscape(BASE_URL + path)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    "  </url>",
  ].filter(Boolean).join("\n");
}

async function main() {
  const [books, posts] = await Promise.all([
    fetchRows("books", "slug,updated_at"),
    fetchRows("posts", "slug,updated_at,is_published"),
  ]);
  const bookEntries = books
    .filter((b) => b.slug)
    .map((b) => ({
      path: encPath(`/books/${b.slug}`),
      lastmod: b.updated_at?.slice(0, 10),
      changefreq: "weekly",
      priority: "0.8",
    }));
  const postEntries = posts
    .filter((p) => p.slug && p.is_published !== false)
    .map((p) => ({
      path: encPath(`/articles/${p.slug}`),
      lastmod: p.updated_at?.slice(0, 10),
      changefreq: "weekly",
      priority: "0.7",
    }));

  const all = [...STATIC, ...bookEntries, ...postEntries];
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...all.map(entry),
    "</urlset>",
  ].join("\n");

  writeFileSync(resolve("public/sitemap.xml"), xml);
  console.log(
    `sitemap.xml written: ${all.length} entries (${STATIC.length} static + ${bookEntries.length} books + ${postEntries.length} articles)`
  );
}

main().catch((e) => {
  console.error("[sitemap] generation failed:", e);
  process.exit(1);
});
