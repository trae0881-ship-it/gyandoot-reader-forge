import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, ShieldCheck, Lock, BookOpen } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useLocale } from "@/hooks/useLocale";
import useSEO from "@/hooks/useSEO";

const Cart = () => {
  const { items, setQty, removeItem, clear, count, subtotal } = useCart();
  const { formatPrice } = useLocale();

  useSEO({
    title: "Your Cart · GyandootNova",
    description:
      "Aapki chuni hui pustakein — GyandootNova cart. Review your selected books and continue to secure checkout.",
    canonical: "/cart",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "GyandootNova", item: "https://gyandootnova.in/" },
        { "@type": "ListItem", position: 2, name: "Cart", item: "https://gyandootnova.in/cart" },
      ],
    },
  });

  return (
    <Layout>
      {/* Header band */}
      <section className="border-b border-border/60 bg-gradient-cream">
        <div className="container max-w-5xl px-4 py-14 md:py-20">
          <nav aria-label="Breadcrumb" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link to="/" className="hover:text-primary">GyandootNova</Link></li>
              <li aria-hidden className="opacity-60">/</li>
              <li aria-current="page" className="text-foreground/70">Cart</li>
            </ol>
          </nav>
          <div className="mt-6 flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Aapki chuni hui pustakein
              </h1>
              <p className="mt-2 text-muted-foreground">
                Your selected books are ready to become part of your reading journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container max-w-5xl px-4">
          {items.length === 0 ? (
            <div className="surface-card p-12 md:p-16 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-6 text-2xl font-bold text-foreground">
                Your cart is quietly waiting
              </h2>
              <p className="mt-3 text-muted-foreground max-w-md mx-auto">
                Let's help you discover your next meaningful read.
              </p>
              <Button asChild size="lg" className="mt-8 rounded-full px-8">
                <Link to="/books" className="inline-flex items-center gap-2">
                  Explore Books <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              {/* Items */}
              <div className="space-y-4">
                {items.map((it) => (
                  <div
                    key={it.slug}
                    className="surface-card p-4 md:p-5 flex gap-4"
                  >
                    <Link
                      to={`/books/${it.slug}`}
                      className="shrink-0 h-24 w-20 md:h-28 md:w-24 rounded-md overflow-hidden bg-muted"
                    >
                      {it.cover_url ? (
                        <img
                          src={it.cover_url}
                          alt={it.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                          <BookOpen className="h-6 w-6" />
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0 flex flex-col">
                      <Link
                        to={`/books/${it.slug}`}
                        className="text-base md:text-lg font-semibold text-foreground hover:text-primary line-clamp-2"
                      >
                        {it.title}
                      </Link>
                      {it.author && (
                        <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                          {it.author}
                        </p>
                      )}
                      <div className="mt-2 text-sm font-semibold text-primary">
                        {it.is_free || it.price === 0 ? "Free · जीवनभर" : formatPrice(it.price)}
                      </div>

                      <div className="mt-auto flex items-center gap-3 pt-3">
                        {/* Quantity — represents number of gift/personal copies */}
                        <div
                          className="inline-flex items-center rounded-full border border-border bg-card"
                          role="group"
                          aria-label={`Quantity for ${it.title}`}
                        >
                          <button
                            type="button"
                            className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-primary disabled:opacity-40"
                            onClick={() => setQty(it.slug, it.qty - 1)}
                            disabled={it.qty <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-foreground tabular-nums">
                            {it.qty}
                          </span>
                          <button
                            type="button"
                            className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-primary disabled:opacity-40"
                            onClick={() => setQty(it.slug, it.qty + 1)}
                            disabled={it.qty >= 99}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(it.slug)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>

                        <div className="ml-auto">
                          <Button asChild size="sm" className="rounded-full">
                            <Link to={`/books/${it.slug}`} className="inline-flex items-center gap-1.5">
                              Checkout <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={clear} className="text-muted-foreground">
                    Clear cart
                  </Button>
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link to="/books">Continue browsing</Link>
                  </Button>
                </div>
              </div>

              {/* Summary */}
              <aside className="lg:sticky lg:top-24 h-fit">
                <div className="surface-card p-6">
                  <h2 className="text-lg font-bold text-foreground">Order summary</h2>
                  <dl className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Items</dt>
                      <dd className="font-semibold text-foreground tabular-nums">{count}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Subtotal</dt>
                      <dd className="font-semibold text-foreground tabular-nums">
                        {formatPrice(subtotal)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-6 rounded-lg bg-muted/60 p-4 text-xs text-muted-foreground leading-relaxed">
                    Digital books are delivered instantly to your reader.
                    Payment happens on each book's page — you'll be handed off
                    to a <span className="font-semibold text-foreground">secure Razorpay or PayPal</span> checkout.
                  </div>

                  <Button asChild size="lg" className="mt-6 w-full rounded-full font-semibold">
                    <Link to={`/books/${items[0].slug}`} className="inline-flex items-center justify-center gap-2">
                      Proceed to secure checkout
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>

                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    Thank you for choosing books that inspire learning and growth.
                  </p>

                  <div className="mt-5 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Secure</span>
                    <span className="inline-flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-primary" /> Encrypted</span>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Cart;
