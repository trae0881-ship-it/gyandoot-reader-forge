import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ArrowLeft, Eye, Globe, CheckCircle, AlertTriangle, Upload, X, Loader2, Download } from "lucide-react";
import { downloadTableAsCsv } from "@/lib/exportCsv";
import RichTextEditor from "@/components/RichTextEditor";

const slugify = (t: string) => {
  const slug = t
    .trim()
    .toLowerCase()
    .replace(/[\s\-_]+/g, "-")
    .replace(/[^\p{L}\p{N}\-]/gu, "")
    .replace(/(^-|-$)/g, "");
  return slug || `post-${Date.now()}`;
};

const emptyForm = {
  title: "", slug: "", content: "", excerpt: "", post_type: "article" as string,
  is_published: false, meta_title: "", meta_description: "", cover_url: "",
};

/* ── SEO Score helpers ──────────────────────────────────────── */
const getSeoScore = (form: typeof emptyForm) => {
  let score = 0;
  const checks: { label: string; pass: boolean; tip: string }[] = [];

  const metaTitle = form.meta_title || form.title;
  const metaDesc = form.meta_description || form.excerpt;

  // Title length
  const titleLen = metaTitle.length;
  const titleOk = titleLen >= 15 && titleLen <= 60;
  checks.push({ label: "Title length (15-60 chars)", pass: titleOk, tip: `${titleLen}/60 characters` });
  if (titleOk) score += 20;

  // Meta description length
  const descLen = metaDesc.length;
  const descOk = descLen >= 50 && descLen <= 160;
  checks.push({ label: "Description (50-160 chars)", pass: descOk, tip: `${descLen}/160 characters` });
  if (descOk) score += 20;

  // Slug
  const slugOk = (form.slug || slugify(form.title)).length > 3;
  checks.push({ label: "URL slug is set", pass: slugOk, tip: slugOk ? "Good slug" : "Add a meaningful slug" });
  if (slugOk) score += 15;

  // Excerpt
  const excerptOk = form.excerpt.length > 20;
  checks.push({ label: "Excerpt provided", pass: excerptOk, tip: excerptOk ? "Good excerpt" : "Add a summary for listings" });
  if (excerptOk) score += 15;

  // Content length
  const contentText = form.content.replace(/<[^>]*>/g, "");
  const contentOk = contentText.length > 300;
  checks.push({ label: "Content (300+ chars)", pass: contentOk, tip: `${contentText.length} characters` });
  if (contentOk) score += 15;

  // Has cover image
  const hasImage = !!form.cover_url || form.content.includes("<img");
  checks.push({ label: "Has cover image", pass: hasImage, tip: hasImage ? "Image set" : "Add a cover image" });
  if (hasImage) score += 15;

  return { score, checks };
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-500";
};

const getProgressColor = (score: number) => {
  if (score >= 80) return "[&>div]:bg-green-500";
  if (score >= 50) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-red-500";
};

