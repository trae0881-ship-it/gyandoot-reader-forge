import { Check, Sparkles, Crown } from "lucide-react";

interface Props {
  price: number;
  onSelectSingle?: () => void;
}

/**
 * Anchored pricing block — surfaces a "best value" 3-book bundle and a full
 * library option next to the single-book price to lift AOV.
 */
const BundleDecoy = ({ price, onSelectSingle }: Props) => {
  const tripleFull = Math.max(price * 3, 99);
  const tripleSave = Math.round(tripleFull * 0.7);
  const allAccess = 999;

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-serif text-xl sm:text-2xl font-bold">Pick your best value</h2>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {/* Single */}
        <button
          type="button"
          onClick={onSelectSingle}
          className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition"
        >
          <p className="text-xs uppercase tracking-wider text-muted-foreground">This Book</p>
          <p className="text-2xl font-bold text-foreground mt-1">₹{price}</p>
          <p className="text-xs text-muted-foreground">Lifetime access</p>
          <ul className="mt-3 space-y-1 text-xs text-foreground/80">
            <li className="flex gap-1.5"><Check className="h-3.5 w-3.5 text-primary mt-0.5" /> 1 scripture</li>
            <li className="flex gap-1.5"><Check className="h-3.5 w-3.5 text-primary mt-0.5" /> Bookmarks & notes</li>
            <li className="flex gap-1.5"><Check className="h-3.5 w-3.5 text-primary mt-0.5" /> 7-day refund</li>
          </ul>
        </button>

        {/* Decoy — 3 books, most popular */}
        <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 relative">
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
            Most Popular
          </span>
          <p className="text-xs uppercase tracking-wider text-primary">Any 3 Books Bundle</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            ₹{tripleSave}
            <span className="text-xs text-muted-foreground line-through ml-2">₹{tripleFull}</span>
          </p>
          <p className="text-xs text-primary font-semibold">Save ~30%</p>
          <ul className="mt-3 space-y-1 text-xs text-foreground/80">
            <li className="flex gap-1.5"><Check className="h-3.5 w-3.5 text-primary mt-0.5" /> Pick any 3 scriptures</li>
            <li className="flex gap-1.5"><Check className="h-3.5 w-3.5 text-primary mt-0.5" /> Bookmarks & highlights</li>
            <li className="flex gap-1.5"><Check className="h-3.5 w-3.5 text-primary mt-0.5" /> Priority support</li>
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">WhatsApp us to activate →</p>
        </div>

        {/* All access */}
        <div className="rounded-xl border border-secondary/40 bg-secondary/10 p-4 relative">
          <span className="absolute -top-2 right-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
            <Crown className="h-2.5 w-2.5" /> Best Value
          </span>
          <p className="text-xs uppercase tracking-wider text-secondary-foreground/80">Full Library</p>
          <p className="text-2xl font-bold text-foreground mt-1">₹{allAccess}</p>
          <p className="text-xs text-muted-foreground">Lifetime · every book</p>
          <ul className="mt-3 space-y-1 text-xs text-foreground/80">
            <li className="flex gap-1.5"><Check className="h-3.5 w-3.5 text-primary mt-0.5" /> 200+ scriptures</li>
            <li className="flex gap-1.5"><Check className="h-3.5 w-3.5 text-primary mt-0.5" /> All future updates free</li>
            <li className="flex gap-1.5"><Check className="h-3.5 w-3.5 text-primary mt-0.5" /> Family sharing</li>
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">WhatsApp us to activate →</p>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-2 text-center">
        Bundles are manually activated — our team enables them within minutes of purchase.
      </p>
    </div>
  );
};

export default BundleDecoy;
