#!/usr/bin/env node
/**
 * Prerender + SEO validator.
 *
 * - Boots `vite preview` on port 4173
 * - Fetches book/article slugs and SEO-safe reader chapter content
 * - For every route: navigates via Playwright, waits for react-helmet-style
 *   head mutation, then snapshots the final <head> and rewrites
 *   `dist/<route>/index.html` so social-preview crawlers see route-specific
 *   title / description / canonical / og:* / twitter:* / JSON-LD.
 * - Fails (exit 1) if any route is missing required tags.
 *
 * Usage:
 *   node scripts/prerender-and-seo-check.mjs           # prerender + validate
 *   node scripts/prerender-and-seo-check.mjs --check   # validate only (no writes)
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";

const CHECK_ONLY = process.argv.includes("--check");
const NO_FAIL = process.argv.includes("--no-fail");
const DIST = resolve("dist");
const PORT = 4173;
const ORIGIN = `http://localhost:${PORT}`;
const BASE_URL = "https://gyandootnova.in";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  "https://vrzngahawxtbpwrgxtmb.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyem5nYWhhd3h0YnB3cmd4dG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDYxNjQsImV4cCI6MjA4NjYyMjE2NH0.f1ua55Aav2XbTx9QoYlR7B1WS_flsxR7o-hyu6aiYIY";

const STATIC_ROUTES = [
  "/",
  "/books",
  "/articles",
  "/about",
  "/services",
  "/contact",
  "/faq",
  "/testimonials",
  "/portfolio",
  "/careers",
  "/support",
  "/donate",
  "/support-us",
  "/privacy-policy",
  "/terms-conditions",
  "/refund-policy",
  "/shipping-policy",
];

async function fetchSlugs(table, filter = "") {

  const url = `${SUPABASE_URL}/rest/v1/${table}?select=slug${filter}`;

  const res = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) {
    console.warn(`[warn] ${table} fetch failed (${res.status})`);
    return [];
  }
  const rows = await res.json();
  return rows.map((r) => r.slug).filter(Boolean);
}

async function fetchSeoPrerenderPayload() {
  const url = `${SUPABASE_URL}/functions/v1/seo-prerender-data`;
  try {
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) {
      console.warn(`[warn] seo-prerender-data fetch failed (${res.status})`);
      return { books: [], chapters: [] };
    }
    const json = await res.json();
    return {
      books: Array.isArray(json?.books) ? json.books : [],
      chapters: Array.isArray(json?.chapters) ? json.chapters : [],
    };
  } catch (e) {
    console.warn(`[warn] seo-prerender-data fetch failed (${e.message})`);
    return { books: [], chapters: [] };
  }
}


function waitForServer(url, timeoutMs = 30_000) {
  const start = Date.now();
  return new Promise((res, rej) => {
    const tick = async () => {
      try {
        const r = await fetch(url);
        if (r.ok || r.status === 404) return res();
      } catch {}
      if (Date.now() - start > timeoutMs) return rej(new Error("preview timeout"));
      setTimeout(tick, 400);
    };
    tick();
  });
}

async function startPreview() {
  const proc = spawn("bunx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
  proc.stdout.on("data", () => {});
  proc.stderr.on("data", (d) => process.stderr.write(d));
  await waitForServer(ORIGIN);
  return proc;
}

const REQUIRED = [
  { name: "title", check: (h) => /<title>[^<]{5,}<\/title>/.test(h) },
  { name: "meta description", check: (h) => /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{20,}["']/i.test(h) },
  { name: "canonical", check: (h) => /<link[^>]+rel=["']canonical["'][^>]+href=["']https?:\/\/[^"']+["']/i.test(h) },
  { name: "og:title", check: (h) => /property=["']og:title["']/i.test(h) },
  { name: "og:description", check: (h) => /property=["']og:description["']/i.test(h) },
  { name: "og:url", check: (h) => /property=["']og:url["']/i.test(h) },
  { name: "og:image", check: (h) => /property=["']og:image["'][^>]+content=["']https?:\/\/[^"']+["']/i.test(h) },
  { name: "twitter:card", check: (h) => /name=["']twitter:card["']/i.test(h) },
  { name: "twitter:image", check: (h) => /name=["']twitter:image["'][^>]+content=["']https?:\/\/[^"']+["']/i.test(h) },
];

function extract(re, s) {
  const m = s.match(re);
  return m ? m[1].trim() : "";
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

function stripTags(s) {
  return String(s ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isHtml(s) {
  return /<\/?(p|div|span|strong|em|br|h[1-6]|ul|ol|li|blockquote|table|thead|tbody|tr|td|th|pre|code)\b/i.test(String(s ?? ""));
}

function textToHtml(text) {
  return String(text ?? "")
    .split(/\n{2,}/)
    .map((para) => `<p>${esc(para).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

function safeContentHtml(content) {
  const raw = String(content ?? "").trim();
  if (!raw) return "<p>इस अध्याय की सामग्री उपलब्ध नहीं है।</p>";
  if (!isHtml(raw)) return textToHtml(raw);
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\/h1>/gi, "</h2>")
    .replace(/<h1\b/gi, "<h2")
    .replace(/\son\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

function routePathForReader(row) {
  return `/${["books", row.book_slug, row.chapter_slug].map(encodeURIComponent).join("/")}`;
}

function renderReaderSnapshot(row) {
  const route = routePathForReader(row);
  const abs = `${BASE_URL}${route}`;
  const bookUrl = `${BASE_URL}/books/${encodeURIComponent(row.book_slug)}`;
  const title = `${row.chapter_title} — ${row.book_title} | GyandootNova`;
  const plainContent = stripTags(row.content);
  const plainBookDesc = stripTags(row.book_description);
  const description = `${row.book_title} ka ${row.chapter_title} Hindi mein padhein. ${plainContent || plainBookDesc}`.slice(0, 155);
  const image = row.cover_url || `${BASE_URL}/og-default.jpg`;
  const contentHtml = safeContentHtml(row.content);
  const h1 = esc(row.chapter_title);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": row.book_title,
    "inLanguage": "hi-IN",
    "author": { "@type": "Person", "name": row.author || "GyandootNova" },
    "description": plainBookDesc || description,
    "url": bookUrl,
    ...(row.cover_url ? { "image": row.cover_url } : {}),
    "workExample": {
      "@type": "Chapter",
      "name": row.chapter_title,
      "position": row.chapter_number,
      "url": abs,
    },
  };
  const head = `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <meta name="author" content="GyandootNova">
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
    <link rel="canonical" href="${esc(abs)}">
    <link rel="icon" href="/gyandoot-nova-icon.ico" type="image/x-icon">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:type" content="book">
    <meta property="og:url" content="${esc(abs)}">
    <meta property="og:image" content="${esc(image)}">
    <meta property="og:site_name" content="GyandootNova">
    <meta property="og:locale" content="hi_IN">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${esc(image)}">
    <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
  `;
  const rootHtml = `
    <main class="min-h-screen bg-background text-foreground">
      <article class="mx-auto max-w-3xl px-6 py-10">
        <p class="mb-2 text-sm text-muted-foreground">${esc(row.book_title)} · Chapter ${esc(row.chapter_number)}</p>
        <h1 class="font-serif text-3xl font-bold mb-4">${h1}</h1>
        <p class="mb-6 text-muted-foreground">${esc(row.author || "GyandootNova")}</p>
        <div class="secure-rich-reader max-w-none" data-prerendered-reader="true">
          ${contentHtml}
        </div>
        ${row.is_excerpt ? `<p class="mt-8 text-sm text-muted-foreground">यह SEO preview है। पूरा अध्याय पढ़ने के लिए GyandootNova reader में access unlock करें।</p>` : ""}
      </article>
    </main>
  `;
  return { head, rootHtml };
}

function validateHead(route, headHtml, seen) {
  const missing = REQUIRED.filter((r) => !r.check(headHtml)).map((r) => r.name);
  const title = extract(/<title>([^<]+)<\/title>/i, headHtml);
  const desc = extract(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i, headHtml);
  // Uniqueness — homepage title/desc must not repeat on inner routes.
  if (title && seen.titles.has(title) && seen.titles.get(title) !== route) {
    missing.push(`duplicate title (also on ${seen.titles.get(title)})`);
  } else if (title) seen.titles.set(title, route);
  if (desc && seen.descs.has(desc) && seen.descs.get(desc) !== route) {
    missing.push(`duplicate description (also on ${seen.descs.get(desc)})`);
  } else if (desc) seen.descs.set(desc, route);
  return missing;
}

function validateBody(route, rootHtml) {
  const problems = [];
  if (!rootHtml || rootHtml.length < 200) {
    problems.push(`empty/tiny #root (${rootHtml?.length ?? 0} chars)`);
  }
  const h1Count = (rootHtml.match(/<h1\b/gi) || []).length;
  if (h1Count === 0) problems.push("missing <h1>");
  else if (h1Count > 1) problems.push(`multiple <h1> (${h1Count})`);
  return problems;
}



async function snapshotRoute(page, route) {
  const url = `${ORIGIN}${route}`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
  // Give react-helmet-style hooks a tick to mutate head after data loads.
  await page.waitForTimeout(800);
  // Wait until canonical points at this route (best-effort).
  try {
    await page.waitForFunction(
      (expected) => {
        const c = document.querySelector('link[rel="canonical"]');
        return c && c.getAttribute("href")?.includes(expected);
      },
      route === "/" ? "gyandootnova.in" : route,
      { timeout: 4000 }
    );
  } catch {}
  return page.evaluate(() => ({
    head: document.head.innerHTML,
    rootHtml: document.getElementById("root")?.innerHTML ?? "",
  }));
}

async function writeRouteFile(route, baseHtml, snapshot) {
  // Replace the head content of the base index.html with the rendered head.
  let rewritten = baseHtml.replace(
    /<head>[\s\S]*?<\/head>/i,
    `<head>\n${snapshot.head}\n</head>`
  );
  // Inject the rendered body content into #root so crawlers (and users with
  // JS disabled) see real text without executing JavaScript. React will
  // hydrate on top of this markup on first client render.
  if (snapshot.rootHtml && snapshot.rootHtml.length > 20) {
    rewritten = rewritten.replace(
      /<div id="root"><\/div>/,
      `<div id="root">${snapshot.rootHtml}</div>`
    );
  }
  const targets = outputTargetsForRoute(route);
  for (const target of targets) {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, rewritten, "utf8");
  }
}

function outputTargetsForRoute(route) {
  if (route === "/") return [join(DIST, "index.html")];
  const rel = route.replace(/^\//, "");
  const variants = new Set([rel]);
  try { variants.add(decodeURIComponent(rel)); } catch {}
  const targets = new Set();
  for (const variant of variants) {
    targets.add(join(DIST, variant, "index.html"));
    targets.add(join(DIST, `${variant}.html`));
  }
  return Array.from(targets);
}

async function writeReaderRouteFile(row, baseHtml) {
  const route = routePathForReader(row);
  const snapshot = renderReaderSnapshot(row);
  await writeRouteFile(route, baseHtml, snapshot);
  return route;
}

async function main() {
  if (!existsSync(DIST)) {
    console.error("dist/ missing — run `bun run build` first.");
    process.exit(1);
  }
  const baseHtml = await readFile(join(DIST, "index.html"), "utf8");

  console.log("→ fetching dynamic slugs from Supabase…");
  const [bookSlugs, articleSlugs, readerRows] = await Promise.all([
    fetchSlugs("books"),
    fetchSlugs("posts", "&is_published=eq.true"),
    fetchSeoReaderRows(),
  ]);

  console.log(`  books=${bookSlugs.length}  reader-pages=${readerRows.length}  articles=${articleSlugs.length}`);

  const routes = [
    ...STATIC_ROUTES,
    ...bookSlugs.map((s) => `/books/${s}`),
    ...articleSlugs.map((s) => `/articles/${s}`),
  ];
  const readerRoutes = readerRows.map(routePathForReader);
  const allRoutesCount = routes.length + readerRoutes.length;
  console.log(`→ ${allRoutesCount} routes total (${CHECK_ONLY ? "check-only" : "prerender+check"})`);

  console.log("→ starting vite preview…");
  const preview = await startPreview();

  const failures = [];
  let processed = 0;
  try {
    // Auto-detect chromium if the packaged one isn't installed (e.g. sandbox)
    let execPath = process.env.CHROMIUM_PATH;
    if (!execPath) {
      const candidates = [
        "/chromium_headless_shell-1194/chrome-linux/headless_shell",
        "/chromium-1194/chrome-linux/chrome",
      ];
      for (const c of candidates) if (existsSync(c)) { execPath = c; break; }
    }
    const browser = await chromium.launch({ headless: true, executablePath: execPath || undefined });


    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent: "Mozilla/5.0 (compatible; LovableSEOBot/1.0)",
    });
    const page = await context.newPage();
    page.on("pageerror", () => {});

    const seen = { titles: new Map(), descs: new Map() };
    for (const route of routes) {
      try {
        const snapshot = await snapshotRoute(page, route);
        const missing = [
          ...validateHead(route, snapshot.head, seen),
          ...validateBody(route, snapshot.rootHtml),
        ];
        if (missing.length) {
          failures.push({ route, missing });
          console.log(`  ✗ ${route}  ${missing.join(", ")}`);
        } else {
          console.log(`  ✓ ${route}`);
        }
        if (!CHECK_ONLY) await writeRouteFile(route, baseHtml, snapshot);
      } catch (e) {
        failures.push({ route, missing: [`render error: ${e.message}`] });
        console.log(`  ✗ ${route}  ${e.message}`);
      }
      processed++;
    }

    for (const row of readerRows) {
      const route = routePathForReader(row);
      try {
        const snapshot = renderReaderSnapshot(row);
        const missing = [
          ...validateHead(route, snapshot.head, seen),
          ...validateBody(route, snapshot.rootHtml),
        ];
        if (missing.length) {
          failures.push({ route, missing });
          console.log(`  ✗ ${route}  ${missing.join(", ")}`);
        } else {
          console.log(`  ✓ ${route}`);
        }
        if (!CHECK_ONLY) await writeReaderRouteFile(row, baseHtml);
      } catch (e) {
        failures.push({ route, missing: [`render error: ${e.message}`] });
        console.log(`  ✗ ${route}  ${e.message}`);
      }
      processed++;
    }


    await browser.close();
  } finally {
    preview.kill("SIGTERM");
  }

  console.log(`\nDone: ${processed - failures.length}/${processed} routes OK`);
  if (failures.length) {
    console.error(`\nSEO failures on ${failures.length} route(s):`);
    failures.forEach((f) => console.error(`  ${f.route} — ${f.missing.join(", ")}`));
    if (!NO_FAIL) process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
