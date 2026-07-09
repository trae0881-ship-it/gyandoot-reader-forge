import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export type Currency = "INR" | "USD" | "EUR" | "GBP" | "AED" | "AUD" | "CAD" | "SGD";
export type Language = "hi" | "en" | "es" | "fr" | "de" | "ar" | "zh-CN" | "ja" | "ru" | "pt";

interface LocaleContextValue {
  currency: Currency;
  language: Language;
  setCurrency: (c: Currency) => void;
  setLanguage: (l: Language) => void;
  formatPrice: (inrAmount: number) => string;
  rates: Record<Currency, number>;
  country: string | null;
}

// Base rates against INR (1 INR = X currency). Static fallback; updated from FX API when available.
const FALLBACK_RATES: Record<Currency, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  AED: 0.044,
  AUD: 0.018,
  CAD: 0.016,
  SGD: 0.016,
};

const CURRENCY_SYMBOL: Record<Currency, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
};

// Country → default currency + language
// English-first globally. Only non-English speaking regions auto-switch language.
const COUNTRY_MAP: Record<string, { currency: Currency; language: Language }> = {
  IN: { currency: "INR", language: "en" },
  US: { currency: "USD", language: "en" },
  GB: { currency: "GBP", language: "en" },
  CA: { currency: "CAD", language: "en" },
  AU: { currency: "AUD", language: "en" },
  SG: { currency: "SGD", language: "en" },
  AE: { currency: "AED", language: "ar" },
  SA: { currency: "AED", language: "ar" },
  DE: { currency: "EUR", language: "de" },
  FR: { currency: "EUR", language: "fr" },
  ES: { currency: "EUR", language: "es" },
  IT: { currency: "EUR", language: "en" },
  PT: { currency: "EUR", language: "pt" },
  BR: { currency: "USD", language: "pt" },
  JP: { currency: "USD", language: "ja" },
  CN: { currency: "USD", language: "zh-CN" },
  RU: { currency: "USD", language: "ru" },
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => (localStorage.getItem("gn_currency") as Currency) || "USD");
  const [language, setLanguageState] = useState<Language>(() => (localStorage.getItem("gn_language") as Language) || "en");
  const [rates, setRates] = useState<Record<Currency, number>>(FALLBACK_RATES);
  const [country, setCountry] = useState<string | null>(null);

  // Auto-detect country every load; apply unless the user manually overrode
  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((d) => {
        const code = (d.country_code || "").toUpperCase();
        setCountry(code);
        const map = COUNTRY_MAP[code];
        if (!map) return;

        const manualCurrency = localStorage.getItem("gn_currency_manual") === "1";
        const manualLanguage = localStorage.getItem("gn_language_manual") === "1";

        if (!manualCurrency) {
          setCurrencyState(map.currency);
          localStorage.setItem("gn_currency", map.currency);
        }
        if (!manualLanguage) {
          setLanguageState(map.language);
          localStorage.setItem("gn_language", map.language);
          triggerGoogleTranslate(map.language);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch live FX rates (free, no key)
  useEffect(() => {
    fetch("https://api.exchangerate-api.com/v4/latest/INR")
      .then((r) => r.json())
      .then((d) => {
        if (!d?.rates) return;
        const next: Record<Currency, number> = { ...FALLBACK_RATES };
        (Object.keys(FALLBACK_RATES) as Currency[]).forEach((c) => {
          if (d.rates[c]) next[c] = d.rates[c];
        });
        setRates(next);
      })
      .catch(() => {});
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("gn_currency", c);
    localStorage.setItem("gn_currency_manual", "1");
  }, []);

  const setLanguage = useCallback((l: Language) => {
    setLanguageState(l);
    localStorage.setItem("gn_language", l);
    localStorage.setItem("gn_language_manual", "1");
    triggerGoogleTranslate(l);
  }, []);

  // 1:1 parity: ₹100 base → $100 in USA, €100 in EU, £100 in UK, etc.
  // No FX conversion. Only the currency symbol changes.
  const formatPrice = useCallback(
    (baseAmount: number) => {
      const sym = CURRENCY_SYMBOL[currency];
      if (currency === "INR") return `${sym}${Math.round(baseAmount).toLocaleString("en-IN")}`;
      return `${sym}${Math.round(baseAmount).toLocaleString("en-US")}`;
    },
    [currency]
  );

  // Apply language on mount / change (Google Translate)
  useEffect(() => {
    injectGoogleTranslate();
    // small delay so widget is ready
    const t = setTimeout(() => triggerGoogleTranslate(language), 1200);
    return () => clearTimeout(t);
  }, [language]);

  return (
    <LocaleContext.Provider value={{ currency, language, setCurrency, setLanguage, formatPrice, rates, country }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
};

// --- Google Translate integration ---
let gtInjected = false;
function injectGoogleTranslate() {
  if (gtInjected || typeof window === "undefined") return;
  gtInjected = true;

  // Hidden container required by Google Translate
  if (!document.getElementById("google_translate_element")) {
    const div = document.createElement("div");
    div.id = "google_translate_element";
    div.style.cssText = "position:fixed;top:-9999px;left:-9999px;visibility:hidden;";
    document.body.appendChild(div);
  }

  // Hide default Google banner
  const style = document.createElement("style");
  style.textContent = `
    .goog-te-banner-frame, .skiptranslate { display:none !important; }
    body { top: 0 !important; }
    .goog-tooltip, .goog-tooltip:hover { display:none !important; }
    .goog-text-highlight { background:none !important; box-shadow:none !important; }
  `;
  document.head.appendChild(style);

  (window as any).googleTranslateElementInit = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (window as any).google;
    if (g?.translate?.TranslateElement) {
      new g.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "hi,en,es,fr,de,ar,zh-CN,ja,ru,pt",
          autoDisplay: false,
        },
        "google_translate_element"
      );
    }
  };

  const s = document.createElement("script");
  s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  s.async = true;
  document.head.appendChild(s);
}

function triggerGoogleTranslate(lang: Language, attempt = 0) {
  const setCookie = (val: string) => {
    document.cookie = `googtrans=${val};path=/`;
    const host = window.location.hostname;
    document.cookie = `googtrans=${val};path=/;domain=${host}`;
    const parts = host.split(".");
    if (parts.length > 1) {
      document.cookie = `googtrans=${val};path=/;domain=.${parts.slice(-2).join(".")}`;
    }
  };

  const cookieVal = lang === "en" ? "/en/en" : `/en/${lang}`;
  setCookie(cookieVal);

  // Retry until the Google Translate combo box mounts (script loads async)
  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (select) {
    if (select.value !== lang) {
      select.value = lang;
      select.dispatchEvent(new Event("change"));
    }
    return;
  }
  if (attempt < 40) {
    setTimeout(() => triggerGoogleTranslate(lang, attempt + 1), 300);
  }
}
