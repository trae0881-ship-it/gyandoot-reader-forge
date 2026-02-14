import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const AdminBooks = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", author: "GyandootNova", description: "", price: 0, is_free: true, is_featured: false });

  const { data: books } = useQuery({
    queryKey: ["admin-books"],
    queryFn: async () => {
      const { data } = await supabase.from("books").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const slug = slugify(form.title);
      const payload = { ...form, slug, price: form.is_free ? 0 : form.price };
      if (editing) {
        const { error } = await supabase.from("books").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("books").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      toast({ title: editing ? "Book updated" : "Book created" });
      setOpen(false);
      resetForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("books").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      toast({ title: "Book deleted" });
    },
  });

  const resetForm = () => {
    setForm({ title: "", author: "GyandootNova", description: "", price: 0, is_free: true, is_featured: false });
    setEditing(null);
  };

  const openEdit = (book: any) => {
    setEditing(book);
    setForm({ title: book.title, author: book.author, description: book.description ?? "", price: book.price, is_free: book.is_free, is_featured: book.is_featured });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl font-bold">Books</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> Add Book</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">{editing ? "Edit Book" : "New Book"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" /></div>
              <div><Label>Author</Label><Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="mt-1" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" rows={4} /></div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><Switch checked={form.is_free} onCheckedChange={(v) => setForm({ ...form, is_free: v })} /><Label>Free</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} /><Label>Featured</Label></div>
              </div>
              {!form.is_free && (
                <div><Label>Price (₹)</Label><Input type="number" min={1} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="mt-1" /></div>
              )}
              <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!form.title || saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editing ? "Update Book" : "Create Book"}
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
                <TableHead>Author</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {books?.map((book) => (
                <TableRow key={book.id}>
                  <TableCell className="font-medium">{book.title}</TableCell>
                  <TableCell>{book.author}</TableCell>
                  <TableCell>{book.is_free ? "Free" : `₹${book.price}`}</TableCell>
                  <TableCell>{book.is_featured ? "Yes" : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(book)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(book.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!books || books.length === 0) && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No books yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBooks;
