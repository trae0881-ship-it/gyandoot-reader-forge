import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  FileText,
  Heart,
  ShoppingCart,
  Users,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";

// ---------- Helpers ----------
const DAYS = 30;
const rangeStart = () => startOfDay(subDays(new Date(), DAYS - 1)).toISOString();

function bucketByDay<T extends { created_at: string }>(rows: T[]) {
  const buckets: Record<string, number> = {};
  for (let i = 0; i < DAYS; i++) {
    const key = format(subDays(new Date(), DAYS - 1 - i), "MMM d");
    buckets[key] = 0;
  }
  rows.forEach((r) => {
    const key = format(new Date(r.created_at), "MMM d");
    if (key in buckets) buckets[key] += 1;
  });
  return Object.entries(buckets).map(([date, count]) => ({ date, count }));
}

function sumByDay<T extends { created_at: string; amount: number }>(rows: T[]) {
  const buckets: Record<string, number> = {};
  for (let i = 0; i < DAYS; i++) {
    const key = format(subDays(new Date(), DAYS - 1 - i), "MMM d");
    buckets[key] = 0;
  }
  rows.forEach((r) => {
    const key = format(new Date(r.created_at), "MMM d");
    if (key in buckets) buckets[key] += Number(r.amount) || 0;
  });
  return Object.entries(buckets).map(([date, amount]) => ({ date, amount }));
}

