// Temporary diagnostic: verifies Resend domain status for the SEO report sender.
Deno.serve(async () => {
  const key = Deno.env.get("RESEND_API_KEY") || "";
  if (!key) return new Response(JSON.stringify({ error: "no key" }), { status: 500 });
  const res = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${key}` },
  });
  const body = await res.text();
  return new Response(JSON.stringify({ status: res.status, body: body.slice(0, 2000) }), {
    headers: { "Content-Type": "application/json" },
  });
});
