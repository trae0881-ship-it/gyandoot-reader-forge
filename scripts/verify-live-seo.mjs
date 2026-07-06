#!/usr/bin/env node
/**
 * Live SEO verifier — pure HTTP (no JS execution).
 *
 * Usage:
 *   node scripts/verify-live-seo.mjs [origin] [options]
 *   ORIGIN=https://foo.com node scripts/verify-live-seo.mjs
 *
 * Options:
 *   --origin=<url>          Target origin (default: https://gyandootnova.in).
 *   --concurrency=<n>       Parallel requests (default: 6).
 *   --retries=<n>           Max retries per URL on 429/5xx (default: 3).
 *   --backoff=<ms>          Base backoff in ms; exponential (default: 500).
 *   --min-words=<n>         Minimum visible words per page (default: 60).
 *   --selector=<css>        Required content selector, repeatable
 *                           (default: main, article).
 *   --skip-og-check         Skip the og:image / twitter:image HEAD probe.
 *   --report=<path>         JSON report path (default: dist/seo-live-report.json).
 *   --html=<path>           HTML report path (default: dist/seo-live-report.html).
 *   --no-html               Do not emit the HTML report.
 *
 * Single-page curl (for spot checks):
 *   curl -sA "Googlebot" https://gyandootnova.in/books/rigved \
 *     | grep -E "<title|og:image|<h1|name=\"description\""
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// ---------- CLI ----------
const args = process.argv.slice(2);
const positional = args.find((a) => !a.startsWith("--"));
const opt = (name, def) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
};
const flag = (name) => args.includes(`--${name}`);
const many = (name) => args.filter((a) => a.startsWith(`--${name}=`)).map((a) => a.slice(name.length + 3));

const ORIGIN = (opt("origin", positional || process.env.ORIGIN || "https://gyandootnova.in")).replace(/\/$/, "");
const CONCURRENCY = Math.max(1, parseInt(opt("concurrency", "6"), 10));
const RETRIES = Math.max(0, parseInt(opt("retries", "3"), 10));
const BACKOFF = Math.max(50, parseInt(opt("backoff", "500"), 10));
const MIN_WORDS = Math.max(0, parseInt(opt("min-words", "60"), 10));
const SELECTORS = many("selector").length ? many("selector") : ["main", "article"];
const SKIP_OG = flag("skip-og-check");
const REPORT = opt("report", "dist/seo-live-report.json");
const HTML_REPORT = flag("no-html") ? null : opt("html", "dist/seo-live-report.html");
const UA = "Mozilla/5.0 (compatible; GyandootSEOVerifier/1.0; +https://gyandootnova.in)";

// ---------- helpers ----------
const pick = (re, s) => { const m = s.match(re); return m ? m[1].trim() : ""; };
const countMatches = (re, s) => (s.match(re) || []).length;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function httpFetch(url, { method = "GET" } = {}) {
  let attempt = 0;
  while (true) {
    try {
      const r = await fetch(url, {
        method,
        headers: { "User-Agent": UA, Accept: "text/html,*/*" },
        redirect: "manual",
      });
      const retriable = r.status === 429 || (r.status >= 500 && r.status <= 599);
      if (retriable && attempt < RETRIES) {
        const wait = BACKOFF * 2 ** attempt + Math.floor(Math.random() * 100);
        await sleep(wait);
        attempt++;
        continue;
      }
      const body = method === "HEAD" ? "" : await r.text().catch(() => "");
      return { status: r.status, body, redirect: r.headers.get("location") || "", attempts: attempt + 1 };
    } catch (e) {
      if (attempt < RETRIES) { await sleep(BACKOFF * 2 ** attempt); attempt++; continue; }
      return { status: 0, body: "", redirect: "", attempts: attempt + 1, error: e.message };
    }
  }
}

