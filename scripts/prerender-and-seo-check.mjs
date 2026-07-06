#!/usr/bin/env node
/**
 * Prerender + SEO validator.
 *
 * - Boots `vite preview` on port 4173
 * - Fetches book/article slugs from Supabase REST (anon key)
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
import { resolve, join } from "node:path";

const CHECK_ONLY = process.argv.includes("--check");
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
  { name: "twitter:card", check: (h) => /name=["']twitter:card["']/i.test(h) },
];

function validateHead(route, headHtml) {
  const missing = REQUIRED.filter((r) => !r.check(headHtml)).map((r) => r.name);
  return missing;
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
  const outDir =
    route === "/" ? DIST : join(DIST, route.replace(/^\//, ""));
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, "index.html"), rewritten, "utf8");
}

async function main() {
  if (!existsSync(DIST)) {
    console.error("dist/ missing — run `bun run build` first.");
    process.exit(1);
  }
  const baseHtml = await readFile(join(DIST, "index.html"), "utf8");

  console.log("→ fetching dynamic slugs from Supabase…");
  const [bookSlugs, articleSlugs] = await Promise.all([
    fetchSlugs("books"),
    fetchSlugs("posts", "&is_published=eq.true"),
  ]);

  console.log(`  books=${bookSlugs.length}  articles=${articleSlugs.length}`);

  const routes = [
    ...STATIC_ROUTES,
    ...bookSlugs.map((s) => `/books/${s}`),
    ...articleSlugs.map((s) => `/articles/${s}`),
  ];
  console.log(`→ ${routes.length} routes total (${CHECK_ONLY ? "check-only" : "prerender+check"})`);

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

    for (const route of routes) {
      try {
        const headInner = await snapshotRoute(page, route);
        const missing = validateHead(route, headInner);
        if (missing.length) {
          failures.push({ route, missing });
          console.log(`  ✗ ${route}  missing: ${missing.join(", ")}`);
        } else {
          console.log(`  ✓ ${route}`);
        }
        if (!CHECK_ONLY) await writeRouteFile(route, baseHtml, headInner);
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
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
