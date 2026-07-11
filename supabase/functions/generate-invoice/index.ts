// Generates a PDF invoice for a user's own purchase.
// Auth-required: verifies JWT and only returns invoices for the caller's own purchases.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { jsPDF } from "npm:jspdf@2.5.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    // Verify JWT via user client
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;
    const userEmail = userData.user.email ?? "";

    const url = new URL(req.url);
    const purchaseId = url.searchParams.get("purchase_id");
    if (!purchaseId) return json({ error: "purchase_id required" }, 400);

    // Use service role to fetch, but scope by user_id
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: purchase, error: pErr } = await admin
      .from("purchases")
      .select("id, user_id, book_id, razorpay_payment_id, razorpay_order_id, status, created_at, amount, currency, coupon_id")
      .eq("id", purchaseId)
      .eq("user_id", userId)
      .maybeSingle();

    if (pErr || !purchase) return json({ error: "Purchase not found" }, 404);
    if (purchase.status !== "completed") {
      return json({ error: "Invoice available only for completed purchases" }, 400);
    }

    const [{ data: book }, { data: profile }, { data: coupon }] = await Promise.all([
      admin.from("books").select("title, author").eq("id", purchase.book_id).maybeSingle(),
      admin.from("profiles").select("display_name").eq("user_id", userId).maybeSingle(),
      purchase.coupon_id
        ? admin.from("coupons").select("code, discount_type, discount_value").eq("id", purchase.coupon_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const pdf = buildInvoicePdf({
      purchase,
      book,
      buyerName: profile?.display_name ?? userEmail.split("@")[0] ?? "Customer",
      buyerEmail: userEmail,
      coupon,
    });

    const bytes = pdf.output("arraybuffer");
    const invoiceNo = makeInvoiceNumber(purchase.id, purchase.created_at);

    return new Response(bytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoiceNo}.pdf"`,
      },
    });
  } catch (err) {
    console.error("generate-invoice error:", err);
    return json({ error: (err as Error).message ?? "Internal error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function makeInvoiceNumber(purchaseId: string, createdAt: string) {
  const year = new Date(createdAt).getFullYear();
  const suffix = purchaseId.replace(/-/g, "").slice(-8).toUpperCase();
  return `GN-${year}-${suffix}`;
}

function currencySymbol(code: string) {
  if (code === "INR") return "Rs. ";
  if (code === "USD") return "$";
  if (code === "EUR") return "EUR ";
  if (code === "GBP") return "GBP ";
  return `${code} `;
}

function buildInvoicePdf({
  purchase,
  book,
  buyerName,
  buyerEmail,
  coupon,
}: {
  purchase: any;
  book: any;
  buyerName: string;
  buyerEmail: string;
  coupon: any;
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;
  const currency = purchase.currency || "INR";
  const sym = currencySymbol(currency);
  const amount = Number(purchase.amount ?? 0);
  const invoiceNo = makeInvoiceNumber(purchase.id, purchase.created_at);
  const dateStr = new Date(purchase.created_at).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  // Header brand
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(183, 28, 28);
  doc.text("GyandootNova", margin, 70);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text("Original Hindi-first Spiritual Publications", margin, 86);
  doc.text("gyandootnova.in  |  support@gyandootnova.in", margin, 99);

  // Invoice meta box (right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20);
  doc.text("TAX INVOICE", pageW - margin, 70, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text(`Invoice #: ${invoiceNo}`, pageW - margin, 88, { align: "right" });
  doc.text(`Date: ${dateStr}`, pageW - margin, 102, { align: "right" });
  if (purchase.razorpay_payment_id) {
    doc.text(`Payment ID: ${purchase.razorpay_payment_id}`, pageW - margin, 116, { align: "right" });
  }

  // Divider
  doc.setDrawColor(220);
  doc.setLineWidth(0.6);
  doc.line(margin, 132, pageW - margin, 132);

  // Bill To
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text("Bill To", margin, 158);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text(buyerName, margin, 176);
  doc.text(buyerEmail, margin, 190);

  // Line items table
  const tableTop = 236;
  doc.setFillColor(245, 240, 232);
  doc.rect(margin, tableTop, pageW - margin * 2, 26, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30);
  doc.text("Description", margin + 12, tableTop + 17);
  doc.text("Qty", pageW - margin - 170, tableTop + 17, { align: "right" });
  doc.text("Amount", pageW - margin - 12, tableTop + 17, { align: "right" });

  const rowY = tableTop + 46;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40);
  const title = book?.title ?? "Digital Book";
  const author = book?.author ? ` by ${book.author}` : "";
  const wrapped = doc.splitTextToSize(`${title}${author} — Digital eBook`, pageW - margin * 2 - 200);
  doc.text(wrapped, margin + 12, rowY);
  doc.text("1", pageW - margin - 170, rowY, { align: "right" });
  doc.text(`${sym}${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageW - margin - 12, rowY, { align: "right" });

  // Totals block
  const totalsTop = rowY + 40;
  doc.setDrawColor(220);
  doc.line(margin, totalsTop, pageW - margin, totalsTop);

  let y = totalsTop + 22;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60);
  doc.text("Subtotal", pageW - margin - 120, y, { align: "right" });
  doc.text(`${sym}${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageW - margin - 12, y, { align: "right" });

  if (coupon) {
    y += 16;
    doc.text(`Coupon (${coupon.code})`, pageW - margin - 120, y, { align: "right" });
    doc.text("applied", pageW - margin - 12, y, { align: "right" });
  }

  y += 22;
  doc.setDrawColor(200);
  doc.line(pageW - margin - 220, y - 10, pageW - margin, y - 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20);
  doc.text("Total Paid", pageW - margin - 120, y, { align: "right" });
  doc.text(`${sym}${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageW - margin - 12, y, { align: "right" });

  // Notes / terms
  const notesY = y + 60;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30);
  doc.text("Notes", margin, notesY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  const notes = [
    "This is a computer-generated invoice for a digital publication and does not require a signature.",
    "Digital goods are non-refundable once access to the content has been granted.",
    "For any billing questions, contact support@gyandootnova.in with the Invoice # above.",
  ];
  const wrappedNotes = doc.splitTextToSize(notes.join("\n"), pageW - margin * 2);
  doc.text(wrappedNotes, margin, notesY + 16);

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(230);
  doc.line(margin, pageH - 60, pageW - margin, pageH - 60);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("Thank you for supporting original scriptures. — GyandootNova", pageW / 2, pageH - 40, { align: "center" });

  return doc;
}