async function loadSitemap() {
  const { status, body } = await httpFetch(`${ORIGIN}/sitemap.xml`);
  if (status !== 200) throw new Error(`sitemap.xml → HTTP ${status}`);
  return Array.from(body.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
}

function extractRoot(html) {
  const m = html.match(/<div id="root">([\s\S]*?)<\/div>\s*<script/i);
  return m ? m[1] : "";
}
function stripTags(s) { return s.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function selectorPresent(rootHtml, sel) {
  // Very small CSS matcher: only supports bare tag names or `.class`
  if (sel.startsWith(".")) {
    const cls = sel.slice(1).replace(/[^\w-]/g, "");
    return new RegExp(`class=["'][^"']*\\b${cls}\\b`, "i").test(rootHtml);
  }
  const tag = sel.replace(/[^\w-]/g, "");
  return new RegExp(`<${tag}\\b`, "i").test(rootHtml);
}

function auditPage(url, html) {
  const problems = [];
  const title = pick(/<title>([^<]+)<\/title>/i, html);
  const desc = pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i, html);
  const ogImage = pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i, html);
  const twImage = pick(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i, html);
  const twCard = pick(/<meta[^>]+name=["']twitter:card["'][^>]+content=["']([^"']+)["']/i, html);
  const canonical = pick(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i, html);
  const rootHtml = extractRoot(html);
  const h1Count = countMatches(/<h1\b/gi, html);
  const visibleText = stripTags(rootHtml);
  const wordCount = visibleText ? visibleText.split(/\s+/).length : 0;
  const missingSelectors = SELECTORS.filter((s) => !selectorPresent(rootHtml, s));

  if (!title) problems.push("no <title>");
  if (!desc) problems.push("no meta description");
  if (!ogImage) problems.push("no og:image");
  if (!twCard) problems.push("no twitter:card");
  if (!canonical) problems.push("no canonical");
  if (rootHtml.length < 200) problems.push(`empty #root (${rootHtml.length} chars)`);
  if (wordCount < MIN_WORDS) problems.push(`only ${wordCount} words in #root (min ${MIN_WORDS})`);
  if (missingSelectors.length) problems.push(`missing content selector(s): ${missingSelectors.join(", ")}`);
  if (h1Count === 0) problems.push("missing <h1>");
  else if (h1Count > 1) problems.push(`multiple <h1> (${h1Count})`);

  return { url, title, desc, ogImage, twImage, twCard, canonical, h1Count, wordCount, missingSelectors, problems };
}

async function checkAssetExists(assetUrl) {
  if (!assetUrl) return { ok: false, status: 0, reason: "missing url" };
  const abs = assetUrl.startsWith("http") ? assetUrl : `${ORIGIN}${assetUrl.startsWith("/") ? "" : "/"}${assetUrl}`;
  let r = await httpFetch(abs, { method: "HEAD" });
  // Some CDNs reject HEAD → retry as GET (no body kept)
  if (r.status === 405 || r.status === 0) r = await httpFetch(abs, { method: "GET" });
  return { ok: r.status >= 200 && r.status < 400, status: r.status, url: abs };
}

async function withConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; results[idx] = await worker(items[idx], idx); }
  }));
  return results;
}

