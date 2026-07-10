import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, MapPin, Monitor, Smartphone, Tablet, ExternalLink, Download, User } from "lucide-react";

interface VisitorLog {
  id: string;
  user_id: string | null;
  user_name?: string | null;
  ip_address: string | null;

  country: string | null;
  country_code: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  isp: string | null;
  user_agent: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  landing_path: string | null;
  language: string | null;
  screen: string | null;
  created_at: string;
}

const DeviceIcon = ({ type }: { type: string | null }) => {
  if (type === "Mobile") return <Smartphone className="h-4 w-4" />;
  if (type === "Tablet") return <Tablet className="h-4 w-4" />;
  return <Monitor className="h-4 w-4" />;
};

const flag = (cc: string | null) => {
  if (!cc || cc.length !== 2) return "";
  const A = 0x1f1e6;
  return String.fromCodePoint(A + cc.toUpperCase().charCodeAt(0) - 65) +
         String.fromCodePoint(A + cc.toUpperCase().charCodeAt(1) - 65);
};

const AdminVisitors = () => {
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("visitor_logs" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000);
    const rows: VisitorLog[] = ((data as any) ?? []);
    const userIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean))) as string[];
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);
      const map = new Map((profs ?? []).map((p: any) => [p.user_id, p.display_name]));
      rows.forEach(r => { if (r.user_id) r.user_name = map.get(r.user_id) ?? null; });
    }
    setLogs(rows);
    setLoading(false);
  };


  useEffect(() => { load(); }, []);

  const filtered = logs.filter((l) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      (l.country ?? "").toLowerCase().includes(s) ||
      (l.city ?? "").toLowerCase().includes(s) ||
      (l.ip_address ?? "").toLowerCase().includes(s) ||
      (l.browser ?? "").toLowerCase().includes(s) ||
      (l.os ?? "").toLowerCase().includes(s) ||
      (l.landing_path ?? "").toLowerCase().includes(s) ||
      (l.referrer ?? "").toLowerCase().includes(s)
    );
  });

  const stats = {
    total: logs.length,
    countries: new Set(logs.map((l) => l.country).filter(Boolean)).size,
    mobile: logs.filter((l) => l.device_type === "Mobile").length,
    direct: logs.filter((l) => !l.referrer).length,
  };

  const exportCsv = () => {
    const headers = ["Time","IP","Country","Region","City","Device","Browser","OS","Referrer","Landing","ISP","Language"];
    const rows = filtered.map((l) => [
      l.created_at, l.ip_address, l.country, l.region, l.city,
      l.device_type, l.browser, l.os, l.referrer, l.landing_path, l.isp, l.language,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `visitors-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Visitor Analytics</h1>
          <p className="text-sm text-muted-foreground">See where your visitors come from — IP, location, device.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-1 h-4 w-4" /> Export CSV</Button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Total Visits</div><div className="text-2xl font-bold">{stats.total}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Countries</div><div className="text-2xl font-bold">{stats.countries}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Mobile Visits</div><div className="text-2xl font-bold">{stats.mobile}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Direct (no referrer)</div><div className="text-2xl font-bold">{stats.direct}</div></Card>
      </div>

      <Input placeholder="Search country, city, IP, browser, path..." value={q} onChange={(e) => setQ(e.target.value)} />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Location</th>
                <th className="p-3">IP / ISP</th>
                <th className="p-3">Device</th>
                <th className="p-3">Browser / OS</th>
                <th className="p-3">Landing</th>
                <th className="p-3">Referrer</th>
                <th className="p-3">Map</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 whitespace-nowrap text-xs">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg leading-none">{flag(l.country_code)}</span>
                      <div>
                        <div className="font-medium">{l.country ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{[l.city, l.region].filter(Boolean).join(", ") || "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-mono text-xs">{l.ip_address ?? "—"}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[180px]">{l.isp ?? ""}</div>
                    {l.user_name || l.user_id ? (
                      <div className="text-xs text-primary mt-1 truncate max-w-[180px] flex items-center gap-1"><User className="h-3 w-3" />{l.user_name ?? l.user_id?.slice(0,8)}</div>
                    ) : null}


                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1"><DeviceIcon type={l.device_type} /> <span>{l.device_type ?? "—"}</span></div>
                    <div className="text-xs text-muted-foreground">{l.screen}</div>
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary" className="mr-1">{l.browser ?? "—"}</Badge>
                    <div className="text-xs text-muted-foreground mt-1">{l.os ?? ""}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-xs font-mono truncate max-w-[180px]">{l.landing_path ?? "/"}</div>
                    <div className="text-xs text-muted-foreground">{l.language}</div>
                  </td>
                  <td className="p-3">
                    {l.referrer ? (
                      <a href={l.referrer} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 max-w-[180px] truncate">
                        {new URL(l.referrer).hostname} <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Direct</span>
                    )}
                  </td>
                  <td className="p-3">
                    {l.latitude && l.longitude ? (
                      <a
                        href={`https://www.google.com/maps?q=${l.latitude},${l.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <MapPin className="h-3 w-3" /> Open
                      </a>
                    ) : "—"}
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No visitor logs yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminVisitors;
