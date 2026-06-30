import { Check, Sparkles } from "lucide-react";

interface Props {
  price: number;
  onSelectSingle?: () => void;
}

/**
 * Decoy pricing block — anchors single-book price by surfacing a "best value"
 * lifetime library bundle next to it. Purely presentational on BookDetail.
 */
const BundleDecoy = ({ price, onSelectSingle }: Props) => {
  const triple = Math.max(price * 3, 99);
  const allAccess = 999;

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-serif text-xl sm:text-2xl font-bold">सबसे लोकप्रिय विकल्प चुनें</h2>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {/* Single */}
        <button
          type="button"
          onClick={onSelectSingle}
          className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition"
        >
          <p className="text-xs uppercase tracking-wider text-muted-foreground">यह ग्रन्थ</p>
          <p className="text-2xl font-bold text-foreground mt-1">₹{price}</p>
          <p className="text-xs text-muted-foreground">जीवनभर access</p>
          <ul className="mt-3 space-y-1 text-xs text-foreground/80">
            <li className="flex gap-1.5"><Check className="h-3.5 w-3.5 text-primary mt-0.5" /> 1 ग्रन्थ</li>
            <li className="flex gap-1.5"><Check className="h-3.5 w-3.5 text-primary mt-0.5" /> Bookmarks & notes</li>
            <li className="flex gap-1.5"><Check className="h-3.5 w-3.5 text-primary mt-0.5" /> 7-दिन refund</li>
          </ul>
        </button>

        {/* Decoy — 3 books */}
        <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 relative">
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
            सबसे लोकप्रिय
          </span>
          <p className="text-xs uppercase tracking-wider text-primary">कोई भी 3 ग्रन्थ</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            ₹{Math.round(triple * 0.7)}
            <span className="text-xs text-muted-foreground line-through ml-2">₹{triple}</span>
          </p>
          <p className="text-xs text-muted-foreground">~30% बचत</p>
          <ul className="mt-3 space-y-1 text-xs text-foreground/80">
            <li className="flex gap-1.5"><Check className="h-3.5 w-3.5 text-primary mt-0.5" /> कोई भी 3 ग्रन्थ चुनें</li>
            <li className="flex gap-1.5"><Check className="h-3.5 w-3.5 text-primary mt-0.5" /> Bookmarks & highlights</li>
            <li className="flex gap-1.5"><Check className="h-3.5 w-3.5 text-primary mt-0.5" /> Priority support</li>
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">सहायता से चुनने हेतु WhatsApp करें →</p>
        </div>

        {/* All access */}
        <div className="rounded-xl border border-secondary/40 bg-secondary/10 p-4">
          <p className="text-xs uppercase tracking-wider text-secondary-foreground/80">पूरा पुस्तकालय</p>
          <p className="text-2xl font-bold text-foreground mt-1">₹{allAccess}</p>
          <p className="text-xs text-muted-foreground">जीवनभर सभी ग्रन्थ</p>
          <ul className="mt-3 space-y-1 text-xs text-foreground/80">
            <li className="flex gap-1.5"><Check className="h-3.5 w-3.5 text-primary mt-0.5" /> 200+ ग्रन्थ</li>
            <li className="flex gap-1.5"><Check className="h-3.5 w-3.5 text-primary mt-0.5" /> भविष्य के सभी updates</li>
            <li className="flex gap-1.5"><Check className="h-3.5 w-3.5 text-primary mt-0.5" /> Family sharing</li>
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">सहायता हेतु WhatsApp करें →</p>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-2 text-center">
        Bundles अभी manual activation पर हैं — order के बाद team आपको activate कर देती है।
      </p>
    </div>
  );
};

export default BundleDecoy;
