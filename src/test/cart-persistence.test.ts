import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

// Hoisted state so the (hoisted) vi.mock factory can reach it safely.
const state = vi.hoisted(() => {
  type Row = { user_id: string; book_id: string; qty: number };
  type Book = {
    id: string; slug: string; title: string;
    author: string | null; cover_url: string | null;
    price: number; is_free: boolean;
  };
  const cartStore: Row[] = [];
  const bookMeta = new Map<string, Book>();
  const currentUser: { value: { id: string } | null } = { value: null };
  return { cartStore, bookMeta, currentUser };
});

vi.mock("@/integrations/supabase/client", () => {
  const { cartStore, bookMeta } = state;

  function selectBuilder() {
    return {
      eq(_col: string, value: string) {
        const rows = cartStore
          .filter((r) => r.user_id === value)
          .map((r) => ({
            qty: r.qty,
            book_id: r.book_id,
            books: bookMeta.get(r.book_id) ?? null,
          }));
        return Promise.resolve({ data: rows, error: null });
      },
    };
  }

  function deleteBuilder() {
    const filters: Record<string, string> = {};
    const apply = () => {
      for (let i = cartStore.length - 1; i >= 0; i--) {
        const r = cartStore[i];
        if (Object.entries(filters).every(([k, v]) => (r as any)[k] === v)) {
          cartStore.splice(i, 1);
        }
      }
    };
    const builder: any = {
      eq(col: string, value: string) {
        filters[col] = value;
        return new Proxy(builder, {
          get(target, prop) {
            if (prop === "then") {
              return (resolve: any) => {
                apply();
                resolve({ error: null });
              };
            }
            return (target as any)[prop];
          },
        });
      },
    };
    return builder;
  }

  const supabase = {
    from(_table: string) {
      return {
        select: () => selectBuilder(),
        upsert(row: { user_id: string; book_id: string; qty: number }) {
          const existing = cartStore.find(
            (r) => r.user_id === row.user_id && r.book_id === row.book_id,
          );
          if (existing) existing.qty = row.qty;
          else cartStore.push({ ...row });
          return Promise.resolve({ error: null });
        },
        delete: () => deleteBuilder(),
      };
    },
  };
  return { supabase };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: state.currentUser.value }),
}));

// Import AFTER mocks are registered.
import { useCart } from "@/hooks/useCart";

const { cartStore, bookMeta, currentUser } = state;

function seedBook(book_id: string, slug: string) {
  bookMeta.set(book_id, {
    id: book_id, slug, title: `Book ${slug}`,
    author: "Test Author", cover_url: null,
    price: 100, is_free: false,
  });
}


beforeEach(() => {
  cartStore.length = 0;
  bookMeta.clear();
  localStorage.clear();
  currentUser.value = null;
  seedBook("book-1", "gita");
  seedBook("book-2", "vedas");
});

describe("useCart DB persistence", () => {
  it("mirrors adds to the database when signed in", async () => {
    currentUser.value = { id: "user-a" };
    const { result } = renderHook(() => useCart());

    await act(async () => {
      result.current.addItem({
        book_id: "book-1",
        slug: "gita",
        title: "Gita",
        price: 100,
      });
    });

    await waitFor(() => {
      const row = cartStore.find((r) => r.book_id === "book-1");
      expect(row?.qty).toBe(1);
    });

    await act(async () => {
      result.current.setQty("gita", 4);
    });
    await waitFor(() =>
      expect(cartStore.find((r) => r.book_id === "book-1")?.qty).toBe(4),
    );

    await act(async () => {
      result.current.removeItem("gita");
    });
    await waitFor(() =>
      expect(cartStore.find((r) => r.book_id === "book-1")).toBeUndefined(),
    );
  });

  it("restores cart from DB after sign-in on a fresh device (empty localStorage)", async () => {
    // Simulate items saved from another device.
    cartStore.push({ user_id: "user-a", book_id: "book-1", qty: 2 });
    cartStore.push({ user_id: "user-a", book_id: "book-2", qty: 5 });

    currentUser.value = { id: "user-a" };
    const { result } = renderHook(() => useCart());

    await waitFor(() => expect(result.current.items).toHaveLength(2));

    const byBookId = Object.fromEntries(
      result.current.items.map((i) => [i.book_id, i]),
    );
    expect(byBookId["book-1"].qty).toBe(2);
    expect(byBookId["book-2"].qty).toBe(5);
    expect(result.current.count).toBe(7);
  });

  it("merges guest localStorage items into the DB cart at sign-in (sums quantities)", async () => {
    // Guest already added something before signing in.
    localStorage.setItem(
      "gn_cart_v1",
      JSON.stringify([
        {
          book_id: "book-1", slug: "gita", title: "Gita",
          price: 100, qty: 1,
        },
      ]),
    );
    // Same book already in DB with qty 2 (from another session).
    cartStore.push({ user_id: "user-a", book_id: "book-1", qty: 2 });

    currentUser.value = { id: "user-a" };
    const { result } = renderHook(() => useCart());

    await waitFor(() =>
      expect(cartStore.find((r) => r.book_id === "book-1")?.qty).toBe(3),
    );
    await waitFor(() => {
      const item = result.current.items.find((i) => i.book_id === "book-1");
      expect(item?.qty).toBe(3);
    });
  });

  it("keeps DB rows on sign-out and restores them on next sign-in (cross-device parity)", async () => {
    // ---- Session 1: sign in, add items ----
    currentUser.value = { id: "user-a" };
    const s1 = renderHook(() => useCart());
    await act(async () => {
      s1.result.current.addItem({
        book_id: "book-1", slug: "gita", title: "Gita", price: 100, qty: 2,
      });
      s1.result.current.addItem({
        book_id: "book-2", slug: "vedas", title: "Vedas", price: 250, qty: 1,
      });
    });
    await waitFor(() => expect(cartStore.length).toBe(2));

    // ---- Sign out: mimic what the app does — clear local session state. ----
    currentUser.value = null;
    localStorage.clear(); // guest cart on this device is empty now
    s1.unmount();

    // ---- Session 2: another device / fresh browser, sign in again ----
    currentUser.value = { id: "user-a" };
    const s2 = renderHook(() => useCart());

    await waitFor(() => expect(s2.result.current.items).toHaveLength(2));
    const restored = Object.fromEntries(
      s2.result.current.items.map((i) => [i.book_id, i.qty]),
    );
    expect(restored).toEqual({ "book-1": 2, "book-2": 1 });
    expect(s2.result.current.subtotal).toBe(2 * 100 + 1 * 250);
  });

  it("does not leak another user's cart on sign-in", async () => {
    cartStore.push({ user_id: "someone-else", book_id: "book-1", qty: 9 });
    currentUser.value = { id: "user-a" };
    const { result } = renderHook(() => useCart());
    // Give the effect a tick.
    await new Promise((r) => setTimeout(r, 20));
    expect(result.current.items).toHaveLength(0);
  });

  it("clear() empties both local and DB carts", async () => {
    currentUser.value = { id: "user-a" };
    cartStore.push({ user_id: "user-a", book_id: "book-1", qty: 3 });
    const { result } = renderHook(() => useCart());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(async () => {
      result.current.clear();
    });
    await waitFor(() =>
      expect(cartStore.filter((r) => r.user_id === "user-a")).toHaveLength(0),
    );
    expect(result.current.items).toHaveLength(0);
  });
});
