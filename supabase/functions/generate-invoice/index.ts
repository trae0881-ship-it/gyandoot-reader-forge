// Generates a PDF invoice for a user's own purchase.
// Auth-required: verifies JWT and only returns invoices for the caller's own purchases.
// Reads customizable branding (business name, address, GSTIN, PAN, logo, footer) from public.settings.
// Supports ?preview=1 to serve inline for on-screen preview.

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

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;
    const userEmail = userData.user.email ?? "";

    const url = new URL(req.url);
    const purchaseId = url.searchParams.get("purchase_id");
    const preview = url.searchParams.get("preview") === "1";
    if (!purchaseId) return json({ error: "purchase_id required" }, 400);

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

    const settingKeys = [
      "invoice_business_name",
      "invoice_business_address",
      "invoice_gstin",
      "invoice_pan",
      "invoice_logo_url",
      "invoice_footer_note",
    ];
    const [{ data: book }, { data: profile }, { data: coupon }, { data: settingsRows }] = await Promise.all([
      admin.from("books").select("title, author, price").eq("id", purchase.book_id).maybeSingle(),
      admin.from("profiles").select("display_name").eq("user_id", userId).maybeSingle(),
      purchase.coupon_id
        ? admin.from("coupons").select("code, discount_type, discount_value").eq("id", purchase.coupon_id).maybeSingle()
        : Promise.resolve({ data: null }),
      admin.from("settings").select("key, value").in("key", settingKeys),
    ]);

    const settings: Record<string, string> = {};
    (settingsRows ?? []).forEach((r: { key: string; value: string | null }) => {
      settings[r.key] = (r.value ?? "").trim();
    });

    // Fetch logo (best-effort) so we can embed it in the PDF.
    let logoDataUrl: string | null = null;
    if (settings.invoice_logo_url) {
      try {
        const resp = await fetch(settings.invoice_logo_url);
        if (resp.ok) {
          const ct = resp.headers.get("content-type") ?? "image/png";
          const buf = new Uint8Array(await resp.arrayBuffer());
          logoDataUrl = `data:${ct};base64,${base64Encode(buf)}`;
        }
      } catch {
        logoDataUrl = null;
      }
    }

    const pdf = buildInvoicePdf({
      purchase,
      book,
      buyerName: profile?.display_name ?? userEmail.split("@")[0] ?? "Customer",
      buyerEmail: userEmail,
      coupon,
      settings,
      logoDataUrl,
    });

    const bytes = pdf.output("arraybuffer");
    const invoiceNo = makeInvoiceNumber(purchase.id, purchase.created_at);

    return new Response(bytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="${invoiceNo}.pdf"`,
        "Cache-Control": "no-store",
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

function base64Encode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  // deno-lint-ignore no-explicit-any
  return (globalThis as any).btoa(binary);
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
  settings,
  logoDataUrl,
}: {
  purchase: any;
  book: any;
  buyerName: string;
  buyerEmail: string;
  coupon: any;
  settings: Record<string, string>;
  logoDataUrl: string | null;
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;
  const currency = purchase.currency || "INR";
  const sym = currencySymbol(currency);
  const amount = Number(purchase.amount ?? book?.price ?? 0);
  const invoiceNo = makeInvoiceNumber(purchase.id, purchase.created_at);
  const dateStr = new Date(purchase.created_at).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  const businessName = settings.invoice_business_name || "GyandootNova";
  const businessAddress = settings.invoice_business_address || "";
  const gstin = settings.invoice_gstin || "";
  const pan = settings.invoice_pan || "";
  const footerNote = settings.invoice_footer_note || "Thank you for supporting original scriptures. — GyandootNova";

  // Optional logo (top-right)
  if (logoDataUrl) {
    try {
      const fmt = logoDataUrl.startsWith("data:image/jpeg") || logoDataUrl.startsWith("data:image/jpg") ? "JPEG" : "PNG";
      doc.addImage(logoDataUrl, fmt, pageW - margin - 90, 40, 90, 45, undefined, "FAST");
    } catch {
      // ignore invalid image
    }
  }

  // Header brand
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(183, 28, 28);
  doc.text(businessName, margin, 70);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90);
  let headerY = 86;
  if (businessAddress) {
    const wrapped = doc.splitTextToSize(businessAddress, pageW / 2 - margin);
    doc.text(wrapped, margin, headerY);
    headerY += wrapped.length * 11;
  }
  doc.text("gyandootnova.in  |  amrendra8765@gmail.com", margin, headerY);
  headerY += 11;
  if (gstin) { doc.text(`GSTIN: ${gstin}`, margin, headerY); headerY += 11; }
  if (pan) { doc.text(`PAN: ${pan}`, margin, headerY); headerY += 11; }

  // Invoice meta box (right) — nudged down if a logo is present.
  const metaTop = logoDataUrl ? 100 : 70;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20);
  doc.text("TAX INVOICE", pageW - margin, metaTop, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text(`Invoice #: ${invoiceNo}`, pageW - margin, metaTop + 18, { align: "right" });
  doc.text(`Date: ${dateStr}`, pageW - margin, metaTop + 32, { align: "right" });
  if (purchase.razorpay_payment_id) {
    doc.text(`Payment ID: ${purchase.razorpay_payment_id}`, pageW - margin, metaTop + 46, { align: "right" });
  }

  // Divider (below the taller of the two header columns)
  const dividerY = Math.max(headerY + 8, metaTop + 60);
  doc.setDrawColor(220);
  doc.setLineWidth(0.6);
  doc.line(margin, dividerY, pageW - margin, dividerY);

  // Bill To
  const billTop = dividerY + 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text("Bill To", margin, billTop);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text(buyerName, margin, billTop + 18);
  doc.text(buyerEmail, margin, billTop + 32);

  // Line items table
  const tableTop = billTop + 68;
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
    "For any billing questions, contact amrendra8765@gmail.com with the Invoice # above.",
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
  const footerWrapped = doc.splitTextToSize(footerNote, pageW - margin * 2);
  doc.text(footerWrapped, pageW / 2, pageH - 40, { align: "center" });

  return doc;
}
