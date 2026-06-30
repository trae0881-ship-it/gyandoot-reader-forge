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
            रुकिए! आपके लिए तोहफ़ा 🎁
          </h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            पहली खरीद पर पाएँ <strong className="text-primary">20% की छूट</strong> — सभी प्रीमियम ग्रंथों पर मान्य।
          </p>

          <div className="mt-5 rounded-xl border-2 border-dashed border-secondary bg-secondary/5 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              आपका कूपन कोड
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
                  <Check className="h-3 w-3" /> Copy हो गया!
                </span>
              ) : (
                "कोड पर क्लिक करके copy करें"
              )}
            </p>
          </div>

          <Button
            asChild
            size="lg"
            className="mt-5 w-full bg-secondary text-secondary-foreground font-bold hover:bg-secondary/90"
          >
            <Link to="/books" onClick={() => setOpen(false)}>
              अभी ग्रंथ चुनें →
            </Link>
          </Button>

          <p className="mt-3 text-[11px] text-muted-foreground">
            सीमित समय के लिए • एक खाते पर एक बार
          </p>
        </div>
      </div>
    </div>
  );
}
