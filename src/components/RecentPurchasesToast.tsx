import { useEffect, useState } from "react";
import { ShoppingBag, X } from "lucide-react";

const NAMES = [
  "रवि शर्मा", "अनिता वर्मा", "सुरेश यादव", "प्रिया गुप्ता", "मनोज तिवारी",
  "कविता सिंह", "अमित जोशी", "नेहा अग्रवाल", "विकास पांडे", "स्नेहा मिश्रा",
  "राहुल सक्सेना", "पूजा त्रिपाठी", "दीपक चौहान", "मीरा देवी", "अजय कुमार",
  "रचना दुबे", "संजय राठौर", "गीता बहन", "आशीष नायक", "रेखा सोनी",
];

const CITIES = [
  "जयपुर", "लखनऊ", "वाराणसी", "इंदौर", "पटना", "अहमदाबाद", "भोपाल",
  "नागपुर", "कानपुर", "रायपुर", "दिल्ली", "मुंबई", "पुणे", "रांची",
  "देहरादून", "गोरखपुर", "उज्जैन", "हरिद्वार", "नासिक", "अमृतसर",
];

const BOOKS = [
  "श्रीमद्भगवद्गीता", "रामचरितमानस", "हनुमान चालीसा सार",
  "उपनिषद दर्शन", "योग वाशिष्ठ", "विष्णु पुराण",
  "श्रीमद्भागवत", "देवी महात्म्य", "नारद भक्ति सूत्र",
];

const TIMES = ["अभी-अभी", "1 मिनट पहले", "2 मिनट पहले", "5 मिनट पहले", "8 मिनट पहले", "12 मिनट पहले"];

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const RecentPurchasesToast = () => {
  const [item, setItem] = useState<null | { name: string; city: string; book: string; time: string }>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    let alive = true;
    const show = () => {
      if (!alive) return;
      setItem({ name: pick(NAMES), city: pick(CITIES), book: pick(BOOKS), time: pick(TIMES) });
      setTimeout(() => alive && setItem(null), 6000);
    };
    const initial = setTimeout(show, 8000);
    const loop = setInterval(show, 22000);
    return () => {
      alive = false;
      clearTimeout(initial);
      clearInterval(loop);
    };
  }, [dismissed]);

  if (dismissed || !item) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-40 max-w-[300px] sm:max-w-xs animate-in slide-in-from-bottom-4 fade-in duration-500"
    >
      <div className="rounded-xl border border-primary/20 bg-card/95 backdrop-blur shadow-lg p-3 pr-8 flex gap-3">
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <ShoppingBag className="h-4 w-4" />
        </div>
        <div className="text-xs leading-snug text-foreground">
          <p>
            <strong>{item.name}</strong> <span className="text-muted-foreground">({item.city})</span> ने
          </p>
          <p className="text-foreground/90">"{item.book}" unlock किया</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">✓ Verified · {item.time}</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="absolute top-1.5 right-1.5 p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default RecentPurchasesToast;
