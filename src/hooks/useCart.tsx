import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const KEY = "gn_cart_v1";

export interface CartItem {
  slug: string;
  title: string;
  cover_url?: string | null;
  author?: string | null;
  price: number;
  is_free?: boolean;
  qty: number;
  book_id?: string; // required for DB sync; older localStorage entries may lack it
}

const readLocal = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocal = (items: CartItem[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("gn:cart-updated"));
  } catch {
    /* ignore */
  }
};

async function fetchDbCart(userId: string): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select("qty, book_id, books:books(id, slug, title, author, cover_url, price, is_free)")
    .eq("user_id", userId);
  if (error || !data) return [];
  return data
    .filter((r: any) => r.books)
    .map((r: any) => ({
      book_id: r.books.id,
      slug: r.books.slug,
      title: r.books.title,
      author: r.books.author,
      cover_url: r.books.cover_url,
      price: Number(r.books.price ?? 0),
      is_free: !!r.books.is_free,
      qty: r.qty,
    }));
}

async function upsertDbItem(userId: string, book_id: string, qty: number) {
  await supabase
    .from("cart_items")
    .upsert({ user_id: userId, book_id, qty }, { onConflict: "user_id,book_id" });
}

async function deleteDbItem(userId: string, book_id: string) {
  await supabase.from("cart_items").delete().eq("user_id", userId).eq("book_id", book_id);
}

async function clearDbCart(userId: string) {
  await supabase.from("cart_items").delete().eq("user_id", userId);
}

export function useCart() {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => readLocal());
  const hydratedFor = useRef<string | null>(null);

  // Hydrate + merge on login; clear local view on logout.
  useEffect(() => {
    if (!user) {
      hydratedFor.current = null;
      return;
    }
    if (hydratedFor.current === user.id) return;
    hydratedFor.current = user.id;

    (async () => {
      const [dbItems, localItems] = [await fetchDbCart(user.id), readLocal()];
      const byBookId = new Map<string, CartItem>();
      dbItems.forEach((i) => i.book_id && byBookId.set(i.book_id, i));
      // Merge local items with a book_id into DB (local wins on quantity).
      for (const li of localItems) {
        if (!li.book_id) continue;
        const merged = byBookId.get(li.book_id);
        const qty = Math.min(99, (merged?.qty ?? 0) + li.qty);
        await upsertDbItem(user.id, li.book_id, qty);
        byBookId.set(li.book_id, { ...(merged ?? li), qty });
      }
      const finalItems = Array.from(byBookId.values());
      writeLocal(finalItems);
      setItems(finalItems);
    })();
  }, [user]);

  useEffect(() => {
    const sync = () => setItems(readLocal());
    window.addEventListener("storage", sync);
    window.addEventListener("gn:cart-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("gn:cart-updated", sync);
    };
  }, []);

  const addItem = useCallback(
    (item: Omit<CartItem, "qty"> & { qty?: number }) => {
      const current = readLocal();
      const idx = current.findIndex((c) => c.slug === item.slug);
      let nextQty = item.qty ?? 1;
      if (idx >= 0) {
        nextQty = Math.min(99, current[idx].qty + (item.qty ?? 1));
        current[idx] = { ...current[idx], ...item, qty: nextQty };
      } else {
        current.push({ ...item, qty: nextQty });
      }
      writeLocal(current);
      setItems(current);
      if (user && item.book_id) {
        void upsertDbItem(user.id, item.book_id, nextQty);
      }
    },
    [user],
  );

  const setQty = useCallback(
    (slug: string, qty: number) => {
      const clamped = Math.max(1, Math.min(99, qty));
      let target: CartItem | undefined;
      const current = readLocal().map((c) => {
        if (c.slug !== slug) return c;
        target = { ...c, qty: clamped };
        return target;
      });
      writeLocal(current);
      setItems(current);
      if (user && target?.book_id) {
        void upsertDbItem(user.id, target.book_id, clamped);
      }
    },
    [user],
  );

  const removeItem = useCallback(
    (slug: string) => {
      const removed = readLocal().find((c) => c.slug === slug);
      const current = readLocal().filter((c) => c.slug !== slug);
      writeLocal(current);
      setItems(current);
      if (user && removed?.book_id) {
        void deleteDbItem(user.id, removed.book_id);
      }
    },
    [user],
  );

  const clear = useCallback(() => {
    writeLocal([]);
    setItems([]);
    if (user) void clearDbCart(user.id);
  }, [user]);

  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  return { items, addItem, setQty, removeItem, clear, count, subtotal };
}
