import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Eye, Lock, Loader2, PlayCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { initiatePayment, type PaymentGateway } from "@/lib/payment";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const BookDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [purchasing, setPurchasing] = useState(false);
  const [gateway, setGateway] = useState<PaymentGateway>("razorpay");

  const { data: book, isLoading } = useQuery({
    queryKey: ["book", slug],
    queryFn: async () => {
      const { data } = await supabase.from("books").select("*").eq("slug", slug!).single();
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

  const { data: hasPurchased } = useQuery({
    queryKey: ["purchase", book?.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_purchased_book", { _user_id: user!.id, _book_id: book!.id });
      return !!data;
    },
    enabled: !!book?.id && !!user?.id && !book?.is_free,
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

  const handlePurchase = async () => {
    if (!user) {
      toast({ title: "कृपया पहले लॉगिन करें", description: "Purchase के लिए login ज़रूरी है।", variant: "destructive" });
      navigate("/auth");
      return;
    }
    setPurchasing(true);
    await initiatePayment(
      { amount: book!.price, type: "purchase", gateway, book_id: book!.id },
      () => {
        toast({ title: "Purchase Successful!", description: "You can now read the full book." });
        queryClient.invalidateQueries({ queryKey: ["purchase", book!.id, user!.id] });
        setPurchasing(false);
      },
      (error) => {
        toast({ title: "Payment Failed", description: error, variant: "destructive" });
        setPurchasing(false);
      }
    );
  };

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

  const canRead = book.is_free || hasPurchased;

  // Find the chapter slug for "continue reading"
  const continueChapter = readingProgress
    ? chapters?.find((c) => c.id === readingProgress.chapter_id)
    : null;
  const continueChapterSlug = continueChapter?.slug ?? chapters?.[0]?.slug;
  const totalChapters = chapters?.length ?? 0;
  const bookProgressPct = readingProgress && totalChapters > 0
    ? Math.round(((readingProgress.chapter_number - 1) / totalChapters) * 100 + (readingProgress.scroll_percent / totalChapters))
    : 0;

  return (
    <Layout>
      <section className="py-12">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Cover */}
            <div className="md:col-span-1">
              <div className="aspect-[3/4] overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" />
                ) : (
                  <BookOpen className="h-16 w-16 text-muted-foreground/40" />
                )}
              </div>
            </div>

            {/* Details */}
            <div className="md:col-span-2">
              <h1 className="font-serif text-3xl font-bold md:text-4xl">{book.title}</h1>
              <p className="mt-1 text-lg text-muted-foreground">by {book.author}</p>
              <span className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-medium ${book.is_free ? "bg-muted text-primary" : "bg-secondary/20 text-secondary-foreground"}`}>
                {book.is_free ? "Free to Read" : `₹${book.price}`}
              </span>

              {book.description && (
                <div className="mt-6 text-foreground/80 leading-relaxed whitespace-pre-line">{book.description}</div>
              )}

              {!canRead && !book.is_free && (
                <div className="mt-6 space-y-3">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={gateway === "razorpay" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setGateway("razorpay")}
                    >
                      Razorpay
                    </Button>
                    <Button
                      type="button"
                      variant={gateway === "paypal" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setGateway("paypal")}
                    >
                      PayPal
                    </Button>
                  </div>
                  <Button size="lg" onClick={handlePurchase} disabled={purchasing}>
                    {purchasing ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                    ) : (
                      <><Lock className="mr-2 h-4 w-4" /> Purchase to Read — ₹{book.price}</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Continue Reading / Start Reading Banner */}
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

          {/* Table of Contents */}

          {chapters && chapters.length > 0 && (
            <div className="mt-12">
              <h2 className="font-serif text-2xl font-bold mb-4">Table of Contents</h2>
              <div className="space-y-2">
                {chapters.map((ch) => {
                  const accessible = canRead || ch.is_preview;
                  return (
                    <Card key={ch.id} className={accessible ? "hover:shadow transition-shadow" : "opacity-60"}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {ch.chapter_number}
                          </span>
                          <span className="font-medium">{ch.title}</span>
                          {ch.is_preview && <span className="text-xs text-primary font-medium">Preview</span>}
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
    </Layout>
  );
};

export default BookDetail;
