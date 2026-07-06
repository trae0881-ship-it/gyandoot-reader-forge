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
 *   --concurrency=<n>       Max parallel requests (default: 6). Auto-throttles on 429.
 *   --min-concurrency=<n>   Floor for adaptive throttling (default: 1).
 *   --retries=<n>           Max retries per URL on 429/5xx (default: 3).
 *   --backoff=<ms>          Base backoff in ms; exponential + jitter (default: 500).
 *   --min-words=<n>         Minimum visible words per page (default: 60).
 *   --selector=<css>        Required content selector, repeatable
 *                           (default: main, article).
 *   --header="K: V"         Extra request header, repeatable
 *                           (e.g. --header="Authorization: Bearer xyz").
 *   --user-agent=<str>      Override the User-Agent header.
 *   --cookie=<str>          Add a Cookie header (shortcut for --header="Cookie: ...").
 *   --skip-og-check         Skip the og:image / twitter:image HEAD probe.
 *   --skip-jsonld-check     Skip JSON-LD schema validation.
 *   --schema-rule=<pat>=<T>:<a,b,c>
 *                           Override JSON-LD expectations for URL pattern <pat>
 *                           (glob-like: /books/*). Repeatable. Example:
 *                             --schema-rule="/books/*=Book:name,inLanguage,author,isbn"
 *                             --schema-rule="/articles/*=Article:headline,datePublished,author,image"
 *                             --schema-rule="/faq=FAQPage:mainEntity"
 *   --report=<path>         JSON report path (default: dist/seo-live-report.json).
 *   --html=<path>           HTML report path (default: dist/seo-live-report.html).
 *   --no-html               Do not emit the HTML report.
 *   --github-summary        Append a compact table to $GITHUB_STEP_SUMMARY and
 *                           emit ::error:: annotations for failing routes.
 *   --resume=<path>         Reuse a previous JSON report; skip URLs that
 *                           passed there (default: off). Pair with --report to
 *                           point at the same file.
 *
 * Single-page curl (for spot checks):
 *   curl -sA "Googlebot" https://gyandootnova.in/books/rigved \
 *     | grep -E "<title|og:image|<h1|name=\"description\""
 */
import { writeFileSync, mkdirSync, appendFileSync, readFileSync, existsSync } from "node:fs";
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
const MAX_CONCURRENCY = Math.max(1, parseInt(opt("concurrency", "6"), 10));
const MIN_CONCURRENCY = Math.max(1, parseInt(opt("min-concurrency", "1"), 10));
const RETRIES = Math.max(0, parseInt(opt("retries", "3"), 10));
const BACKOFF = Math.max(50, parseInt(opt("backoff", "500"), 10));
const MIN_WORDS = Math.max(0, parseInt(opt("min-words", "60"), 10));
const SELECTORS = many("selector").length ? many("selector") : ["main", "article"];
const SKIP_OG = flag("skip-og-check");
const SKIP_JSONLD = flag("skip-jsonld-check");
const REPORT = opt("report", "dist/seo-live-report.json");
const HTML_REPORT = flag("no-html") ? null : opt("html", "dist/seo-live-report.html");
const GITHUB_SUMMARY = flag("github-summary") || !!process.env.GITHUB_STEP_SUMMARY;
const RESUME = opt("resume", "");
const DEFAULT_UA = "Mozilla/5.0 (compatible; GyandootSEOVerifier/1.0; +https://gyandootnova.in)";
const UA = opt("user-agent", DEFAULT_UA);

const EXTRA_HEADERS = { "User-Agent": UA, Accept: "text/html,*/*" };
for (const h of many("header")) {
  const idx = h.indexOf(":");
  if (idx > 0) EXTRA_HEADERS[h.slice(0, idx).trim()] = h.slice(idx + 1).trim();
}
const cookie = opt("cookie", "");
if (cookie) EXTRA_HEADERS["Cookie"] = cookie;

// Parse --schema-rule flags into ordered [pattern, {type, required[]}] pairs.
// First matching pattern wins; user rules take precedence over defaults.
function parseSchemaRule(raw) {
  const eq = raw.indexOf("=");
  if (eq < 0) return null;
  const pattern = raw.slice(0, eq).trim();
  const rhs = raw.slice(eq + 1).trim();
  const colon = rhs.indexOf(":");
  const type = colon < 0 ? rhs : rhs.slice(0, colon).trim();
  const required = colon < 0 ? [] : rhs.slice(colon + 1).split(",").map((s) => s.trim()).filter(Boolean);
  return { pattern, type, required };
}
function globToRegExp(glob) {
  const esc = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${esc}$`);
}
const USER_SCHEMA_RULES = many("schema-rule").map(parseSchemaRule).filter(Boolean)
  .map((r) => ({ ...r, re: globToRegExp(r.pattern) }));
const DEFAULT_SCHEMA_RULES = [
  { pattern: "/books/*", type: "Book", required: ["name", "inLanguage", "author"], re: globToRegExp("/books/*") },
  { pattern: "/articles/*", type: "Article", required: ["headline", "datePublished", "author"], re: globToRegExp("/articles/*") },
];
const SCHEMA_RULES_ORDERED = [...USER_SCHEMA_RULES, ...DEFAULT_SCHEMA_RULES];

// ---------- resume mode ----------
const RESUMED_PASSING = new Set();
if (RESUME && existsSync(RESUME)) {
  try {
    const prev = JSON.parse(readFileSync(RESUME, "utf8"));
    for (const r of prev.results || []) {
      if (!(r.problems && r.problems.length)) RESUMED_PASSING.add(r.url);
    }
    console.log(`↺ resume: ${RESUMED_PASSING.size} URL(s) previously passing will be skipped (${RESUME})`);
  } catch (e) {
    console.warn(`⚠ resume: could not parse ${RESUME}: ${e.message}`);
  }
}

// ---------- helpers ----------
const pick = (re, s) => { const m = s.match(re); return m ? m[1].trim() : ""; };
const countMatches = (re, s) => (s.match(re) || []).length;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


// ---------- adaptive throttle ----------
// Reduce concurrency when sustained 429s appear; ramp back up after quiet window.
const throttle = {
  current: MAX_CONCURRENCY,
  recent429: 0,           // rolling count of 429s in the last window
  lastAdjustAt: Date.now(),
  cooldownUntil: 0,       // wall-clock when we may attempt to ramp back up
  windowMs: 5000,
  rampUpMs: 10_000,
};
function note429() {
  throttle.recent429++;
  const now = Date.now();
  if (throttle.recent429 >= 3 && throttle.current > MIN_CONCURRENCY) {
    const next = Math.max(MIN_CONCURRENCY, Math.floor(throttle.current / 2));
    console.log(`  ⚠︎ sustained 429s — lowering concurrency ${throttle.current} → ${next}`);
    throttle.current = next;
    throttle.cooldownUntil = now + throttle.rampUpMs;
    throttle.recent429 = 0;
    throttle.lastAdjustAt = now;
  }
}
function note2xx() {
  const now = Date.now();
  if (now - throttle.lastAdjustAt > throttle.windowMs) throttle.recent429 = 0;
  if (now >= throttle.cooldownUntil && throttle.current < MAX_CONCURRENCY) {
    throttle.current = Math.min(MAX_CONCURRENCY, throttle.current + 1);
    console.log(`  ↑ ramping concurrency back up → ${throttle.current}`);
    throttle.cooldownUntil = now + throttle.rampUpMs;
  }
}

async function httpFetch(url, { method = "GET" } = {}) {
  let attempt = 0;
  const t0 = Date.now();
  while (true) {
    try {
      const r = await fetch(url, { method, headers: EXTRA_HEADERS, redirect: "manual" });
      const retriable = r.status === 429 || (r.status >= 500 && r.status <= 599);
      if (r.status === 429) note429();
      else if (r.status >= 200 && r.status < 400) note2xx();
      if (retriable && attempt < RETRIES) {
        const retryAfter = parseInt(r.headers.get("retry-after") || "0", 10) * 1000;
        const wait = retryAfter || (BACKOFF * 2 ** attempt + Math.floor(Math.random() * 200));
        await sleep(wait);
        attempt++;
        continue;
      }
      const body = method === "HEAD" ? "" : await r.text().catch(() => "");
      return { status: r.status, body, redirect: r.headers.get("location") || "", attempts: attempt + 1, ms: Date.now() - t0 };
    } catch (e) {
      if (attempt < RETRIES) { await sleep(BACKOFF * 2 ** attempt); attempt++; continue; }
      return { status: 0, body: "", redirect: "", attempts: attempt + 1, ms: Date.now() - t0, error: e.message };
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

// ---------- JSON-LD schema validation ----------
// Resolves the schema expectation for a URL using the ordered rule list
// (user rules first, then defaults). Returns null if no rule matches.
function ruleFor(url) {
  const path = new URL(url).pathname;
  for (const r of SCHEMA_RULES_ORDERED) if (r.re.test(path)) return r;
  return null;
}
function extractJsonLd(html) {
  const blocks = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
  const parsed = [];
  for (const b of blocks) {
    try {
      const raw = JSON.parse(b[1].trim());
      const items = Array.isArray(raw) ? raw : raw["@graph"] ? raw["@graph"] : [raw];
      for (const it of items) if (it && typeof it === "object") parsed.push(it);
    } catch { /* malformed block */ }
  }
  return parsed;
}
function validateJsonLd(url, html) {
  const problems = [];
  const blocks = extractJsonLd(html);
  const foundTypes = new Set(blocks.map((b) => Array.isArray(b["@type"]) ? b["@type"][0] : b["@type"]).filter(Boolean));
  const rule = ruleFor(url);
  if (rule) {
    const block = blocks.find((b) => (Array.isArray(b["@type"]) ? b["@type"].includes(rule.type) : b["@type"] === rule.type));
    if (!block) {
      problems.push(`missing JSON-LD @type=${rule.type} (rule: ${rule.pattern})`);
    } else {
      const missing = rule.required.filter((k) => block[k] === undefined || block[k] === "" || block[k] === null);
      if (missing.length) problems.push(`JSON-LD ${rule.type} missing: ${missing.join(", ")}`);
    }
  }
  return { problems, jsonldTypes: Array.from(foundTypes), appliedRule: rule ? rule.pattern : null };
}

function selectorPresent(rootHtml, sel) {
  if (sel.startsWith(".")) {
    const cls = sel.slice(1).replace(/[^\w-]/g, "");
    return new RegExp(`class=["'][^"']*\\b${cls}\\b`, "i").test(rootHtml);
  }
  const tag = sel.replace(/[^\w-]/g, "");
  return new RegExp(`<${tag}\\b`, "i").test(rootHtml);
}

// Canonical URL must match the URL we fetched (ignoring trailing slash and
// hash). Both origin-swap and homepage-pointing bugs get caught here.
function canonicalMismatch(fetchedUrl, canonicalHref) {
  if (!canonicalHref) return null;
  const norm = (u) => {
    try {
      const x = new URL(u);
      let p = x.pathname.replace(/\/+$/, "");
      if (p === "") p = "/";
      return `${x.origin}${p}`;
    } catch { return null; }
  };
  const a = norm(fetchedUrl);
  const b = norm(canonicalHref);
  if (!a || !b) return `canonical URL not parseable (${canonicalHref})`;
  if (a !== b) return `canonical mismatch — fetched ${a}, canonical ${b}`;
  return null;
}

function auditPage(url, html) {
  const problems = [];
  const title = pick(/<title>([^<]+)<\/title>/i, html);
  const desc = pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i, html);
  const ogImage = pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i, html);
  const ogUrl = pick(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i, html);
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
  const canonProblem = canonicalMismatch(url, canonical);
  if (canonProblem) problems.push(canonProblem);
  const ogUrlProblem = ogUrl ? canonicalMismatch(url, ogUrl) : null;
  if (ogUrlProblem) problems.push(`og:url ${ogUrlProblem.replace(/^canonical /, "")}`);
  if (rootHtml.length < 200) problems.push(`empty #root (${rootHtml.length} chars)`);
  if (wordCount < MIN_WORDS) problems.push(`only ${wordCount} words in #root (min ${MIN_WORDS})`);
  if (missingSelectors.length) problems.push(`missing content selector(s): ${missingSelectors.join(", ")}`);
  if (h1Count === 0) problems.push("missing <h1>");
  else if (h1Count > 1) problems.push(`multiple <h1> (${h1Count})`);

  let jsonldTypes = [];
  let appliedRule = null;
  if (!SKIP_JSONLD) {
    const j = validateJsonLd(url, html);
    problems.push(...j.problems);
    jsonldTypes = j.jsonldTypes;
    appliedRule = j.appliedRule;
  }

  return { url, title, desc, ogImage, ogUrl, twImage, twCard, canonical, h1Count, wordCount, missingSelectors, jsonldTypes, appliedRule, problems };
}

