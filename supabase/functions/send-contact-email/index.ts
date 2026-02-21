import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const ADMIN_EMAIL = "contact@gyandootnova.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, email, subject, message } = await req.json();
    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ error: "All fields are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const html = `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #fafaf8; border-radius: 12px; overflow: hidden;">
        <div style="background: #8B1A1A; padding: 24px 32px;">
          <h1 style="color: #fff; margin: 0; font-size: 20px;">📩 New Contact Message</h1>
        </div>
        <div style="padding: 32px;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr><td style="padding: 8px 0; color: #888; width: 80px;">Name</td><td style="padding: 8px 0; font-weight: 600;">${name}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #8B1A1A;">${email}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Subject</td><td style="padding: 8px 0; font-weight: 600;">${subject}</td></tr>
          </table>
          <div style="background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
            <p style="margin: 0 0 8px; color: #888; font-size: 12px; text-transform: uppercase;">Message</p>
            <p style="margin: 0; line-height: 1.7; color: #333;">${message.replace(/\n/g, "<br>")}</p>
          </div>
          <p style="margin-top: 24px; font-size: 12px; color: #aaa;">Sent from GyandootNova Contact Form</p>
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "GyandootNova <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        reply_to: email,
        subject: `Contact: ${subject}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
