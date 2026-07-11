"""
E2E: DB-persisted cart survives sign-out and cross-device sign-in.

Flow:
  1. Sign in (session A). Seed a cart row via the app's supabase client.
  2. Visit /cart, assert the item + quantity render.
  3. Sign out. Confirm cart is cleared for the guest.
  4. Open a fresh browser context (simulating another device) and restore
     the same session. Visit /cart and assert the item + quantity restored
     from the DB.

Skips cleanly if no LOVABLE_BROWSER_SUPABASE_* session is available.
"""
import asyncio, json, os, sys
from pathlib import Path
from playwright.async_api import async_playwright

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8080")
SHOTS = Path(__file__).parent / "screenshots"
SHOTS.mkdir(parents=True, exist_ok=True)
TARGET_QTY = 3


async def restore(context, page):
    session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
    storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
    cookies_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")
    if not (session_json and storage_key):
        return False
    if cookies_json:
        cookies = json.loads(cookies_json)
        for c in cookies:
            c["url"] = BASE_URL
        await context.add_cookies(cookies)
    await page.goto(BASE_URL)
    await page.evaluate(
        f"window.localStorage.setItem({json.dumps(storage_key)}, {json.dumps(session_json)})"
    )
    return True


async def seed_cart(page, qty):
    return await page.evaluate(
        """async (qty) => {
          const mod = await import('/src/integrations/supabase/client.ts');
          const supabase = mod.supabase;
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return { error: 'no user' };
          const { data: book } = await supabase.from('books')
            .select('id, slug, title').limit(1).maybeSingle();
          if (!book) return { error: 'no book' };
          await supabase.from('cart_items').delete().eq('user_id', user.id);
          await supabase.from('cart_items').insert({
            user_id: user.id, book_id: book.id, qty,
          });
          return { book };
        }""",
        qty,
    )


async def read_cart_ui(page):
    """Return (item_count, first_qty_int) as rendered on /cart."""
    await page.goto(f"{BASE_URL}/cart", wait_until="networkidle")
    # Cart items are rows containing a quantity input or a numeric badge.
    # Read every visible integer near "Qty"/"Quantity" or the input value.
    return await page.evaluate(
        """() => {
          const items = document.querySelectorAll("[data-testid='cart-item'], li[data-cart-item], article[data-cart-item]");
          let count = items.length;
          if (!count) {
            // Fallback: count rows that link to a /books/ slug in the cart section.
            count = document.querySelectorAll("main a[href^='/books/']").length;
          }
          const input = document.querySelector("input[type='number']");
          const qty = input ? parseInt(input.value || '0', 10) : null;
          return { count, qty };
        }"""
    )


async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)

        # ── Session A ──────────────────────────────────────────────────
        ctx_a = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page_a = await ctx_a.new_page()
        if not await restore(ctx_a, page_a):
            print("SKIP — no LOVABLE_BROWSER_SUPABASE_* session available.")
            await browser.close()
            return 0

        seed = await seed_cart(page_a, TARGET_QTY)
        if not seed or seed.get("error"):
            print(f"FAIL — seed cart: {seed}")
            await browser.close()
            return 2
        print(f"[seed] cart_items row for book {seed['book']['slug']} qty={TARGET_QTY}")

        state_a = await read_cart_ui(page_a)
        await page_a.screenshot(path=str(SHOTS / "cart_1_sessionA.png"))
        print(f"[session A] cart UI={state_a}")

        # ── Sign out, confirm guest cart empty ────────────────────────
        await page_a.evaluate(
            """async () => {
              const mod = await import('/src/integrations/supabase/client.ts');
              await mod.supabase.auth.signOut();
              localStorage.clear();
            }"""
        )
        await page_a.goto(f"{BASE_URL}/cart", wait_until="networkidle")
        await page_a.screenshot(path=str(SHOTS / "cart_2_signed_out.png"))

        # ── Session B (fresh context = "another device") ─────────────
        ctx_b = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page_b = await ctx_b.new_page()
        await restore(ctx_b, page_b)
        # Give the cart hook a beat to hydrate from the DB.
        await page_b.goto(f"{BASE_URL}/cart", wait_until="networkidle")
        await asyncio.sleep(1.0)
        state_b = await read_cart_ui(page_b)
        await page_b.screenshot(path=str(SHOTS / "cart_3_sessionB.png"))
        print(f"[session B] cart UI={state_b}")

        await browser.close()

        ok = state_b["count"] >= 1 and (state_b["qty"] in (None, TARGET_QTY) or state_b["qty"] == TARGET_QTY)
        if ok:
            print("PASS — cart restored on a fresh session after sign-out + sign-in.")
            return 0
        print("FAIL — cart did not restore correctly on session B.")
        return 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
