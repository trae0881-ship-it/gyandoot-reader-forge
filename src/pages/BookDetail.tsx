import DOMPurify from "dompurify";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useSEO from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Eye, Lock, Loader2, PlayCircle, Tag, X, CheckCircle, User, Calendar, Layers, Globe, ShoppingCart, Star, Info, Share2, Copy, Smartphone, Bookmark, Gift, Infinity as InfinityIcon, ShieldCheck, CreditCard, Unlock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useMemo, useEffect } from "react";

import { initiatePayment, type PaymentGateway } from "@/lib/payment";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import AskScripture from "@/components/AskScripture";
import AuthorCredibility from "@/components/AuthorCredibility";
import BundleDecoy from "@/components/BundleDecoy";
import RecentPurchasesToast from "@/components/RecentPurchasesToast";
import { getReferrerId } from "@/hooks/useReferral";

const BookDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const referrerId = useMemo(() => getReferrerId(), []);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [purchasing, setPurchasing] = useState(false);
  const [claimingFree, setClaimingFree] = useState(false);
  const [gateway, setGateway] = useState<PaymentGateway>("razorpay");
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    coupon_id: string;
    code: string;
    discount_amount: number;
    final_amount: number;
    discount_type: string;
    discount_value: number;
  } | null>(null);

  const { data: book, isLoading } = useQuery({
    queryKey: ["book", slug],
    queryFn: async () => {
      const { data } = await supabase.from("books").select("id, title, slug, author, cover_url, price, is_free, is_featured, description, preview_chapters, purchase_count, file_type, category, created_at, updated_at").eq("slug", slug!).single();
      return data;
    },
    enabled: !!slug,
  });

  const { data: chapters } = useQuery({
    queryKey: ["chapters", book?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("book_chapters")
        .select("id, title, slug, chapter_number, is_preview")
        .eq("book_id", book!.id)
        .order("chapter_number");
      return data ?? [];
    },
    enabled: !!book?.id,
  });

  const { data: hasPurchased, isLoading: purchaseStatusLoading } = useQuery({
    queryKey: ["purchase", book?.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_purchased_book", { _user_id: user!.id, _book_id: book!.id });
      return !!data;
    },
    enabled: !!book?.id && !!user?.id,
  });

  const { data: readingProgress } = useQuery({
    queryKey: ["reading-progress", book?.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reading_progress")
        .select("chapter_id, chapter_number, scroll_percent")
        .eq("user_id", user!.id)
        .eq("book_id", book!.id)
        .single();
      return data;
    },
    enabled: !!book?.id && !!user?.id,
  });

  const applyCoupon = async () => {
    if (!couponCode.trim() || !book) return;
    setCouponLoading(true);
    const { data, error } = await supabase.rpc("apply_coupon" as any, {
      _code: couponCode.trim(),
      _order_amount: book.price,
      _book_id: book.id,
    });
    setCouponLoading(false);
    if (error || !data) {
      toast({ title: "Error", description: "Could not validate coupon", variant: "destructive" });
      return;
    }
    if (!data.valid) {
      toast({ title: "Invalid Coupon", description: data.error, variant: "destructive" });
      return;
    }
    setAppliedCoupon(data);
    toast({ title: "Coupon Applied!", description: `You save ₹${data.discount_amount}` });
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const handleClaimFreeBook = async () => {
    if (!book) return;

    if (!user) {
      toast({
        title: "कृपया पहले लॉगिन करें",
        description: "Free book को dashboard में add करने के लिए login ज़रूरी है।",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setClaimingFree(true);

    try {
      const { data, error } = await supabase.functions.invoke("claim-free-book", {
        body: { book_id: book.id },
      });

      if (error || data?.error) {
        toast({
          title: "Could not add book",
          description: data?.error || error?.message || "Something went wrong",
          variant: "destructive",
        });
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["purchase", book.id, user.id] }),
        queryClient.invalidateQueries({ queryKey: ["user-purchases", user.id] }),
      ]);

      toast({
        title: data?.alreadyClaimed ? "Already in your dashboard" : "Book added to dashboard",
        description: data?.alreadyClaimed
          ? "Ye free book pehle se aapke My Books mein available hai."
          : "100% free offer automatically apply ho gaya aur book aapke dashboard mein add ho gayi.",
      });
    } finally {
      setClaimingFree(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      toast({ title: "कृपया पहले लॉगिन करें", description: "Purchase के लिए login ज़रूरी है।", variant: "destructive" });
      navigate("/auth");
      return;
    }
    const finalAmount = appliedCoupon ? appliedCoupon.final_amount : book!.price;
    setPurchasing(true);
    await initiatePayment(
      {
        amount: finalAmount,
        type: "purchase",
        gateway,
        book_id: book!.id,
        coupon_id: appliedCoupon?.coupon_id,
        referrer_id: referrerId || undefined,
      } as any,
      () => {
        toast({ title: "Purchase Successful!", description: "You can now read the full book." });
        queryClient.invalidateQueries({ queryKey: ["purchase", book!.id, user!.id] });
        setPurchasing(false);
        setAppliedCoupon(null);
        setCouponCode("");
      },
      (error) => {
        toast({ title: "Payment Failed", description: error, variant: "destructive" });
        setPurchasing(false);
      }
    );
  };

  const cleanedDesc = book?.description?.replace(/<[^>]*>/g, "").trim();
  const priceLabel = book ? (book.is_free ? "मुफ़्त" : `₹${book.price}`) : "";
  const shortDesc = cleanedDesc && cleanedDesc.length >= 20 ? cleanedDesc.slice(0, 110) : "";
  const bookDescription = book
    ? (shortDesc
        ? `${shortDesc}… ${book.author} द्वारा। ${priceLabel} — Instant digital delivery, UPI/Card/COD-friendly checkout।`
        : `${book.title} — ${book.author} द्वारा। ${priceLabel} में पढ़ें, तुरंत access, सभी devices पर। GyandootNova पर सुरक्षित checkout।`)
    : "Loading book...";
  const bookMetaTitle = book
    ? `${book.title} — ${book.author} | ${priceLabel} | GyandootNova`
    : "Loading... | GyandootNova";


  const bookJsonLd = book ? {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": book.title,
    "author": { "@type": "Person", "name": book.author },
    "description": bookDescription,
    "url": `https://gyandootnova.in/books/${book.slug}`,
    ...(book.cover_url && { "image": book.cover_url }),
    "offers": {
      "@type": "Offer",
      "price": book.is_free ? "0" : String(book.price),
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "url": `https://gyandootnova.in/books/${book.slug}`,
      "deliveryLeadTime": { "@type": "QuantitativeValue", "minValue": 0, "maxValue": 1, "unitCode": "MIN" },
    },
  } : undefined;

  useSEO({
    title: bookMetaTitle,
    description: bookDescription,
    canonical: book ? `/books/${book.slug}` : undefined,
    ogImage: book?.cover_url ?? undefined,
    ogType: "book",
    jsonLd: bookJsonLd,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </Layout>
    );
  }

  if (!book) {
    return (
      <Layout>
        <div className="py-32 text-center text-muted-foreground">Book not found.</div>
      </Layout>
    );
  }

  const hasLibraryAccess = !!hasPurchased;
  const canRead = book.is_free || hasLibraryAccess;
  const previewChapters = (book as any).preview_chapters ?? 0;
  const continueChapter = readingProgress
    ? chapters?.find((c) => c.id === readingProgress.chapter_id)
    : null;
  const continueChapterSlug = continueChapter?.slug ?? chapters?.[0]?.slug;
  const totalChapters = chapters?.length ?? 0;
  const bookProgressPct = readingProgress && totalChapters > 0
    ? Math.round(((readingProgress.chapter_number - 1) / totalChapters) * 100 + (readingProgress.scroll_percent / totalChapters))
    : 0;
  const showFreeBuyCard = book.is_free && !purchaseStatusLoading && !hasLibraryAccess;
  const showClaimedNotice = book.is_free && !purchaseStatusLoading && hasLibraryAccess;

  return (
    <Layout>
      <RecentPurchasesToast />
      <section className="py-12">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
              <div className="aspect-[3/4] overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={`${book.title} — ${book.author}`}
                    width={600}
                    height={800}
                    decoding="async"
                    fetchPriority="high"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <BookOpen className="h-16 w-16 text-muted-foreground/40" />
                )}
              </div>
            </div>


            <div className="md:col-span-2">
              <h1 className="font-serif text-3xl font-bold md:text-4xl">{book.title}</h1>
              <p className="mt-1 text-lg text-muted-foreground">by {book.author}</p>
              <span className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-medium ${book.is_free ? "bg-muted text-primary" : "bg-secondary/20 text-secondary-foreground"}`}>
                {book.is_free ? "Free to Read" : `₹${book.price}`}
              </span>

              {showFreeBuyCard && (
                <div className="mt-6 space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-5">
                  <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/20 bg-background px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>
                        <span className="font-mono text-primary">AUTO-FREE</span>
                        {" — "}
                        100% coupon auto-applied
                      </span>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">₹0 checkout</span>
                  </div>

                  <Button size="lg" onClick={handleClaimFreeBook} disabled={claimingFree}>
                    {claimingFree ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                    ) : (
                      <><ShoppingCart className="mr-2 h-4 w-4" /> Buy Now — ₹0</>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Buy Now दबाने पर ye free book automatically aapke dashboard / My Books में add ho jayegi.
                  </p>
                </div>
              )}

              {showClaimedNotice && (
                <div className="mt-6 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  This free book is already added to your dashboard.
                </div>
              )}

              {!canRead && !book.is_free && (
                <div id="buy-section" className="mt-6 space-y-3">
                  {/* Value Stack / Anchoring */}
                  <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">आप क्या पा रहे हैं</p>
                    <ul className="space-y-1.5 text-sm">
                      <li className="flex justify-between"><span className="inline-flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-primary" /> पुस्तक का lifetime access</span><span className="text-muted-foreground">₹{book.price}</span></li>
                      <li className="flex justify-between"><span className="inline-flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5 text-primary" /> सभी devices पर पढ़ें</span><span className="text-muted-foreground line-through">₹500</span></li>
                      <li className="flex justify-between"><span className="inline-flex items-center gap-1.5"><Bookmark className="h-3.5 w-3.5 text-primary" /> Bookmarks + Notes</span><span className="text-muted-foreground line-through">₹300</span></li>
                      <li className="flex justify-between"><span className="inline-flex items-center gap-1.5"><PlayCircle className="h-3.5 w-3.5 text-primary" /> Continue reading + Progress</span><span className="text-muted-foreground line-through">₹200</span></li>
                      <li className="flex justify-between"><span className="inline-flex items-center gap-1.5"><Gift className="h-3.5 w-3.5 text-primary" /> जीवनभर Free updates</span><span className="text-muted-foreground line-through">₹500</span></li>
                      <li className="flex justify-between font-bold border-t border-primary/20 pt-2 mt-2"><span>आज आपका मूल्य</span><span className="text-primary text-lg">₹{book.price}</span></li>
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant={gateway === "razorpay" ? "default" : "outline"} size="sm" onClick={() => setGateway("razorpay")}>Razorpay</Button>
                    <Button type="button" variant={gateway === "paypal" ? "default" : "outline"} size="sm" onClick={() => setGateway("paypal")}>PayPal</Button>
                  </div>

                  {!appliedCoupon ? (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Coupon code (optional)"
                          className="pl-9 font-mono uppercase"
                          onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                        />
                      </div>
                      <Button type="button" variant="outline" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()}>
                        {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          <span className="font-mono text-primary">{appliedCoupon.code}</span>
                          {" — "}
                          {appliedCoupon.discount_type === "percent"
                            ? `${appliedCoupon.discount_value}% off`
                            : `₹${appliedCoupon.discount_amount} off`}
                        </span>
                      </div>
                      <button onClick={removeCoupon} className="text-muted-foreground hover:text-destructive ml-2">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    {appliedCoupon && (
                      <span className="text-muted-foreground line-through text-sm">₹{book.price}</span>
                    )}
                    <span className="text-2xl font-bold text-primary">
                      ₹{appliedCoupon ? appliedCoupon.final_amount : book.price}
                    </span>
                    {appliedCoupon && (
                      <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Save ₹{appliedCoupon.discount_amount}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">जीवनभर</span>
                  </div>

                  <Button size="lg" onClick={handlePurchase} disabled={purchasing} className="w-full text-base font-bold shadow-lg">
                    {purchasing ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                    ) : (
                      <><Unlock className="mr-2 h-4 w-4" /> Buy Now — ₹{appliedCoupon ? appliedCoupon.final_amount : book.price} (जीवनभर)</>
                    )}
                  </Button>

                  {/* Risk Reversal */}
                  <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-xs text-foreground/80">
                      <strong className="text-foreground">7-दिन 100% पैसा वापसी की गारंटी</strong> — पसंद ना आए तो एक click में refund। कोई सवाल नहीं।
                    </div>
                  </div>

                  {/* Trust badges */}
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground pt-1">
                    <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" /> SSL Secured</span>
                    <span className="inline-flex items-center gap-1"><CreditCard className="h-3 w-3" /> UPI / Card / NetBanking</span>
                    <span className="inline-flex items-center gap-1"><InfinityIcon className="h-3 w-3" /> Lifetime Access</span>
                  </div>
                </div>
              )}
              {/* Referral Link Section */}
              {user && (
                <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Share2 className="h-4 w-4 text-primary" /> Refer & Earn
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    यह एक universal link है — इसे share करें। कोई भी इस link से कोई भी book खरीदेगा तो आपको commission मिलेगा!
                  </p>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={`${window.location.origin}/?ref=${user.id}`}
                      className="text-xs font-mono"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/?ref=${user.id}`);
                        toast({ title: "Link copied!", description: "Universal referral link copy ho gaya! Sabhi books par commission milega." });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 rounded-xl border border-border bg-card p-6">
            <h2 className="font-serif text-2xl font-bold mb-6 flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" /> Book Specifications
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Author</p>
                  <p className="font-medium text-foreground">{book.author}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Layers className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Chapters</p>
                  <p className="font-medium text-foreground">{totalChapters} Chapters</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Format</p>
                  <p className="font-medium text-foreground">{book.file_type ? book.file_type.toUpperCase() : "Online Read"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Published</p>
                  <p className="font-medium text-foreground">{new Date(book.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</p>
                </div>
              </div>
              {book.category && (
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Category</p>
                    <p className="font-medium text-foreground">{book.category}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <ShoppingCart className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Price</p>
                  <p className="font-medium text-foreground">{book.is_free ? "Free" : `₹${book.price}`}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Readers</p>
                  <p className="font-medium text-foreground">{Math.max(book.purchase_count, 100)}+ Readers</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Last Updated</p>
                  <p className="font-medium text-foreground">{new Date(book.updated_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <h2 className="font-serif text-2xl font-bold mb-4">About This Book</h2>
            {book.description ? (
              <div className="text-foreground/80 leading-relaxed prose prose-headings:font-serif prose-headings:text-foreground prose-p:text-foreground/80 prose-img:rounded-lg max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(book.description) }} />
            ) : (
              <div className="text-muted-foreground leading-relaxed space-y-3">
                <p>
                  <strong className="text-foreground">{book.title}</strong> by <strong className="text-foreground">{book.author}</strong> is available to read online at GyandootNova. This book contains {totalChapters} chapters of carefully curated spiritual content.
                </p>
                <p>
                  {book.is_free
                    ? "This book is completely free to read. Simply open any chapter and start your spiritual journey."
                    : `Get full access to all ${totalChapters} chapters for just ₹${book.price}. Once purchased, the book is available in your account forever — no subscription needed.`}
                </p>
                {previewChapters > 0 && (
                  <p>
                    <strong className="text-foreground">Free Preview:</strong> The first {previewChapters} chapter{previewChapters > 1 ? "s are" : " is"} available for free preview before purchase.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-10 rounded-xl border border-primary/20 bg-primary/5 p-6">
            <h2 className="font-serif text-2xl font-bold mb-4">What You Get</h2>
            <ul className="grid md:grid-cols-2 gap-3">
              {[
                "Read online instantly — no downloads needed",
                "Dark mode & font size customization",
                "Bookmark chapters & track progress",
                "Highlight text & add personal notes",
                `${totalChapters} chapters of authentic content`,
                "Access forever — no subscription",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-foreground/80">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <AuthorCredibility author={book.author} />

          {!hasPurchased && !book.is_free && (
            <BundleDecoy
              price={book.price}
              onSelectSingle={() => {
                document.getElementById("buy-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            />
          )}

          {canRead && continueChapterSlug && (
            <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground mb-1">
                  {readingProgress ? "Continue where you left off" : "Start reading"}
                </p>
                {readingProgress ? (
                  <>
                    <p className="font-semibold text-foreground">
                      Chapter {readingProgress.chapter_number}: {continueChapter?.title}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={bookProgressPct} className="h-2 flex-1 max-w-xs" />
                      <span className="text-xs text-muted-foreground shrink-0">{bookProgressPct}% complete</span>
                    </div>
                  </>
                ) : (
                  <p className="font-semibold text-foreground">{chapters?.[0]?.title ?? "First Chapter"}</p>
                )}
              </div>
              <Button asChild className="shrink-0">
                <Link to={`/books/${slug}/${continueChapterSlug}`}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  {readingProgress ? "Continue Reading" : "Start Reading"}
                </Link>
              </Button>
            </div>
          )}

          {canRead && book.file_type && (
            <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground mb-1">This book is available as a {book.file_type.toUpperCase()} file</p>
                <p className="font-semibold text-foreground">{book.title}</p>
              </div>
              <Button asChild className="shrink-0">
                <Link to={`/books/${slug}/read-file`}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Read Now
                </Link>
              </Button>
            </div>
          )}

          {chapters && chapters.length > 0 && (
            <div className="mt-12">
              <h2 className="font-serif text-2xl font-bold mb-4">Table of Contents</h2>
              {!canRead && !book.is_free && (
                <div className="mb-4 rounded-lg border-2 border-green-600/40 bg-green-50 dark:bg-green-950/20 p-3 text-sm flex items-start gap-2">
                  <Gift className="h-4 w-4 text-green-700 mt-0.5 shrink-0" />
                  <span><strong>पहला अध्याय 100% मुफ़्त है</strong> — Login कीजिए और पढ़कर देखिए, पसंद आए तभी खरीदिए।</span>
                </div>
              )}
              <div className="space-y-2">
                {chapters.map((ch) => {
                  const isFirstChapter = ch.chapter_number === 1;
                  const accessible = canRead || ch.is_preview || ch.chapter_number <= previewChapters || (!!user && isFirstChapter);
                  return (
                    <Card key={ch.id} className={accessible ? "hover:shadow transition-shadow" : "opacity-60"}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {ch.chapter_number}
                          </span>
                          <span className="font-medium">{ch.title}</span>
                          {ch.is_preview && <span className="text-xs text-primary font-medium">Preview</span>}
                          {!ch.is_preview && isFirstChapter && !canRead && !book.is_free && (
                            <span className="text-[10px] bg-green-600 text-white font-bold px-1.5 py-0.5 rounded">FREE</span>
                          )}
                        </div>
                        {accessible ? (
                          <Button size="sm" variant="ghost" asChild>
                            <Link to={`/books/${slug}/${ch.slug}`}><Eye className="mr-1 h-4 w-4" /> Read</Link>
                          </Button>
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      <SimilarBooks currentBookId={book.id} category={book.category} />
      {book && canRead && <AskScripture bookId={book.id} bookTitle={book.title} />}

      {/* Sticky Mobile Purchase CTA */}
      {!canRead && !book.is_free && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border shadow-2xl p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">जीवनभर access</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-primary">₹{appliedCoupon ? appliedCoupon.final_amount : book.price}</span>
              <span className="text-[10px] text-primary inline-flex items-center gap-0.5"><CheckCircle className="h-2.5 w-2.5" /> 7-दिन refund</span>
            </div>
          </div>
          <Button onClick={handlePurchase} disabled={purchasing} size="lg" className="font-bold shadow-md shrink-0">
            {purchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Unlock className="mr-1 h-4 w-4" /> Buy Now</>}
          </Button>
        </div>
      )}
      {showFreeBuyCard && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border shadow-2xl p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">100% Free</p>
            <span className="text-lg font-bold text-primary">₹0 — जीवनभर</span>
          </div>
          <Button onClick={handleClaimFreeBook} disabled={claimingFree} size="lg" className="font-bold shadow-md shrink-0">
            {claimingFree ? <Loader2 className="h-4 w-4 animate-spin" /> : <>अभी पढ़ें →</>}
          </Button>
        </div>
      )}
    </Layout>
  );
};

const SimilarBooks = ({ currentBookId, category }: { currentBookId: string; category: string | null }) => {
  const { data: similarBooks } = useQuery({
    queryKey: ["similar-books", currentBookId, category],
    queryFn: async () => {
      let query = supabase
        .from("books")
        .select("id, title, slug, author, cover_url, price, is_free, purchase_count")
        .neq("id", currentBookId)
        .limit(4);
      if (category) {
        query = query.eq("category", category);
      }
      const { data } = await query;
      if (data && data.length < 4 && category) {
        const ids = data.map((b) => b.id);
        ids.push(currentBookId);
        const { data: more } = await supabase
          .from("books")
          .select("id, title, slug, author, cover_url, price, is_free, purchase_count")
          .not("id", "in", `(${ids.join(",")})`)
          .limit(4 - data.length);
        return [...data, ...(more ?? [])];
      }
      return data ?? [];
    },
  });

  if (!similarBooks || similarBooks.length === 0) return null;

  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <h2 className="font-serif text-3xl font-bold mb-2 text-center">Similar Books</h2>
        <p className="text-muted-foreground text-center mb-8">You might also enjoy these spiritual books</p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {similarBooks.map((b) => (
            <Link key={b.id} to={`/books/${b.slug}`}>
              <Card className="group overflow-hidden border-border transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="aspect-[3/4] bg-muted flex items-center justify-center overflow-hidden">
                  {b.cover_url ? (
                    <img src={b.cover_url} alt={b.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                  ) : (
                    <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-serif font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-1">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.author}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${b.is_free ? "bg-muted text-primary" : "bg-secondary/20 text-secondary-foreground"}`}>
                      {b.is_free ? "Free" : `₹${b.price}`}
                    </span>
                    <span className="text-xs text-muted-foreground">{Math.max(b.purchase_count, 100)}+ readers</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BookDetail;
