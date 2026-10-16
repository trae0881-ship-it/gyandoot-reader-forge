import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud } from "lucide-react";
import { parseSqlDump, type DumpTable } from "@/lib/parseSqlDump";

type Status = { table: string; total: number; done: number; error?: string };
const BATCH = 200;

export default function DatabaseRestoreCard() {
  const { toast } = useToast();
  const [tables, setTables] = useState<DumpTable[]>([]);
  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState<"upsert" | "insert">("upsert");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status[]>([]);

  const onFile = async (f?: File) => {
    if (!f) return;
    setFileName(f.name);
    const parsed = parseSqlDump(await f.text());
    setTables(parsed);
    setStatus(parsed.map((t) => ({ table: t.table, total: t.rows.length, done: 0 })));
    if (!parsed.length) toast({ title: "कोई data नहीं मिला", description: "PostgreSQL export वाली .sql file चुनिए।", variant: "destructive" });
  };

  const send = async (table: string, rows: unknown[]) => {
    const { data, error } = await supabase.functions.invoke("admin-data-restore", { body: { table, rows, mode } });
    if (error) return error.message;
    return data?.ok ? null : data?.error ?? "failed";
  };

  const run = async () => {
    if (!confirm("Upload किया गया data database में डाला जाएगा। आगे बढ़ें?")) return;
    setBusy(true);
    const st = tables.map((t) => ({ table: t.table, total: t.rows.length, done: 0 } as Status));
    const failed: { idx: number; rows: unknown[] }[] = [];
    for (let k = 0; k < tables.length; k++) {
      const t = tables[k];
      for (let i = 0; i < t.rows.length; i += BATCH) {
        const chunk = t.rows.slice(i, i + BATCH);
        const err = await send(t.table, chunk);
        if (err) { failed.push({ idx: k, rows: chunk }); st[k].error = err; }
        else st[k].done += chunk.length;
        setStatus([...st]);
      }
    }
    // Retry pass: rows whose linked records (other tables) arrived later
    for (const f of failed) {
      const err = await send(tables[f.idx].table, f.rows);
      if (!err) { st[f.idx].done += f.rows.length; if (st[f.idx].done >= st[f.idx].total) st[f.idx].error = undefined; }
      else st[f.idx].error = err;
      setStatus([...st]);
    }
    setBusy(false);
    const bad = st.filter((s) => s.error).length;
    toast({ title: bad ? `${bad} table में समस्या` : "Restore पूरा हुआ", variant: bad ? "destructive" : "default" });
  };

  const total = status.reduce((a, s) => a + s.total, 0);
  const done = status.reduce((a, s) => a + s.done, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database upload / restore</CardTitle>
        <CardDescription>
          पहले download की गई PostgreSQL .sql file चुनिए — सभी tables का data अपने-आप भर जाएगा।
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input type="file" accept=".sql,text/plain" disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} />
        {tables.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground">{fileName}: {tables.length} tables, {total} rows</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" checked={mode === "upsert"} onChange={() => setMode("upsert")} /> पुराना data update करें
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={mode === "insert"} onChange={() => setMode("insert")} /> केवल नया data जोड़ें
              </label>
            </div>
            <Button onClick={run} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              Restore शुरू करें
            </Button>
            {total > 0 && <Progress value={(done / total) * 100} />}
            <div className="max-h-72 overflow-auto rounded border text-sm">
              {status.map((s) => (
                <div key={s.table} className="flex justify-between gap-2 border-b px-3 py-1.5 last:border-0">
                  <span className="font-mono">{s.table}</span>
                  <span className={s.error ? "text-destructive" : "text-muted-foreground"}>
                    {s.done}/{s.total}{s.error ? ` — ${s.error.slice(0, 80)}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
