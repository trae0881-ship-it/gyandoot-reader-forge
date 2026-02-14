import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { gateway, order_id, payment_id, signature, type } = await req.json();

    if (!order_id || !type) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (gateway === "razorpay") {
      return await verifyRazorpay(supabase, user, order_id, payment_id, signature, type);
    } else if (gateway === "paypal") {
      return await verifyPaypal(supabase, user, order_id, type);
    } else {
      return new Response(JSON.stringify({ error: "Unsupported gateway" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("verify-payment error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function verifyRazorpay(
  supabase: any, user: any, orderId: string, paymentId: string, signature: string, type: string
) {
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!keySecret) {
    return new Response(JSON.stringify({ error: "Razorpay not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!paymentId || !signature) {
    return new Response(JSON.stringify({ error: "Missing payment_id or signature" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify signature using HMAC SHA256
  const body = orderId + "|" + paymentId;
  const key = new TextEncoder().encode(keySecret);
  const msg = new TextEncoder().encode(body);
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, msg);
  const expectedSignature = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");

  if (expectedSignature !== signature) {
    console.error("Razorpay signature mismatch");
    return new Response(JSON.stringify({ error: "Payment verification failed" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Update record
  const table = type === "purchase" ? "purchases" : "donations";
  const { error: updateError } = await supabase
    .from(table)
    .update({
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      status: "completed",
    })
    .eq("razorpay_order_id", orderId)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("DB update error:", updateError);
    return new Response(JSON.stringify({ error: "Failed to update payment record" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Increment purchase count for books
  if (type === "purchase") {
    const { data: purchase } = await supabase
      .from("purchases")
      .select("book_id")
      .eq("razorpay_order_id", orderId)
      .single();
    if (purchase?.book_id) {
      await supabase.rpc("increment_purchase_count", { _book_id: purchase.book_id }).catch(() => {
        // Non-critical, log and continue
        console.warn("Could not increment purchase count");
      });
    }
  }

  return new Response(
    JSON.stringify({ success: true, message: "Payment verified" }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function verifyPaypal(supabase: any, user: any, orderId: string, type: string) {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({ error: "PayPal not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Get access token
  const tokenRes = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${clientId}:${clientSecret}`),
    },
    body: "grant_type=client_credentials",
  });
  const { access_token } = await tokenRes.json();

  // Capture the order
  const captureRes = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
  });

  if (!captureRes.ok) {
    console.error("PayPal capture error:", await captureRes.text());
    return new Response(JSON.stringify({ error: "PayPal capture failed" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const captureData = await captureRes.json();

  if (captureData.status !== "COMPLETED") {
    return new Response(JSON.stringify({ error: "Payment not completed" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Update record
  const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id || "";
  const table = type === "purchase" ? "purchases" : "donations";
  const { error: updateError } = await supabase
    .from(table)
    .update({
      razorpay_payment_id: captureId, // reusing column for PayPal capture ID
      status: "completed",
    })
    .eq("razorpay_order_id", orderId)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("DB update error:", updateError);
    return new Response(JSON.stringify({ error: "Failed to update payment record" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ success: true, message: "Payment verified" }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
