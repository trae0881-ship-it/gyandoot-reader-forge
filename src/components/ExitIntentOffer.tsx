import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Gift, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "gn_exit_intent_shown";
const COUPON = "BHAKTI20";

export default function ExitIntentOffer() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !sessionStorage.getItem(STORAGE_KEY)) {
        sessionStorage.setItem(STORAGE_KEY, "1");
        setOpen(true);
      }
    };
    // Mobile fallback: trigger after 45s if user is idle on page
    const timer = window.setTimeout(() => {
      if (!sessionStorage.getItem(STORAGE_KEY)) {
        sessionStorage.setItem(STORAGE_KEY, "1");
        setOpen(true);
      }
    }, 45000);

    document.addEventListener("mouseout", onMouseOut);
    return () => {
      document.removeEventListener("mouseout", onMouseOut);
      window.clearTimeout(timer);
    };
  }, []);

  if (!open) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(COUPON);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-in fade-in"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border-2 border-secondary/40 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-secondary/20">
            <Gift className="h-7 w-7 text-secondary" />
          </div>
          <h3 className="mt-4 font-serif text-2xl font-bold text-card-foreground">
            Rukiye! 🙏
          </h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Aaj hi shuru karein apni <strong className="text-primary">adhyatmik yatra</strong> — pehla granth bilkul free hai.
          </p>

          <div className="mt-5 rounded-xl border-2 border-dashed border-secondary bg-secondary/5 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Bonus — Premium par 20% off
            </p>
            <button
              onClick={copy}
              className="mt-1 font-serif text-2xl font-extrabold text-primary tracking-widest hover:underline"
            >
              {COUPON}
            </button>
            <p className="mt-1 text-xs text-muted-foreground">
              {copied ? (
                <span className="inline-flex items-center gap-1 text-green-700 font-semibold">
                  <Check className="h-3 w-3" /> Copy ho gaya!
                </span>
              ) : (
                "Code par click karke copy karein"
              )}
            </p>
          </div>

          <Button
            asChild
            size="lg"
            className="mt-5 w-full bg-secondary text-secondary-foreground font-bold hover:bg-secondary/90"
          >
            <Link to="/books?filter=free" onClick={() => setOpen(false)}>
              Abhi Free Mein Padhein →
            </Link>
          </Button>

          <p className="mt-3 text-[11px] text-muted-foreground">
            Seemit samay ke liye • Ek khaate par ek baar
          </p>
        </div>

      </div>
    </div>
  );
}
