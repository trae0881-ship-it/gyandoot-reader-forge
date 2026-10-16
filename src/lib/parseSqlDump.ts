/**
 * Parses INSERT statements produced by the admin-data-export (PostgreSQL dialect).
 * Returns rows grouped by table, in file order. Values: null | number | boolean | string.
 */
export type DumpValue = string | number | boolean | null;
export type DumpTable = { table: string; rows: Record<string, DumpValue>[] };

export function parseSqlDump(sql: string): DumpTable[] {
  const out: DumpTable[] = [];
  const byName = new Map<string, DumpTable>();
  const marker = 'INSERT INTO "';
  let i = 0;
  const n = sql.length;

  const skipWs = () => {
    while (i < n && /\s/.test(sql[i])) i++;
  };

  while (true) {
    const at = sql.indexOf(marker, i);
    if (at === -1) break;
    i = at + marker.length;
    const tEnd = sql.indexOf('"', i);
    if (tEnd === -1) break;
    const table = sql.slice(i, tEnd);
    i = tEnd + 1;
    skipWs();
    if (sql[i] !== "(") continue;
    const cEnd = sql.indexOf(")", i);
    const cols = sql
      .slice(i + 1, cEnd)
      .split(",")
      .map((c) => c.trim().replace(/^"|"$/g, ""));
    i = cEnd + 1;
    skipWs();
    if (!sql.startsWith("VALUES", i)) continue;
    i += 6;
    skipWs();
    if (sql[i] !== "(") continue;
    i++;
    const vals: DumpValue[] = [];
    while (i < n) {
      skipWs();
      if (sql[i] === "'") {
        let s = "";
        i++;
        while (i < n) {
          if (sql[i] === "'") {
            if (sql[i + 1] === "'") {
              s += "'";
              i += 2;
              continue;
            }
            i++;
            break;
          }
          s += sql[i++];
        }
        vals.push(s);
      } else {
        let j = i;
        while (j < n && sql[j] !== "," && sql[j] !== ")") j++;
        const tok = sql.slice(i, j).trim();
        i = j;
        if (tok === "NULL") vals.push(null);
        else if (tok === "TRUE") vals.push(true);
        else if (tok === "FALSE") vals.push(false);
        else vals.push(Number(tok));
      }
      skipWs();
      if (sql[i] === ",") {
        i++;
        continue;
      }
      if (sql[i] === ")") {
        i++;
        break;
      }
    }
    const row: Record<string, DumpValue> = {};
    cols.forEach((c, k) => (row[c] = vals[k] ?? null));
    let t = byName.get(table);
    if (!t) {
      t = { table, rows: [] };
      byName.set(table, t);
      out.push(t);
    }
    t.rows.push(row);
  }
  return out;
}
