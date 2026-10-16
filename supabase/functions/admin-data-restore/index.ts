import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ error: "Unauthorized" }, 401);

    // Admin gate: same RPC as export (denies non-admins); also gives the allowed table list
    const { data: schemaInfo, error: sErr } = await userClient.rpc("admin_export_schema");
    if (sErr) return json({ error: "Access denied" }, 403);
    const allowed = new Set<string>((schemaInfo as any)?.tables ?? []);
    const { data: colData } = await userClient.rpc("admin_export_columns");
    const cols = new Map<string, { data_type: string; is_primary_key: boolean }>();
    const pks: Record<string, string[]> = {};
    for (const c of (colData as any[]) ?? []) {
      cols.set(`${c.table_name}.${c.column_name}`, c);
      if (c.is_primary_key) (pks[c.table_name] ||= []).push(c.column_name);
    }

    const body = await req.json().catch(() => null);
    const table = String(body?.table ?? "");
    const rows = body?.rows;
    const mode = body?.mode === "insert" ? "insert" : "upsert";
    if (!allowed.has(table)) return json({ error: `Unknown table: ${table}` }, 400);
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > 1000) return json({ error: "rows must be 1-1000 items" }, 400);

    const clean = rows.map((r: Record<string, unknown>) => {
      const o: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(r ?? {})) {
        const c = cols.get(`${table}.${k}`);
        if (!c) continue; // drop unknown columns
        if ((c.data_type === "json" || c.data_type === "jsonb") && typeof v === "string") {
          try { o[k] = JSON.parse(v); } catch { o[k] = v; }
        } else o[k] = v;
      }
      return o;
    });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const pk = pks[table]?.join(",");
    const q = mode === "upsert" && pk
      ? admin.from(table).upsert(clean, { onConflict: pk })
      : admin.from(table).upsert(clean, { onConflict: pk, ignoreDuplicates: true });
    const { error } = await q;
    if (error) return json({ ok: false, table, error: error.message }, 200);
    return json({ ok: true, table, count: clean.length });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
