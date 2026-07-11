import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Cfg = {
  enabled: boolean;
  coupon: string;
  discount: string;
  endsAt: number | null; // ms timestamp; null = end of today
  link: string;
};

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function format(ms: number) {
  if (ms < 0) ms = 0;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function UrgencyBanner() {
  const [closed, setClosed] = useState(false);
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [now, setNow] = useState(Date.now());
  const [mounted, setMounted] = useState(false);


  useEffect(() => {
    // Skip entirely during prerender (Playwright sets navigator.webdriver).
    // This prevents the countdown from being baked into static HTML.
    if (typeof navigator !== "undefined" && navigator.webdriver) return;
    setMounted(true);
    if (sessionStorage.getItem("gn_urgency_closed")) setClosed(true);


    (async () => {
      const { data } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", ["urgency_enabled", "urgency_coupon", "urgency_discount_label", "urgency_ends_at", "urgency_link"]);
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: any) => { map[r.key] = r.value ?? ""; });
      const endsRaw = (map.urgency_ends_at ?? "").trim();
      const endsAt = endsRaw ? new Date(endsRaw).getTime() : null;
      setCfg({
        enabled: (map.urgency_enabled ?? "true").toLowerCase() !== "false",
        coupon: map.urgency_coupon || "BHAKTI20",
        discount: map.urgency_discount_label || "20% off",
        endsAt: Number.isFinite(endsAt as number) ? (endsAt as number) : null,
        link: map.urgency_link || "/books",
      });
    })();
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!mounted || closed || !cfg || !cfg.enabled) return null;
  const target = cfg.endsAt ?? endOfToday();
  const remaining = target - now;
  if (remaining <= 0) return null;

  return (
    <div className="bg-gradient-to-r from-secondary via-secondary/95 to-secondary text-secondary-foreground">
      <div className="container flex items-center justify-between gap-2 py-1.5 text-xs md:text-sm">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Flame className="h-3.5 w-3.5 shrink-0 animate-pulse" />
          <p className="truncate font-semibold">
            आज की डील — कोड{" "}
            <Link to={cfg.link} className="underline underline-offset-2 font-extrabold">
              {cfg.coupon}
            </Link>{" "}
            से {cfg.discount} • खत्म होने में{" "}
            <span className="font-mono font-bold tabular-nums">{format(remaining)}</span>
          </p>
        </div>
        <button
          aria-label="Close"
          className="shrink-0 rounded p-1 hover:bg-secondary-foreground/10"
          onClick={() => {
            sessionStorage.setItem("gn_urgency_closed", "1");
            setClosed(true);
          }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
