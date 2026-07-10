import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Play, RefreshCcw, Mail, Send, Sparkles, TrendingUp, Eye, MousePointerClick, Target } from "lucide-react";
import SeoFlowChart from "@/components/admin/SeoFlowChart";

type Post = {
  id: string; title: string; slug: string; publish_status: string; scheduled_at: string | null;
  primary_keyword: string | null; gsc_clicks: number; gsc_impressions: number; gsc_ctr: number;
  gsc_position: number | null; is_published: boolean; updated_at: string; word_count: number | null;
  report_sent_at: string | null; indexing_submitted_at: string | null;
  social_captions: any;
};

const StatCard = ({ icon: Icon, label, value, sub }: any) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
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
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const [{ data: p }, { data: l }, { data: q }] = await Promise.all([
      supabase.from("posts").select("*").eq("post_type", "article").order("updated_at", { ascending: false }).limit(50),
      supabase.from("seo_agent_logs").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("seo_keyword_queue").select("*").order("opportunity_score", { ascending: false }).limit(30),
    ]);
    setPosts((p as Post[]) || []);
    setLogs(l || []);
    setQueue(q || []);
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
  const runAgent = async () => { await call("seo-blog-agent", { auto: true, publish_status: "scheduled" }, "SEO agent"); await load(); };
  const autoRun48 = async () => { await call("seo-auto-run", {}, "48h auto-run"); await load(); };
  const publishHook = async (id: string) => { await call("seo-post-publish-hook", { post_id: id }, "Publish hook"); await load(); };
  const genSocial = async (id: string) => { await call("seo-social-captions", { post_id: id }, "Social captions"); await load(); };

  const scheduled = posts.filter(p => p.publish_status === "scheduled");
  const published = posts.filter(p => p.is_published);
  const drafts = posts.filter(p => p.publish_status === "draft");
  const totalClicks = published.reduce((s, p) => s + (p.gsc_clicks || 0), 0);
  const totalImpr = published.reduce((s, p) => s + (p.gsc_impressions || 0), 0);
  const avgPos = published.filter(p => p.gsc_position).reduce((s, p, _, arr) => s + (p.gsc_position || 0) / arr.length, 0);

  return (
    <div className="space-y-6 notranslate" translate="no">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">SEO Command Center</h1>
          <p className="text-muted-foreground text-sm">Autonomous keyword research → writing → publishing → tracking</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={syncGsc} disabled={!!busy} variant="outline" size="sm">
            {busy === "GSC sync" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Sync GSC (28d)
          </Button>
          <Button onClick={runAgent} disabled={!!busy} size="sm">
            {busy === "SEO agent" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Run Agent Now
          </Button>
          <Button onClick={autoRun48} disabled={!!busy} size="sm" variant="secondary">
            {busy === "48h auto-run" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Trigger 48h Cycle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={MousePointerClick} label="GSC Clicks (28d)" value={totalClicks} sub="across all articles" />
        <StatCard icon={Eye} label="Impressions" value={totalImpr} sub="last 28 days" />
        <StatCard icon={Target} label="Avg Position" value={avgPos ? avgPos.toFixed(1) : "—"} sub="lower is better" />
        <StatCard icon={TrendingUp} label="Scheduled / Published" value={`${scheduled.length} / ${published.length}`} sub={`${drafts.length} drafts`} />
      </div>

      <SeoFlowChart />



      <Tabs defaultValue="scheduled">
        <TabsList>
          <TabsTrigger value="scheduled">Scheduled ({scheduled.length})</TabsTrigger>
          <TabsTrigger value="published">Published ({published.length})</TabsTrigger>
          <TabsTrigger value="queue">Keyword Queue ({queue.length})</TabsTrigger>
          <TabsTrigger value="logs">Agent Logs</TabsTrigger>
          <TabsTrigger value="gsc">GSC Snapshot</TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled">
          <Card><CardContent className="pt-6">
            <PostTable posts={scheduled} onPublishHook={publishHook} onGenSocial={genSocial} busy={busy} />
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
              <p className="text-sm text-muted-foreground">No keywords in queue yet. Run the agent — it discovers keywords from Google/Reddit/Quora and stores winners here.</p>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Keyword</TableHead><TableHead>Intent</TableHead><TableHead>Volume</TableHead>
                  <TableHead>Difficulty</TableHead><TableHead>Opportunity</TableHead><TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {queue.map(k => (
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
                {logs.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs">{new Date(l.created_at).toLocaleString()}</TableCell>
                    <TableCell>{l.focus_keyword || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{l.slug || "—"}</TableCell>
                    <TableCell><Badge variant={l.status === "error" ? "destructive" : "default"}>{l.status}</Badge></TableCell>
                    <TableCell>{l.execution_ms ? `${(l.execution_ms/1000).toFixed(1)}s` : "—"}</TableCell>
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
