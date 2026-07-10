// Fire-and-forget dispatcher for long-running SEO commands.
// The admin UI calls this instead of invoking the heavy function directly,
// so the browser never waits past the gateway timeout. The heavy job keeps
// running in the background via EdgeRuntime.waitUntil and its progress
// shows up in daily_run_log / seo_agent_logs.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const ALLOWED = new Set([
  "seo-daily-publisher",
  "seo-queue-topup",
  "seo-book-kb-refresh",
  "seo-blog-agent",
  "seo-gsc-sync",
  "seo-post-publish-hook",
  "seo-social-captions",
  "seo-auto-run",
]);

// deno-lint-ignore no-explicit-any
const runtime: any = (globalThis as any).EdgeRuntime;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let payload: { fn?: string; body?: unknown } = {};
  try { payload = await req.json(); } catch { /* empty body ok */ }

  const fn = String(payload.fn || "");
  if (!ALLOWED.has(fn)) {
    return new Response(JSON.stringify({ error: `Unknown or disallowed function: ${fn}` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const startedAt = new Date().toISOString();

  const task = (async () => {
    try {
      const r = await fetch(`${url}/functions/v1/${fn}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${svc}`,
          apikey: svc,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload.body ?? {}),
      });
      // Drain to release the connection; result is observed via app logs / tables.
      await r.text().catch(() => "");
    } catch (e) {
      console.error(`[seo-dispatch] background ${fn} failed:`, e);
    }
  })();

  if (runtime?.waitUntil) {
    runtime.waitUntil(task);
  }

  return new Response(
    JSON.stringify({ queued: true, fn, started_at: startedAt }),
    { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
