import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  // Verify admin role
  const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: user.id, _role: "admin" });
  if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

  const url = new URL(req.url);

  if (req.method === "GET") {
    const userId = url.searchParams.get("user_id");

    if (userId) {
      // Get single user history
      const [purchases, donations, reading, bookmarks] = await Promise.all([
        supabaseAdmin.from("purchases").select("*, books(title, slug)").eq("user_id", userId).order("created_at", { ascending: false }),
        supabaseAdmin.from("donations").select("id, amount, status, donor_name, donor_email, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
        supabaseAdmin.from("reading_progress").select("*, books(title, slug)").eq("user_id", userId).order("updated_at", { ascending: false }),
        supabaseAdmin.from("bookmarks").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);

      return new Response(JSON.stringify({
        purchases: purchases.data ?? [],
        donations: donations.data ?? [],
        reading: reading.data ?? [],
        bookmarks: bookmarks.data ?? [],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // List all users
    const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 500 });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });

    // Get profiles and roles
    const [profiles, roles] = await Promise.all([
      supabaseAdmin.from("profiles").select("user_id, display_name, avatar_url"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);

    const profileMap = Object.fromEntries((profiles.data ?? []).map((p) => [p.user_id, p]));
    const roleMap = Object.fromEntries((roles.data ?? []).map((r) => [r.user_id, r.role]));

    const users = authUsers.users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      banned_until: u.banned_until,
      display_name: profileMap[u.id]?.display_name ?? null,
      role: roleMap[u.id] ?? "user",
    }));

    return new Response(JSON.stringify({ users }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const { user_id, action } = body;

    if (!user_id || !action) return new Response(JSON.stringify({ error: "Missing user_id or action" }), { status: 400, headers: corsHeaders });

    if (action === "disable") {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, { ban_duration: "876600h" });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    } else if (action === "enable") {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, { ban_duration: "none" });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
});
