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
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";

const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const emptyForm = { title: "", content: "", excerpt: "", post_type: "article" as string, is_published: false, meta_title: "", meta_description: "" };

const AdminPosts = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [view, setView] = useState<"list" | "form">("list");
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: posts } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => {
      const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const slug = slugify(form.title);
      if (editing) {
        const { error } = await supabase.from("posts").update({ ...form, slug }).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("posts").insert({ ...form, slug });
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
    setForm({ title: p.title, content: p.content ?? "", excerpt: p.excerpt ?? "", post_type: p.post_type, is_published: p.is_published, meta_title: p.meta_title ?? "", meta_description: p.meta_description ?? "" });
    setView("form");
  };

  /* ─── Form view ────────────────────────────────────────────────── */
  if (view === "form") {
    return (
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={resetForm}><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="font-serif text-2xl font-bold">{editing ? "Edit Post" : "New Post"}</h1>
        </div>

        <div className="space-y-5">
          {/* Title */}
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

          {/* Excerpt */}
          <div>
            <Label>Excerpt <span className="text-muted-foreground text-xs">(short summary shown in listing)</span></Label>
            <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="mt-1" rows={2} placeholder="Brief description…" />
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

          {/* SEO */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
            <div className="col-span-2">
              <p className="text-sm font-medium text-muted-foreground mb-3">SEO Settings</p>
            </div>
            <div>
              <Label>Meta Title</Label>
              <Input value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} className="mt-1" placeholder="SEO title (max 60 chars)" />
            </div>
            <div>
              <Label>Meta Description</Label>
              <Textarea value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} className="mt-1" rows={2} placeholder="SEO description (max 160 chars)" />
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
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
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
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No posts yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPosts;