// ---------- Component ----------
const AdminDashboard = () => {
  // KPI counts
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const since = rangeStart();
      const [books, posts, donations, purchases, users, enquiries] = await Promise.all([
        supabase.from("books").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("donations").select("amount").eq("status", "completed"),
        supabase.from("purchases").select("id", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("contact_enquiries").select("id", { count: "exact", head: true }).gte("created_at", since),
      ]);
      const totalDonations = donations.data?.reduce((s, d) => s + Number(d.amount), 0) ?? 0;
      return {
        bookCount: books.count ?? 0,
        postCount: posts.count ?? 0,
        totalDonations,
        purchaseCount: purchases.count ?? 0,
        newUsers: users.count ?? 0,
        newEnquiries: enquiries.count ?? 0,
      };
    },
  });

  // Purchases + Revenue over 30 days (join to books for price)
  const { data: revenueData } = useQuery({
    queryKey: ["admin-revenue-30d"],
    queryFn: async () => {
      const { data } = await supabase
        .from("purchases")
        .select("created_at, book_id, books(price, is_free, title)")
        .eq("status", "completed")
        .gte("created_at", rangeStart());
      const rows = (data ?? []).map((p: any) => ({
        created_at: p.created_at,
        amount: p.books?.is_free ? 0 : Number(p.books?.price ?? 0),
        title: p.books?.title ?? "Unknown",
      }));
      return {
        daily: sumByDay(rows),
        purchasesDaily: bucketByDay(rows),
        total: rows.reduce((s, r) => s + r.amount, 0),
        rows,
      };
    },
  });

  // Top 5 best-selling books
  const { data: topBooks } = useQuery({
    queryKey: ["admin-top-books"],
    queryFn: async () => {
      const { data } = await supabase
        .from("purchases")
        .select("book_id, books(title)")
        .eq("status", "completed");
      const counts: Record<string, { title: string; count: number }> = {};
      (data ?? []).forEach((p: any) => {
        const title = p.books?.title ?? "Unknown";
        counts[title] = counts[title] || { title, count: 0 };
        counts[title].count += 1;
      });
      return Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    },
  });

  // Signups per day
  const { data: signupsData } = useQuery({
    queryKey: ["admin-signups-30d"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", rangeStart());
      return bucketByDay(data ?? []);
    },
  });

  // Enquiries per day
  const { data: enquiriesData } = useQuery({
    queryKey: ["admin-enquiries-30d"],
    queryFn: async () => {
      const { data } = await supabase
        .from("contact_enquiries")
        .select("created_at")
        .gte("created_at", rangeStart());
      return bucketByDay(data ?? []);
    },
  });

  // Donations per day
  const { data: donationsData } = useQuery({
    queryKey: ["admin-donations-30d"],
    queryFn: async () => {
      const { data } = await supabase
        .from("donations")
        .select("created_at, amount")
        .eq("status", "completed")
        .gte("created_at", rangeStart());
      return sumByDay(data ?? []);
    },
  });

  // Top read books (reading_progress)
  const { data: topRead } = useQuery({
    queryKey: ["admin-top-read"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reading_progress")
        .select("book_id, books(title)");
      const counts: Record<string, { title: string; readers: Set<string> }> = {};
      (data ?? []).forEach((p: any) => {
        const title = p.books?.title ?? "Unknown";
        counts[title] = counts[title] || { title, readers: new Set() };
        counts[title].readers.add(p.book_id);
      });
      return Object.values(counts)
        .map((c) => ({ title: c.title, count: c.readers.size }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    },
  });

  // SEO Alerts
  const { data: seoAlerts } = useQuery({
    queryKey: ["admin-seo-alerts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("seo_agent_alerts")
        .select("id, created_at, severity, error_type, message, provider")
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const { data: seoSeverity } = useQuery({
    queryKey: ["admin-seo-severity"],
    queryFn: async () => {
      const { data } = await supabase
        .from("seo_agent_alerts")
        .select("severity")
        .gte("created_at", rangeStart());
      const counts: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        counts[r.severity] = (counts[r.severity] ?? 0) + 1;
      });
      return Object.entries(counts).map(([severity, count]) => ({ severity, count }));
    },
  });

  const { data: seoRuns } = useQuery({
    queryKey: ["admin-seo-runs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("seo_agent_logs")
        .select("id, run_at, topic, focus_keyword, action, status")
        .order("run_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const { data: lsiStats } = useQuery({
    queryKey: ["admin-lsi-stats"],
    queryFn: async () => {
      const [total, active] = await Promise.all([
        supabase.from("lsi_keywords").select("id", { count: "exact", head: true }),
        supabase.from("lsi_keywords").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);
      return { total: total.count ?? 0, active: active.count ?? 0 };
    },
  });

  const kpis = [
    { label: "Books", value: stats?.bookCount ?? 0, icon: BookOpen, color: "text-primary" },
    { label: "Posts", value: stats?.postCount ?? 0, icon: FileText, color: "text-blue-600" },
    { label: "Total Purchases", value: stats?.purchaseCount ?? 0, icon: ShoppingCart, color: "text-emerald-600" },
    { label: "Donations", value: `₹${(stats?.totalDonations ?? 0).toLocaleString("en-IN")}`, icon: Heart, color: "text-rose-600" },
    { label: "Revenue (30d)", value: `₹${Math.round(revenueData?.total ?? 0).toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-primary" },
    { label: "New Users (30d)", value: stats?.newUsers ?? 0, icon: Users, color: "text-indigo-600" },
    { label: "New Enquiries (30d)", value: stats?.newEnquiries ?? 0, icon: MessageSquare, color: "text-amber-600" },
    { label: "Active LSI Keywords", value: lsiStats?.active ?? 0, icon: FileText, color: "text-teal-600" },
  ];

  const severityColor = (s: string) => {
    if (s === "critical" || s === "high") return "destructive" as const;
    if (s === "medium") return "default" as const;
    return "secondary" as const;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time analytics from your database — last {DAYS} days</p>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="business" className="w-full">
        <TabsList>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* ---------- Business Tab ---------- */}
        <TabsContent value="business" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Daily Revenue (₹)</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData?.daily ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                    <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Daily Purchases</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData?.purchasesDaily ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>New Signups per Day</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={signupsData ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Contact Enquiries per Day</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={enquiriesData ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Donations Trend (₹)</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={donationsData ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                    <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Top 5 Best-Selling Books</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topBooks ?? []} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="title" tick={{ fontSize: 11 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---------- Content Tab ---------- */}
        <TabsContent value="content" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Most-Read Books (Unique Readers)</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topRead ?? []} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="title" tick={{ fontSize: 11 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Content Library</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Books</span><span className="font-semibold">{stats?.bookCount ?? 0}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Posts</span><span className="font-semibold">{stats?.postCount ?? 0}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">LSI Keywords (Total)</span><span className="font-semibold">{lsiStats?.total ?? 0}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">LSI Keywords (Active)</span><span className="font-semibold">{lsiStats?.active ?? 0}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---------- SEO Tab ---------- */}
        <TabsContent value="seo" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>SEO Alerts by Severity (30d)</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={seoSeverity ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="severity" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent SEO Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                {seoAlerts && seoAlerts.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {seoAlerts.map((a: any) => (
                      <div key={a.id} className="border rounded p-2 text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={severityColor(a.severity)}>{a.severity}</Badge>
                          <span className="text-xs text-muted-foreground">{format(new Date(a.created_at), "MMM d, HH:mm")}</span>
                          {a.provider && <span className="text-xs text-muted-foreground">· {a.provider}</span>}
                        </div>
                        <div className="text-xs"><strong>{a.error_type}:</strong> {a.message}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No SEO alerts yet.</p>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Recent SEO Agent Runs</CardTitle></CardHeader>
              <CardContent>
                {seoRuns && seoRuns.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                          <th className="pb-2">Time</th>
                          <th className="pb-2">Topic</th>
                          <th className="pb-2">Focus Keyword</th>
                          <th className="pb-2">Action</th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {seoRuns.map((r: any) => (
                          <tr key={r.id} className="border-b">
                            <td className="py-2 text-xs text-muted-foreground">{format(new Date(r.run_at), "MMM d, HH:mm")}</td>
                            <td className="py-2">{r.topic ?? "—"}</td>
                            <td className="py-2">{r.focus_keyword ?? "—"}</td>
                            <td className="py-2">{r.action ?? "—"}</td>
                            <td className="py-2">
                              <Badge variant={r.status === "success" ? "default" : r.status === "failed" ? "destructive" : "secondary"}>
                                {r.status ?? "—"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No SEO agent runs logged yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
