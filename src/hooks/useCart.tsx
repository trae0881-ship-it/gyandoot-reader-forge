import { useCallback, useEffect, useState } from "react";

const KEY = "gn_cart_v1";

export interface CartItem {
  slug: string;
  title: string;
  cover_url?: string | null;
  author?: string | null;
  price: number;
  is_free?: boolean;
  qty: number;
}

const read = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const write = (items: CartItem[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("gn:cart-updated"));
  } catch {
    /* ignore */
  }
};

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => read());

  useEffect(() => {
    const sync = () => setItems(read());
    window.addEventListener("storage", sync);
    window.addEventListener("gn:cart-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("gn:cart-updated", sync);
    };
  }, []);

  const addItem = useCallback((item: Omit<CartItem, "qty"> & { qty?: number }) => {
    const current = read();
    const idx = current.findIndex((c) => c.slug === item.slug);
    if (idx >= 0) {
      current[idx] = { ...current[idx], qty: current[idx].qty + (item.qty ?? 1) };
    } else {
      current.push({ ...item, qty: item.qty ?? 1 });
    }
    write(current);
    setItems(current);
  }, []);

  const setQty = useCallback((slug: string, qty: number) => {
    const current = read()
      .map((c) => (c.slug === slug ? { ...c, qty: Math.max(1, Math.min(99, qty)) } : c));
    write(current);
    setItems(current);
  }, []);

  const removeItem = useCallback((slug: string) => {
    const current = read().filter((c) => c.slug !== slug);
    write(current);
    setItems(current);
  }, []);

  const clear = useCallback(() => {
    write([]);
    setItems([]);
  }, []);

  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  return { items, addItem, setQty, removeItem, clear, count, subtotal };
}
