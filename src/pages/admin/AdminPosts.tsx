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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const AdminPosts = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", content: "", excerpt: "", post_type: "article" as string, is_published: false, meta_title: "", meta_description: "" });

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-posts"] }); toast({ title: editing ? "Post updated" : "Post created" }); setOpen(false); resetForm(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("posts").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-posts"] }); toast({ title: "Post deleted" }); },
  });

  const resetForm = () => { setForm({ title: "", content: "", excerpt: "", post_type: "article", is_published: false, meta_title: "", meta_description: "" }); setEditing(null); };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ title: p.title, content: p.content ?? "", excerpt: p.excerpt ?? "", post_type: p.post_type, is_published: p.is_published, meta_title: p.meta_title ?? "", meta_description: p.meta_description ?? "" });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl font-bold">Posts</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Add Post</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-serif">{editing ? "Edit Post" : "New Post"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" /></div>
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
              <div><Label>Excerpt</Label><Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="mt-1" rows={2} /></div>
              <div><Label>Content</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="mt-1" rows={8} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} /><Label>Published</Label></div>
              <div><Label>Meta Title (SEO)</Label><Input value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} className="mt-1" /></div>
              <div><Label>Meta Description (SEO)</Label><Textarea value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} className="mt-1" rows={2} /></div>
              <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!form.title || saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editing ? "Update Post" : "Create Post"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
                  <TableCell>{p.is_published ? <span className="text-green-600 font-medium">Published</span> : <span className="text-muted-foreground">Draft</span>}</TableCell>
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
