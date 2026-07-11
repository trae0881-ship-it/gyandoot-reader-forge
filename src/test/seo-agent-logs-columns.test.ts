// Regression test: guard against querying non-existent columns on
// `seo_agent_logs`. The actual timestamp column is `run_at`; a past bug
// used `created_at` and broke Admin SEO Command + daily health report.
//
// We now also allow `created_at` because a generated-column alias was
// added to the table for backward-compat. Any *other* unknown column
// on this table in code should trip this test.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");
const SEARCH_DIRS = ["src", "supabase/functions"];
const EXTS = [".ts", ".tsx"];

// Known columns on public.seo_agent_logs (see migration
// 20260706090700_*.sql) plus `created_at` alias (generated column).
const ALLOWED_COLUMNS = new Set([
  "id",
  "run_at",
  "created_at", // generated alias of run_at
  "topic",
  "focus_keyword",
  "action",
  "status",
  "post_id",
  "slug",
  "similarity_score",
  "matched_slug",
  "sources",
  "internal_links",
  "external_links",
  "word_count",
  "reading_time_min",
  "error",
  "meta",
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      walk(full, out);
    } else if (EXTS.some((e) => full.endsWith(e))) {
      // skip this test file itself and generated supabase types
      if (full.includes("seo-agent-logs-columns.test.")) continue;
      if (full.endsWith("supabase/types.ts")) continue;
      out.push(full);
    }
  }
  return out;
}

/** Very small heuristic parser: find calls that reference
 * `seo_agent_logs` and, within a short window, capture column-like
 * arguments passed to .select/.order/.gte/.lte/.eq/.filter. */
function extractColumnRefs(src: string): string[] {
  const cols: string[] = [];
  const re = /seo_agent_logs[\s\S]{0,600}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const chunk = m[0];
    // .select("a, b, c")
    for (const s of chunk.matchAll(/\.select\(\s*["'`]([^"'`]+)["'`]/g)) {
      for (const c of s[1].split(",")) {
        const name = c.trim().split(/\s|\(/)[0];
        if (name && name !== "*") cols.push(name);
      }
    }
    // .order("x") / .gte("x", ...) / .lte / .eq / .filter
    for (const s of chunk.matchAll(
      /\.(?:order|gte|lte|gt|lt|eq|neq|filter|is|in)\(\s*["'`]([a-zA-Z0-9_]+)["'`]/g,
    )) {
      cols.push(s[1]);
    }
  }
  return cols;
}

describe("seo_agent_logs column references", () => {
  it("only uses known columns", () => {
    const bad: { file: string; column: string }[] = [];
    for (const dir of SEARCH_DIRS) {
      const abs = join(ROOT, dir);
      try {
        statSync(abs);
      } catch {
        continue;
      }
      for (const file of walk(abs)) {
        const src = readFileSync(file, "utf8");
        if (!src.includes("seo_agent_logs")) continue;
        for (const col of extractColumnRefs(src)) {
          if (!ALLOWED_COLUMNS.has(col)) {
            bad.push({ file: file.replace(ROOT + "/", ""), column: col });
          }
        }
      }
    }
    expect(bad, `Unknown seo_agent_logs columns: ${JSON.stringify(bad, null, 2)}`).toEqual([]);
  });
});
