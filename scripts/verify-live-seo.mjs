#!/usr/bin/env node
/**
 * Live SEO verifier — pure HTTP (no JS execution).
 *
 * Fetches sitemap.xml, then GETs every URL and confirms:
 *   • HTTP 200 (flags 404 / 5xx / redirects)
 *   • #root contains real body content (not empty shell)
 *   • Exactly one <h1>
 *   • Unique <title> and <meta name="description">
 *   • Per-page <meta property="og:image"> and <meta name="twitter:card">
 *
 * Usage:
 *   node scripts/verify-live-seo.mjs                          # default: https://gyandootnova.in
 *   node scripts/verify-live-seo.mjs https://staging.tld      # custom origin
 *   ORIGIN=https://foo.com node scripts/verify-live-seo.mjs
 *
 * Also usable as a raw curl command for a single page:
 *   curl -sA "Googlebot" https://gyandootnova.in/books/rigved \
 *     | grep -E "<title|og:image|<h1|<meta name=\"description\""
 */
import { writeFileSync } from "node:fs";

const ORIGIN = (process.argv[2] || process.env.ORIGIN || "https://gyandootnova.in").replace(/\/$/, "");
const UA = "Mozilla/5.0 (compatible; GyandootSEOVerifier/1.0; +https://gyandootnova.in)";

const pick = (re, s) => { const m = s.match(re); return m ? m[1].trim() : ""; };
const countMatches = (re, s) => (s.match(re) || []).length;

async function fetchText(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html,*/*" }, redirect: "manual" });
  const body = await r.text().catch(() => "");
  return { status: r.status, body, redirect: r.headers.get("location") || "" };
}

async function loadSitemap() {
  const url = `${ORIGIN}/sitemap.xml`;
  const { status, body } = await fetchText(url);
  if (status !== 200) throw new Error(`sitemap.xml → HTTP ${status}`);
  const urls = Array.from(body.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
  return urls;
}

function auditPage(url, html) {
  const problems = [];
  const title = pick(/<title>([^<]+)<\/title>/i, html);
  const desc = pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i, html);
  const ogImage = pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i, html);
  const twCard = pick(/<meta[^>]+name=["']twitter:card["'][^>]+content=["']([^"']+)["']/i, html);
  const canonical = pick(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i, html);
  const rootMatch = html.match(/<div id="root">([\s\S]*?)<\/div>\s*<script/i);
  const rootHtml = rootMatch ? rootMatch[1] : "";
  const h1Count = countMatches(/<h1\b/gi, html);
  const visibleTextLen = rootHtml.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().length;

  if (!title) problems.push("no <title>");
  if (!desc) problems.push("no meta description");
  if (!ogImage) problems.push("no og:image");
  if (!twCard) problems.push("no twitter:card");
  if (!canonical) problems.push("no canonical");
  if (rootHtml.length < 200) problems.push(`empty #root (${rootHtml.length} chars)`);
  if (visibleTextLen < 100) problems.push(`no visible text (${visibleTextLen} chars)`);
  if (h1Count === 0) problems.push("missing <h1>");
  else if (h1Count > 1) problems.push(`multiple <h1> (${h1Count})`);

  return { url, title, desc, ogImage, twCard, canonical, h1Count, visibleTextLen, problems };
}

async function main() {
  console.log(`→ verifying ${ORIGIN}`);
  const urls = await loadSitemap();
  console.log(`  sitemap: ${urls.length} URLs`);

  const results = [];
  const seenTitles = new Map();
  const seenDescs = new Map();

  for (const url of urls) {
    const { status, body, redirect } = await fetchText(url);
    if (status !== 200) {
      results.push({ url, status, problems: [`HTTP ${status}${redirect ? ` → ${redirect}` : ""}`] });
      console.log(`  ✗ ${status}  ${url}`);
      continue;
    }
    const audit = auditPage(url, body);
    if (audit.title) {
      if (seenTitles.has(audit.title) && seenTitles.get(audit.title) !== url) {
        audit.problems.push(`duplicate title (also ${seenTitles.get(audit.title)})`);
      } else seenTitles.set(audit.title, url);
    }
    if (audit.desc) {
      if (seenDescs.has(audit.desc) && seenDescs.get(audit.desc) !== url) {
        audit.problems.push(`duplicate description (also ${seenDescs.get(audit.desc)})`);
      } else seenDescs.set(audit.desc, url);
    }
    results.push({ url, status, ...audit });
    const mark = audit.problems.length ? "✗" : "✓";
    console.log(`  ${mark} ${url}${audit.problems.length ? "  — " + audit.problems.join("; ") : ""}`);
  }

  const failed = results.filter((r) => r.problems?.length).length;
  const report = { origin: ORIGIN, generatedAt: new Date().toISOString(), total: results.length, failed, results };
  writeFileSync("dist/seo-live-report.json", JSON.stringify(report, null, 2));
  console.log(`\n${results.length - failed}/${results.length} URLs pass all checks — report → dist/seo-live-report.json`);
  if (failed) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