// ---------- HTML report ----------
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function renderHtmlReport(summary) {
  const rows = summary.results.map((r) => {
    const bad = r.problems?.length ? "fail" : "pass";
    const diffs = (r.problems || []).map((p) => `<li>${esc(p)}</li>`).join("");
    const og = r.ogImageCheck ? `${r.ogImageCheck.status} ${esc(r.ogImageCheck.url || "")}` : "—";
    const tw = r.twImageCheck ? `${r.twImageCheck.status} ${esc(r.twImageCheck.url || "")}` : "—";
    return `<tr class="${bad}">
      <td class="url"><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.url)}</a></td>
      <td>${r.status ?? "-"}</td>
      <td>${r.h1Count ?? "-"}</td>
      <td>${r.wordCount ?? "-"}</td>
      <td class="mono">${esc(r.title || "")}</td>
      <td class="mono">${og}</td>
      <td class="mono">${tw}</td>
      <td>${diffs ? `<ul>${diffs}</ul>` : "✓"}</td>
    </tr>`;
  }).join("\n");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>SEO Live Report — ${esc(summary.origin)}</title>
<style>
  body { font: 14px/1.5 system-ui, sans-serif; margin: 24px; color:#111; background:#fafafa; }
  h1 { margin:0 0 4px; font-size:22px; }
  .meta { color:#666; margin-bottom:16px; font-size:13px; }
  .stats { display:flex; gap:16px; margin-bottom:16px; }
  .stat { background:#fff; padding:10px 14px; border-radius:6px; border:1px solid #e5e5e5; }
  .stat.ok { border-color:#16a34a; color:#166534; }
  .stat.bad { border-color:#dc2626; color:#991b1b; }
  table { width:100%; border-collapse:collapse; background:#fff; font-size:13px; }
  th, td { padding:8px 10px; border-bottom:1px solid #eee; vertical-align:top; text-align:left; }
  th { background:#f3f4f6; position:sticky; top:0; }
  tr.fail td { background:#fef2f2; }
  tr.pass td { background:#f0fdf4; }
  .mono { font-family: ui-monospace, Menlo, monospace; font-size:12px; word-break:break-all; }
  .url { max-width:340px; word-break:break-all; }
  ul { margin:0; padding-left:18px; color:#991b1b; }
</style></head><body>
<h1>SEO Live Report</h1>
<div class="meta">Origin: <b>${esc(summary.origin)}</b> · Generated ${esc(summary.generatedAt)} · Concurrency ${summary.concurrency} · Min words ${summary.minWords}</div>
<div class="stats">
  <div class="stat ok">✓ ${summary.total - summary.failed} passing</div>
  <div class="stat bad">✗ ${summary.failed} failing</div>
  <div class="stat">Σ ${summary.total} routes</div>
</div>
<table>
<thead><tr><th>URL</th><th>Status</th><th>H1</th><th>Words</th><th>Title</th><th>og:image</th><th>twitter:image</th><th>Problems</th></tr></thead>
<tbody>${rows}</tbody></table>
</body></html>`;
}

// ---------- main ----------
async function main() {
  console.log(`→ verifying ${ORIGIN}  (concurrency=${CONCURRENCY} retries=${RETRIES} min-words=${MIN_WORDS})`);
  const urls = await loadSitemap();
  console.log(`  sitemap: ${urls.length} URLs`);

  const seenTitles = new Map();
  const seenDescs = new Map();
  let done = 0;

  const results = await withConcurrency(urls, CONCURRENCY, async (url) => {
    const { status, body, redirect, attempts } = await httpFetch(url);
    let entry;
    if (status !== 200) {
      entry = { url, status, attempts, problems: [`HTTP ${status}${redirect ? ` → ${redirect}` : ""}`] };
    } else {
      const audit = auditPage(url, body);
      entry = { status, attempts, ...audit };
      if (!SKIP_OG) {
        const [og, tw] = await Promise.all([checkAssetExists(audit.ogImage), checkAssetExists(audit.twImage)]);
        entry.ogImageCheck = og;
        entry.twImageCheck = tw;
        if (audit.ogImage && !og.ok) entry.problems.push(`og:image not reachable (HTTP ${og.status})`);
        if (audit.twImage && !tw.ok) entry.problems.push(`twitter:image not reachable (HTTP ${tw.status})`);
      }
    }
    done++;
    const mark = entry.problems?.length ? "✗" : "✓";
    console.log(`  [${done}/${urls.length}] ${mark} ${url}${entry.problems?.length ? " — " + entry.problems.join("; ") : ""}`);
    return entry;
  });

  // Uniqueness pass (sequential, deterministic)
  for (const r of results) {
    if (r.title) {
      if (seenTitles.has(r.title) && seenTitles.get(r.title) !== r.url) {
        r.problems.push(`duplicate title (also ${seenTitles.get(r.title)})`);
      } else seenTitles.set(r.title, r.url);
    }
    if (r.desc) {
      if (seenDescs.has(r.desc) && seenDescs.get(r.desc) !== r.url) {
        r.problems.push(`duplicate description (also ${seenDescs.get(r.desc)})`);
      } else seenDescs.set(r.desc, r.url);
    }
  }

  const failed = results.filter((r) => r.problems?.length).length;
  const summary = {
    origin: ORIGIN,
    generatedAt: new Date().toISOString(),
    concurrency: CONCURRENCY,
    retries: RETRIES,
    minWords: MIN_WORDS,
    selectors: SELECTORS,
    total: results.length,
    failed,
    results,
  };

  mkdirSync(dirname(REPORT), { recursive: true });
  writeFileSync(REPORT, JSON.stringify(summary, null, 2));
  console.log(`\nJSON report → ${REPORT}`);
  if (HTML_REPORT) {
    mkdirSync(dirname(HTML_REPORT), { recursive: true });
    writeFileSync(HTML_REPORT, renderHtmlReport(summary));
    console.log(`HTML report → ${HTML_REPORT}`);
  }
  console.log(`${results.length - failed}/${results.length} URLs pass all checks`);
  if (failed) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