const AdminPosts = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [view, setView] = useState<"list" | "form">("list");
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [uploading, setUploading] = useState(false);

  const { data: posts } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => {
      const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const finalSlug = form.slug.trim() || slugify(form.title);
      const payload = {
        title: form.title,
        slug: finalSlug,
        content: form.content,
        excerpt: form.excerpt,
        post_type: form.post_type,
        is_published: form.is_published,
        meta_title: form.meta_title,
        meta_description: form.meta_description,
        cover_url: form.cover_url || null,
      };
      if (editing) {
        const { error } = await supabase.from("posts").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("posts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
      toast({ title: editing ? "Post updated" : "Post created" });
      resetForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-posts"] }); toast({ title: "Post deleted" }); },
  });

  const resetForm = () => { setForm({ ...emptyForm }); setEditing(null); setView("list"); };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      title: p.title, slug: p.slug ?? "", content: p.content ?? "", excerpt: p.excerpt ?? "",
      post_type: p.post_type, is_published: p.is_published,
      meta_title: p.meta_title ?? "", meta_description: p.meta_description ?? "",
      cover_url: p.cover_url ?? "",
    });
    setView("form");
  };

  const seo = getSeoScore(form);
  const previewTitle = form.meta_title || form.title || "Post Title";
  const previewDesc = form.meta_description || form.excerpt || "Post description will appear here...";
  const previewSlug = form.slug || (form.title ? slugify(form.title) : "post-url");

  /* ─── Form view ────────────────────────────────────────────────── */
  if (view === "form") {
    return (
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={resetForm}><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="font-serif text-2xl font-bold">{editing ? "Edit Post" : "New Post"}</h1>
        </div>

        <div className="space-y-5">
          {/* Title & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" placeholder="Post title" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.post_type} onValueChange={(v) => setForm({ ...form, post_type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="program">Program</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Slug */}
          <div>
            <Label>URL Slug</Label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground shrink-0">/articles/</span>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder={form.title ? slugify(form.title) : "auto-generated-from-title"}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setForm({ ...form, slug: slugify(form.title) })}
                disabled={!form.title}
              >
                Auto
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Leave empty to auto-generate from title. Supports Hindi/Unicode.</p>
          </div>

          {/* Excerpt */}
          <div>
            <Label>Excerpt <span className="text-muted-foreground text-xs">(short summary shown in listing)</span></Label>
            <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="mt-1" rows={2} placeholder="Brief description…" />
          </div>

          {/* Cover Image */}
          <div>
            <Label>Cover Image</Label>
            {form.cover_url ? (
              <div className="mt-1 relative inline-block">
                <img src={form.cover_url} alt="Cover" className="h-40 w-auto rounded-lg border border-border object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={() => setForm({ ...form, cover_url: "" })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-md cursor-pointer hover:bg-muted text-sm">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span>{uploading ? "Uploading…" : "Upload image"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        setUploading(true);
                        const ext = file.name.split(".").pop() || "jpg";
                        const path = `posts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
                        const { error } = await supabase.storage.from("post-images").upload(path, file, { cacheControl: "3600", upsert: false });
                        if (error) throw error;
                        const { data } = supabase.storage.from("post-images").getPublicUrl(path);
                        setForm((f) => ({ ...f, cover_url: data.publicUrl }));
                        toast({ title: "Image uploaded" });
                      } catch (err: any) {
                        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
                      } finally {
                        setUploading(false);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
                <Input
                  value={form.cover_url}
                  onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                  placeholder="…or paste image URL"
                  className="flex-1"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Shown at the top of the article and in listing cards.</p>
          </div>


          {/* Rich Content Editor */}
          <div>
            <Label className="mb-1 block">Content</Label>
            <RichTextEditor
              value={form.content}
              onChange={(html) => setForm({ ...form, content: html })}
              placeholder="Write your article content here…"
              minHeight={400}
            />
          </div>

          {/* SEO Section */}
          <div className="border-t border-border pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" /> SEO Settings
              </p>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${getScoreColor(seo.score)}`}>{seo.score}%</span>
                <Progress value={seo.score} className={`w-24 h-2 ${getProgressColor(seo.score)}`} />
              </div>
            </div>

            {/* Google Preview */}
            <Card className="border-dashed">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Eye className="h-3 w-3" /> Google Search Preview
                </p>
                <div className="space-y-0.5">
                  <p className="text-blue-600 text-lg leading-tight hover:underline cursor-default truncate">
                    {previewTitle.slice(0, 60)}{previewTitle.length > 60 ? "..." : ""}
                  </p>
                  <p className="text-green-700 text-sm truncate">
                    gyandootnova.in › articles › {previewSlug}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {previewDesc.replace(/<[^>]*>/g, "").slice(0, 160)}{previewDesc.replace(/<[^>]*>/g, "").length > 160 ? "..." : ""}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* SEO Checklist */}
            <div className="grid gap-1.5">
              {seo.checks.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {c.pass ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                  )}
                  <span className={c.pass ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
                  <span className="text-muted-foreground ml-auto">{c.tip}</span>
                </div>
              ))}
            </div>

            {/* Meta fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Meta Title <span className="text-muted-foreground text-xs">({(form.meta_title || form.title).length}/60)</span></Label>
                <Input value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} className="mt-1" placeholder={form.title || "SEO title"} />
              </div>
              <div>
                <Label>Meta Description <span className="text-muted-foreground text-xs">({(form.meta_description || form.excerpt).length}/160)</span></Label>
                <Textarea value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} className="mt-1" rows={2} placeholder="SEO description" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
              <Label>{form.is_published ? "Published" : "Draft"}</Label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={!form.title || saveMutation.isPending}>
                {saveMutation.isPending ? "Saving…" : editing ? "Update Post" : "Publish Post"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── List view ────────────────────────────────────────────────── */
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl font-bold">Posts</h1>
        <Button onClick={() => setView("form")}><Plus className="mr-1 h-4 w-4" /> Add Post</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{p.title}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{p.slug}</TableCell>
                  <TableCell className="capitalize">{p.post_type}</TableCell>
                  <TableCell>
                    {p.is_published
                      ? <span className="text-green-600 font-medium">Published</span>
                      : <span className="text-muted-foreground">Draft</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!posts || posts.length === 0) && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No posts yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPosts;
