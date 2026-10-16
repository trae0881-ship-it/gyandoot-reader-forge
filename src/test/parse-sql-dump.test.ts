import { describe, it, expect } from "vitest";
import { parseSqlDump } from "@/lib/parseSqlDump";

describe("parseSqlDump", () => {
  it("parses export INSERTs incl. quotes, newlines, nulls, booleans", () => {
    const sql = `BEGIN;\nINSERT INTO "books" ("id", "title", "price", "is_free", "cover_url") VALUES ('a1', 'It''s (gita),\nline2', 227, FALSE, NULL);\nINSERT INTO "books" ("id", "title", "price", "is_free", "cover_url") VALUES ('a2', 'x', 0, TRUE, 'u');\nCOMMIT;`;
    const r = parseSqlDump(sql);
    expect(r).toHaveLength(1);
    expect(r[0].rows).toHaveLength(2);
    expect(r[0].rows[0]).toEqual({ id: "a1", title: "It's (gita),\nline2", price: 227, is_free: false, cover_url: null });
    expect(r[0].rows[1].is_free).toBe(true);
  });
});
