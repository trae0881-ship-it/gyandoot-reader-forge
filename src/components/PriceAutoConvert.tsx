import { useEffect } from "react";
import { useLocale } from "@/hooks/useLocale";

/**
 * Automatically converts ₹NNNN prices in visible text to the user's chosen currency.
 * Non-invasive: scans DOM text nodes, keeps original in a WeakMap, restores/updates on change.
 * Skips inputs, scripts, code, and elements with class "notranslate" or "no-convert".
 */
const CURRENCY_SYMBOL: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
};

const PRICE_RE = /₹\s?([\d,]+(?:\.\d+)?)/g;
const originals = new WeakMap<Text, string>();
const tracked = new Set<Text>();

const shouldSkip = (node: Node): boolean => {
  let p: Node | null = node.parentNode;
  while (p && p !== document.body) {
    if (p.nodeType === 1) {
      const el = p as HTMLElement;
      const tag = el.tagName;
      if (["SCRIPT", "STYLE", "CODE", "PRE", "INPUT", "TEXTAREA", "NOSCRIPT"].includes(tag)) return true;
      if (el.classList?.contains("notranslate") || el.classList?.contains("no-convert")) return true;
      if (el.isContentEditable) return true;
    }
    p = p.parentNode;
  }
  return false;
};

const collectTextNodes = (root: Node, out: Text[]) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      if (!n.nodeValue || !n.nodeValue.includes("₹")) return NodeFilter.FILTER_REJECT;
      if (shouldSkip(n)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let cur = walker.nextNode();
  while (cur) {
    out.push(cur as Text);
    cur = walker.nextNode();
  }
};

const PriceAutoConvert = () => {
  const { currency, rates } = useLocale();

  useEffect(() => {
    const rate = rates[currency] || 1;
    const sym = CURRENCY_SYMBOL[currency] || "";

    const applyToNode = (n: Text) => {
      let original = originals.get(n);
      if (!original) {
        original = n.nodeValue || "";
        // only track if it has a price pattern
        if (!/₹\s?[\d,]/.test(original)) return;
        originals.set(n, original);
        tracked.add(n);
      }
      if (currency === "INR") {
        if (n.nodeValue !== original) n.nodeValue = original;
        return;
      }
      const replaced = original.replace(PRICE_RE, (_m, num) => {
        const val = parseFloat(String(num).replace(/,/g, ""));
        if (isNaN(val)) return _m;
        const conv = val * rate;
        return `${sym}${conv.toFixed(2)}`;
      });
      if (n.nodeValue !== replaced) n.nodeValue = replaced;
    };

    const scan = (root: Node) => {
      const nodes: Text[] = [];
      collectTextNodes(root, nodes);
      nodes.forEach(applyToNode);
    };

    // initial pass + re-apply to tracked nodes for currency change
    tracked.forEach((n) => {
      if (n.isConnected) applyToNode(n);
      else tracked.delete(n);
    });
    scan(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1) scan(n);
          else if (n.nodeType === 3) {
            const t = n as Text;
            if (t.nodeValue?.includes("₹") && !shouldSkip(t)) applyToNode(t);
          }
        });
        if (m.type === "characterData" && m.target.nodeType === 3) {
          const t = m.target as Text;
          if (!originals.has(t) && t.nodeValue?.includes("₹") && !shouldSkip(t)) applyToNode(t);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [currency, rates]);

  return null;
};

export default PriceAutoConvert;
