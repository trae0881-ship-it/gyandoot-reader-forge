import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

function q(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (Array.isArray(v)) {
    const inner = v
      .map((x) => (x === null ? "NULL" : `"${String(x).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`))
      .join(",");
    return `'{${inner.replace(/'/g, "''")}}'`;
  }
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is an admin, using their own JWT (RLS + admin_export_schema guard)
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: schemaInfo, error: schemaErr } = await userClient.rpc("admin_export_schema");
    if (schemaErr) {
      return new Response(JSON.stringify({ error: "Access denied", details: schemaErr.message }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tables: string[] = (schemaInfo as any)?.tables ?? [];
    const ddl: string = (schemaInfo as any)?.ddl ?? "";

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const stamp = new Date().toISOString();

    const stream = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder();
        const push = (s: string) => controller.enqueue(enc.encode(s));

        push(
          `-- Gyandoot Nova — full data export\n-- Generated: ${stamp}\n` +
            `-- Portable SQL: run this file on any PostgreSQL-compatible database.\n\n` +
            `BEGIN;\n\n-- =====================\n-- 1) TABLE STRUCTURE\n-- =====================\n\n`,
        );
        push(ddl + "\n");
        push(`-- =====================\n-- 2) DATA\n-- =====================\n\n`);

        for (const table of tables) {
          push(`\n-- Table: ${table}\n`);
          let from = 0;
          const size = 500;
          let total = 0;
          for (;;) {
            const { data, error } = await admin
              .from(table)
              .select("*")
              .range(from, from + size - 1);
            if (error) {
              push(`-- ERROR reading ${table}: ${error.message}\n`);
              break;
            }
            if (!data || data.length === 0) break;
            for (const row of data) {
              const cols = Object.keys(row);
              const vals = cols.map((c) => q((row as any)[c]));
              push(
                `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${vals.join(", ")});\n`,
              );
            }
            total += data.length;
            if (data.length < size) break;
            from += size;
          }
          push(`-- ${total} row(s) exported from ${table}\n`);
        }

        push(`\nCOMMIT;\n`);
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/sql; charset=utf-8",
        "Content-Disposition": `attachment; filename="gyandoot-full-export-${stamp.slice(0, 10)}.sql"`,
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
