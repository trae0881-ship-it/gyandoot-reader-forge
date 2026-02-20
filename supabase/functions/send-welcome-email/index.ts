import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, display_name } = await req.json();
    if (!email) return new Response(JSON.stringify({ error: "Missing email" }), { status: 400, headers: corsHeaders });

    const name = display_name || email.split("@")[0];

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f9f9;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">

                <!-- Header -->
                <tr>
                  <td style="background-color:#8B1A1A;padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#F5C518;font-family:Georgia,serif;font-size:26px;font-weight:700;letter-spacing:0.5px;">GyandootNova</h1>
                    <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">ज्ञान का सफर शुरू होता है यहाँ से</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px;">
                    <h2 style="margin:0 0 16px;font-size:20px;color:#1a1a1a;font-family:Georgia,serif;">
                      Welcome aboard, ${name}! 🎉
                    </h2>
                    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
                      Thank you for joining <strong>GyandootNova</strong> — your digital home for books, knowledge, and personal growth.
                    </p>
                    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
                      Here's what you can do right away:
                    </p>

                    <!-- Feature list -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                          <span style="font-size:18px;">📚</span>
                          <span style="margin-left:12px;font-size:14px;color:#374151;">Explore our collection of books and free chapters</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                          <span style="font-size:18px;">🔖</span>
                          <span style="margin-left:12px;font-size:14px;color:#374151;">Bookmark chapters and track your reading progress</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                          <span style="font-size:18px;">✍️</span>
                          <span style="margin-left:12px;font-size:14px;color:#374151;">Take notes and highlight important passages</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;">
                          <span style="font-size:18px;">🎓</span>
                          <span style="margin-left:12px;font-size:14px;color:#374151;">Read insightful articles from our knowledge hub</span>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA -->
                    <div style="text-align:center;margin:28px 0;">
                      <a href="https://gyandoot-reader-forge.lovable.app/books"
                         style="background-color:#8B1A1A;color:#F5C518;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:700;display:inline-block;letter-spacing:0.3px;">
                        Start Reading →
                      </a>
                    </div>

                    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
                      Need help? Reply to this email and we'll be happy to assist.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;">© 2025 GyandootNova. All rights reserved.</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#d1d5db;">You received this email because you created an account on GyandootNova.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: "GyandootNova <onboarding@resend.dev>",
      to: [email],
      subject: `Welcome to GyandootNova, ${name}! 🎉`,
      html,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Welcome email error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