async function checkAssetExists(assetUrl) {
  if (!assetUrl) return { ok: false, status: 0, ms: 0, reason: "missing url" };
  const abs = assetUrl.startsWith("http") ? assetUrl : `${ORIGIN}${assetUrl.startsWith("/") ? "" : "/"}${assetUrl}`;
  const t0 = Date.now();
  let r = await httpFetch(abs, { method: "HEAD" });
  if (r.status === 405 || r.status === 0) r = await httpFetch(abs, { method: "GET" });
  return { ok: r.status >= 200 && r.status < 400, status: r.status, ms: Date.now() - t0, url: abs };
}


// Adaptive worker pool — reads throttle.current on every task pick so
// concurrency can grow/shrink mid-run.
async function withAdaptiveConcurrency(items, worker) {
  const results = new Array(items.length);
  let i = 0;
  let active = 0;
  return await new Promise((resolveAll) => {
    const spawn = () => {
      while (active < throttle.current && i < items.length) {
        const idx = i++;
        active++;
        Promise.resolve(worker(items[idx], idx))
          .then((v) => { results[idx] = v; })
          .finally(() => {
            active--;
            if (i >= items.length && active === 0) resolveAll(results);
            else spawn();
          });
      }
    };
    spawn();
  });
}


// ---------- HTML report ----------
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function renderHtmlReport(summary) {
  const rows = summary.results.map((r) => {
    const bad = r.problems?.length ? "fail" : "pass";
    const diffs = (r.problems || []).map((p) => `<li>${esc(p)}</li>`).join("");
    const og = r.ogImageCheck ? `${r.ogImageCheck.status} · ${r.ogImageCheck.ms ?? "-"}ms` : "—";
    const tw = r.twImageCheck ? `${r.twImageCheck.status} · ${r.twImageCheck.ms ?? "-"}ms` : "—";
    const skipped = r.skipped ? ' <span title="resumed from previous report">↺</span>' : "";
    return `<tr class="${bad}">
      <td class="url"><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.url)}</a>${skipped}</td>
      <td>${r.status ?? "-"}</td>
      <td>${r.fetchMs ?? "-"}</td>
      <td>${r.h1Count ?? "-"}</td>
      <td>${r.wordCount ?? "-"}</td>
      <td class="mono">${esc(r.title || "")}</td>
      <td class="mono">${og}</td>
      <td class="mono">${tw}</td>
      <td>${diffs ? `<ul>${diffs}</ul>` : "✓"}</td>
    </tr>`;
  }).join("\n");

  const timings = summary.results.map((r) => r.fetchMs).filter((n) => typeof n === "number").sort((a, b) => a - b);
  const p = (q) => timings.length ? timings[Math.min(timings.length - 1, Math.floor(timings.length * q))] : 0;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>SEO Live Report — ${esc(summary.origin)}</title>
<style>
  body { font: 14px/1.5 system-ui, sans-serif; margin: 24px; color:#111; background:#fafafa; }
  h1 { margin:0 0 4px; font-size:22px; }
  .meta { color:#666; margin-bottom:16px; font-size:13px; }
  .stats { display:flex; gap:16px; margin-bottom:16px; flex-wrap:wrap; }
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
<div class="meta">Origin: <b>${esc(summary.origin)}</b> · Generated ${esc(summary.generatedAt)} · Concurrency ${summary.maxConcurrency} (final ${summary.finalConcurrency}) · Min words ${summary.minWords}${summary.resumed ? ` · resumed ${summary.resumed} URL(s)` : ""}</div>
<div class="stats">
  <div class="stat ok">✓ ${summary.total - summary.failed} passing</div>
  <div class="stat bad">✗ ${summary.failed} failing</div>
  <div class="stat">Σ ${summary.total} routes</div>
  <div class="stat">fetch p50 ${p(0.5)}ms · p95 ${p(0.95)}ms · max ${timings[timings.length - 1] || 0}ms</div>
</div>
<table>
<thead><tr><th>URL</th><th>Status</th><th>Fetch ms</th><th>H1</th><th>Words</th><th>Title</th><th>og:image</th><th>twitter:image</th><th>Problems</th></tr></thead>
<tbody>${rows}</tbody></table>
</body></html>`;
}


// ---------- GitHub Actions integration ----------
function emitGitHubAnnotations(results) {
  // ::error:: annotations show up on the PR "Files changed" / checks view.
  for (const r of results) {
    if (!r.problems?.length) continue;
    const msg = r.problems.join(" | ").replace(/\n/g, " ");
    console.log(`::error title=SEO failure: ${r.url}::${msg}`);
  }
}
function emitGitHubStepSummary(summary) {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (!path) return;
  const failing = summary.results.filter((r) => r.problems?.length);
  const rows = failing.length
    ? failing.map((r) => `| ${r.url} | ${r.status ?? "-"} | ${r.h1Count ?? "-"} | ${r.wordCount ?? "-"} | ${(r.problems || []).map((p) => p.replace(/\|/g, "\\|")).join("<br>")} |`).join("\n")
    : "_All routes passing._";
  const md = [
    `## SEO Live Report — \`${summary.origin}\``,
    ``,
    `**${summary.total - summary.failed}/${summary.total} passing** · concurrency ${summary.maxConcurrency} · min-words ${summary.minWords} · retries ${summary.retries}`,
    ``,
    `### ${summary.failed} failing route${summary.failed === 1 ? "" : "s"}`,
    ``,
    `| URL | Status | H1 | Words | Problems |`,
    `|---|---|---|---|---|`,
    rows,
    ``,
    `Full HTML/JSON reports are attached as workflow artifacts (\`seo-live-report\`).`,
    ``,
  ].join("\n");
  appendFileSync(path, md);
}

// ---------- main ----------
async function main() {
  console.log(`→ verifying ${ORIGIN}  (max-concurrency=${MAX_CONCURRENCY} min=${MIN_CONCURRENCY} retries=${RETRIES} min-words=${MIN_WORDS})`);
  const urls = await loadSitemap();
  console.log(`  sitemap: ${urls.length} URLs`);

  const seenTitles = new Map();
  const seenDescs = new Map();
  let done = 0;

  const results = await withAdaptiveConcurrency(urls, async (url) => {
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
    console.log(`  [${done}/${urls.length}] (c=${throttle.current}) ${mark} ${url}${entry.problems?.length ? " — " + entry.problems.join("; ") : ""}`);
    return entry;
  });

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
    maxConcurrency: MAX_CONCURRENCY,
    minConcurrency: MIN_CONCURRENCY,
    finalConcurrency: throttle.current,
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
  if (GITHUB_SUMMARY) {
    emitGitHubAnnotations(results);
    emitGitHubStepSummary(summary);
  }
  console.log(`${results.length - failed}/${results.length} URLs pass all checks`);
  if (failed) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });

