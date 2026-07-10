import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Play, RefreshCcw, Mail, Send, Sparkles, TrendingUp, Eye, MousePointerClick, Target, BookOpen, Calendar, Rocket, ListChecks } from "lucide-react";
import SeoFlowChart from "@/components/admin/SeoFlowChart";

type Post = {
  id: string; title: string; slug: string; publish_status: string; scheduled_at: string | null;
  primary_keyword: string | null; gsc_clicks: number; gsc_impressions: number; gsc_ctr: number;
  gsc_position: number | null; is_published: boolean; updated_at: string; word_count: number | null;
  report_sent_at: string | null; indexing_submitted_at: string | null;
  social_captions: any; content_score: number | null; readability_score: number | null;
  originality_score: number | null; quality_passed: boolean | null;
};

const StatCard = ({ icon: Icon, label, value, sub, tone }: any) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`text-3xl font-bold ${tone === "warn" ? "text-orange-600" : tone === "good" ? "text-green-600" : ""}`}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <Icon className="h-8 w-8 text-primary/60" />
      </div>
    </CardContent>
  </Card>
);

const AdminSeoCommand = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [gsc, setGsc] = useState<any>(null);
  const [kb, setKb] = useState<any[]>([]);
  const [runLog, setRunLog] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const [{ data: p }, { data: l }, { data: q }, { data: k }, { data: r }] = await Promise.all([
      supabase.from("posts").select("*").eq("post_type", "article").order("updated_at", { ascending: false }).limit(80),
      supabase.from("seo_agent_logs").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("seo_keyword_queue").select("*").order("opportunity_score", { ascending: false }).limit(50),
      supabase.from("book_knowledge").select("book_id,title,topics,keywords,updated_at").order("updated_at", { ascending: false }),
      supabase.from("daily_run_log").select("*").order("started_at", { ascending: false }).limit(15),
    ]);
    setPosts((p as Post[]) || []);
    setLogs(l || []);
    setQueue(q || []);
    setKb(k || []);
    setRunLog(r || []);
  };

  useEffect(() => { load(); }, []);

  const call = async (fn: string, body: any = {}, label = fn) => {
    setBusy(label);
    try {
      const { data, error } = await supabase.functions.invoke(fn, { body });
      if (error) throw error;
      toast.success(`${label} complete`);
      return data;
    } catch (e: any) {
      toast.error(`${label} failed: ${e?.message || e}`);
    } finally { setBusy(null); }
  };

  const syncGsc = async () => { const r = await call("seo-gsc-sync", {}, "GSC sync"); if (r) { setGsc(r); await load(); } };
  const runDaily = async () => { await call("seo-daily-publisher", {}, "Daily publisher"); await load(); };
  const refreshKb = async () => { await call("seo-book-kb-refresh", { force: true }, "Book KB refresh"); await load(); };
  const topUp = async () => { await call("seo-queue-topup", {}, "Queue top-up"); await load(); };
  const publishHook = async (id: string) => { await call("seo-post-publish-hook", { post_id: id }, "Publish hook"); await load(); };
  const genSocial = async (id: string) => { await call("seo-social-captions", { post_id: id }, "Social captions"); await load(); };

  const scheduled = posts
    .filter((p) => p.publish_status === "scheduled" && p.scheduled_at && new Date(p.scheduled_at) > new Date())
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime());
  const published = posts.filter((p) => p.is_published);
  const drafts = posts.filter((p) => p.publish_status === "draft");
  const totalClicks = published.reduce((s, p) => s + (p.gsc_clicks || 0), 0);
  const totalImpr = published.reduce((s, p) => s + (p.gsc_impressions || 0), 0);
  const avgPos = published.filter((p) => p.gsc_position).reduce((s, p, _, arr) => s + (p.gsc_position || 0) / arr.length, 0);
  const kbAge = kb[0]?.updated_at ? Math.round((Date.now() - new Date(kb[0].updated_at).getTime()) / 3600000) : null;
  const queueBelowMin = scheduled.length < 30;

  return (
    <div className="space-y-6 notranslate" translate="no">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">SEO Command Center</h1>
          <p className="text-muted-foreground text-sm">
            Daily blog automation — runs at 09:00 IST · maintains 30+ scheduled queue · book-grounded
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={runDaily} disabled={!!busy} size="sm">
            {busy === "Daily publisher" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />} Run Daily Now
          </Button>
          <Button onClick={topUp} disabled={!!busy} size="sm" variant="secondary">
            {busy === "Queue top-up" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListChecks className="h-4 w-4" />} Top-up Queue
          </Button>
          <Button onClick={refreshKb} disabled={!!busy} size="sm" variant="outline">
            {busy === "Book KB refresh" ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />} Refresh Book KB
          </Button>
          <Button onClick={syncGsc} disabled={!!busy} variant="outline" size="sm">
            {busy === "GSC sync" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Sync GSC (28d)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Scheduled Blogs" value={scheduled.length}
          sub={queueBelowMin ? `Below 30 — top-up runs every 6h` : "Healthy queue (≥30)"}
          tone={queueBelowMin ? "warn" : "good"} />
        <StatCard icon={BookOpen} label="Book Knowledge" value={kb.length}
          sub={kbAge !== null ? `Updated ${kbAge}h ago` : "Not built yet"}
          tone={kb.length === 0 ? "warn" : "good"} />
        <StatCard icon={MousePointerClick} label="GSC Clicks (28d)" value={totalClicks} sub={`${totalImpr} impressions`} />
        <StatCard icon={Target} label="Avg Position" value={avgPos ? avgPos.toFixed(1) : "—"} sub={`${published.length} published · ${drafts.length} drafts`} />
      </div>

      <SeoFlowChart runLog={runLog} posts={posts} busy={busy} onRunDaily={runDaily} />

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Scheduled ({scheduled.length})</TabsTrigger>
          <TabsTrigger value="runs">Daily Runs ({runLog.length})</TabsTrigger>
          <TabsTrigger value="kb">Book KB ({kb.length})</TabsTrigger>
          <TabsTrigger value="published">Published ({published.length})</TabsTrigger>
          <TabsTrigger value="queue">Keyword Queue ({queue.length})</TabsTrigger>
          <TabsTrigger value="logs">Agent Logs</TabsTrigger>
          <TabsTrigger value="gsc">GSC</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <Card><CardContent className="pt-6">
            {queueBelowMin && (
              <div className="mb-3 rounded-md border border-orange-200 bg-orange-50 text-orange-900 p-3 text-sm">
                Queue is below 30. Auto top-up runs every 6h — or click "Top-up Queue" to generate now.
              </div>
            )}
            <Table>
              <TableHeader><TableRow>
                <TableHead>Date</TableHead><TableHead>Time (IST)</TableHead><TableHead>Keyword / Title</TableHead>
                <TableHead>SEO Score</TableHead><TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {scheduled.map((p) => {
                  const d = new Date(p.scheduled_at!);
                  const ist = new Date(d.getTime() + (5.5 * 3600 * 1000 - d.getTimezoneOffset() * 60000));
                  return (
                    <TableRow key={p.id}>
                      <TableCell>{ist.toISOString().slice(0, 10)}</TableCell>
                      <TableCell>{ist.toISOString().slice(11, 16)}</TableCell>
                      <TableCell className="max-w-[380px]">
                        <div className="font-medium truncate">{p.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{p.primary_keyword || `/${p.slug}`}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={((p.content_score || 0) >= 70) ? "default" : "secondary"}>
                          {p.content_score ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell><Badge variant="outline">scheduled</Badge></TableCell>
                    </TableRow>
                  );
                })}
                {scheduled.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No upcoming posts. Top-up runs every 6h.
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="runs">
          <Card><CardContent className="pt-6">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Started</TableHead><TableHead>Status</TableHead><TableHead>Keyword</TableHead>
                <TableHead>SEO</TableHead><TableHead>Readability</TableHead><TableHead>Originality</TableHead>
                <TableHead>Post</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {runLog.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{new Date(r.started_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "success" ? "default" : r.status === "failed" ? "destructive" : "secondary"}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{r.keyword || "—"}</TableCell>
                    <TableCell>{r.seo_score ?? "—"}</TableCell>
                    <TableCell>{r.readability_score ? r.readability_score.toFixed(0) : "—"}</TableCell>
                    <TableCell>{r.originality_score ?? "—"}</TableCell>
                    <TableCell className="text-xs">{r.post_id ? "✓" : (r.error || "—")}</TableCell>
                  </TableRow>
                ))}
                {runLog.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                    No runs yet. Click "Run Daily Now" or wait for 09:00 IST.
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="kb">
          <Card><CardContent className="pt-6">
            {kb.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Knowledge base not built yet. Click "Refresh Book KB" — the AI reads all books and extracts topics,
                entities, concepts, keywords and FAQs used to ground every generated article.
              </p>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Book</TableHead><TableHead>Topics</TableHead>
                  <TableHead>Keywords</TableHead><TableHead>Updated</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {kb.map((k: any) => (
                    <TableRow key={k.book_id}>
                      <TableCell className="font-medium max-w-[300px] truncate">{k.title}</TableCell>
                      <TableCell className="text-xs">{(k.topics || []).slice(0, 5).join(", ")}</TableCell>
                      <TableCell className="text-xs">{(k.keywords || []).length}</TableCell>
                      <TableCell className="text-xs">{new Date(k.updated_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="published">
          <Card><CardContent className="pt-6">
            <PostTable posts={published} onPublishHook={publishHook} onGenSocial={genSocial} busy={busy} showMetrics />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="queue">
          <Card><CardContent className="pt-6">
            {queue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No keywords in queue yet. Run the daily publisher — it discovers keywords from Google/Reddit/Quora, filters by book relevance, and stores winners here.</p>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Keyword</TableHead><TableHead>Intent</TableHead><TableHead>Volume</TableHead>
                  <TableHead>Difficulty</TableHead><TableHead>Opportunity</TableHead><TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {queue.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-medium">{k.keyword}</TableCell>
                      <TableCell>{k.search_intent || "—"}</TableCell>
                      <TableCell>{k.estimated_volume || "—"}</TableCell>
                      <TableCell>{k.keyword_difficulty || "—"}</TableCell>
                      <TableCell>{k.opportunity_score?.toFixed?.(1) || "—"}</TableCell>
                      <TableCell><Badge variant={k.status === "used" ? "default" : "secondary"}>{k.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card><CardContent className="pt-6">
            <Table>
              <TableHeader><TableRow>
                <TableHead>When</TableHead><TableHead>Keyword</TableHead><TableHead>Slug</TableHead>
                <TableHead>Status</TableHead><TableHead>Time</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs">{new Date(l.created_at).toLocaleString()}</TableCell>
                    <TableCell>{l.focus_keyword || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{l.slug || "—"}</TableCell>
                    <TableCell><Badge variant={l.status === "error" ? "destructive" : "default"}>{l.status}</Badge></TableCell>
                    <TableCell>{l.execution_ms ? `${(l.execution_ms / 1000).toFixed(1)}s` : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="gsc">
          <Card><CardHeader><CardTitle>Google Search Console (28d)</CardTitle></CardHeader><CardContent>
            {!gsc ? <p className="text-sm text-muted-foreground">Click "Sync GSC (28d)" to fetch fresh data.</p> : (
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div><b>{gsc.totals?.clicks || 0}</b> clicks</div>
                  <div><b>{gsc.totals?.impressions || 0}</b> impressions</div>
                  <div><b>{((gsc.totals?.ctr || 0) * 100).toFixed(2)}%</b> CTR</div>
                  <div><b>{(gsc.totals?.position || 0).toFixed(1)}</b> avg pos</div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Top Queries</h4>
                  <Table>
                    <TableHeader><TableRow><TableHead>Query</TableHead><TableHead>Clicks</TableHead><TableHead>Impr</TableHead><TableHead>Pos</TableHead></TableRow></TableHeader>
                    <TableBody>{(gsc.top_queries || []).map((q: any, i: number) => (
                      <TableRow key={i}><TableCell>{q.keys?.[0]}</TableCell><TableCell>{q.clicks}</TableCell><TableCell>{q.impressions}</TableCell><TableCell>{q.position?.toFixed(1)}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const PostTable = ({ posts, onPublishHook, onGenSocial, busy, showMetrics }: any) => (
  <Table>
    <TableHeader><TableRow>
      <TableHead>Title</TableHead><TableHead>Keyword</TableHead>
      {showMetrics && <><TableHead>Clicks</TableHead><TableHead>Impr</TableHead><TableHead>Pos</TableHead></>}
      <TableHead>When</TableHead><TableHead>Report</TableHead><TableHead>Actions</TableHead>
    </TableRow></TableHeader>
    <TableBody>
      {posts.map((p: Post) => (
        <TableRow key={p.id}>
          <TableCell className="max-w-[280px]"><div className="truncate font-medium">{p.title}</div><div className="text-xs text-muted-foreground">/{p.slug}</div></TableCell>
          <TableCell>{p.primary_keyword || "—"}</TableCell>
          {showMetrics && <>
            <TableCell>{p.gsc_clicks}</TableCell>
            <TableCell>{p.gsc_impressions}</TableCell>
            <TableCell>{p.gsc_position?.toFixed(1) || "—"}</TableCell>
          </>}
          <TableCell className="text-xs">{new Date(p.scheduled_at || p.updated_at).toLocaleString()}</TableCell>
          <TableCell>{p.report_sent_at ? <Badge>sent</Badge> : <Badge variant="outline">pending</Badge>}</TableCell>
          <TableCell><div className="flex gap-1">
            <Button size="sm" variant="ghost" title="Send report + submit to GSC" onClick={() => onPublishHook(p.id)} disabled={!!busy}><Mail className="h-3 w-3" /></Button>
            <Button size="sm" variant="ghost" title="Generate social captions" onClick={() => onGenSocial(p.id)} disabled={!!busy}><Send className="h-3 w-3" /></Button>
          </div></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default AdminSeoCommand;
