import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload, Image, FileText, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const AdminBooks = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", author: "GyandootNova", description: "", price: 0, is_free: true, is_featured: false, cover_url: "", file_url: "", file_type: "" });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const bookRef = useRef<HTMLInputElement>(null);

  const { data: books } = useQuery({
    queryKey: ["admin-books"],
    queryFn: async () => {
      const { data } = await supabase.from("books").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("book-files").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("book-files").getPublicUrl(path);
    return data.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      setUploadProgress(10);
      let cover_url = form.cover_url;
      let file_url = form.file_url;
      let file_type = form.file_type;

      if (coverFile) {
        setUploadProgress(30);
        cover_url = await uploadFile(coverFile, "covers");
        setUploadProgress(55);
      }
      if (bookFile) {
        setUploadProgress(60);
        file_url = await uploadFile(bookFile, "books");
        file_type = bookFile.name.split(".").pop()?.toUpperCase() ?? "";
        setUploadProgress(90);
      }

      const slug = slugify(form.title);
      const payload = { ...form, slug, cover_url, file_url, file_type, price: form.is_free ? 0 : form.price };
      if (editing) {
        const { error } = await supabase.from("books").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("books").insert(payload);
        if (error) throw error;
      }
      setUploadProgress(100);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      toast({ title: editing ? "Book updated" : "Book created" });
      setOpen(false);
      resetForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    onSettled: () => { setUploading(false); setUploadProgress(0); },
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
    setForm({ title: "", author: "GyandootNova", description: "", price: 0, is_free: true, is_featured: false, cover_url: "", file_url: "", file_type: "" });
    setEditing(null);
    setCoverFile(null);
    setBookFile(null);
  };

  const openEdit = (book: any) => {
    setEditing(book);
    setForm({ title: book.title, author: book.author, description: book.description ?? "", price: book.price, is_free: book.is_free, is_featured: book.is_featured, cover_url: book.cover_url ?? "", file_url: book.file_url ?? "", file_type: book.file_type ?? "" });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold sm:text-3xl">Books</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add Book</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">{editing ? "Edit Book" : "New Book"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" placeholder="Book title" /></div>
              <div><Label>Author</Label><Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="mt-1" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" rows={3} /></div>

              {/* Cover Image Upload */}
              <div>
                <Label>Cover Image</Label>
                <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => coverRef.current?.click()}>
                  {coverFile ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Image className="h-4 w-4 text-primary" />
                        <span className="truncate max-w-[180px]">{coverFile.name}</span>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setCoverFile(null); }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : form.cover_url ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Image className="h-4 w-4" />
                      <span className="truncate">Cover uploaded</span>
                      <span className="text-xs text-primary">(click to replace)</span>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      <Upload className="mx-auto h-6 w-6 mb-1" />
                      <p className="text-xs">Click to upload cover image (JPG, PNG, WebP)</p>
                    </div>
                  )}
                </div>
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
              </div>

              {/* Book File Upload */}
              <div>
                <Label>Book File (PDF / DOC / DOCX)</Label>
                <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => bookRef.current?.click()}>
                  {bookFile ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="truncate max-w-[180px]">{bookFile.name}</span>
                        <span className="text-xs text-muted-foreground">({(bookFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setBookFile(null); }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : form.file_url ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>File uploaded ({form.file_type})</span>
                      <span className="text-xs text-primary">(click to replace)</span>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      <Upload className="mx-auto h-6 w-6 mb-1" />
                      <p className="text-xs">Click to upload PDF, DOC, or DOCX file</p>
                    </div>
                  )}
                </div>
                <input ref={bookRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(e) => setBookFile(e.target.files?.[0] ?? null)} />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><Switch checked={form.is_free} onCheckedChange={(v) => setForm({ ...form, is_free: v })} /><Label>Free</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} /><Label>Featured</Label></div>
              </div>
              {!form.is_free && (
                <div><Label>Price (₹)</Label><Input type="number" min={1} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="mt-1" /></div>
              )}

              {uploading && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Uploading files... {uploadProgress}%</p>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!form.title || saveMutation.isPending || uploading}>
                {saveMutation.isPending ? "Saving..." : editing ? "Update Book" : "Create Book"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Author</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden md:table-cell">File</TableHead>
                <TableHead className="hidden md:table-cell">Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {books?.map((book) => (
                <TableRow key={book.id}>
                  <TableCell className="font-medium max-w-[140px] truncate">{book.title}</TableCell>
                  <TableCell className="hidden sm:table-cell">{book.author}</TableCell>
                  <TableCell>{book.is_free ? "Free" : `₹${book.price}`}</TableCell>
                  <TableCell className="hidden md:table-cell">{book.file_type || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{book.is_featured ? "Yes" : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(book)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(book.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!books || books.length === 0) && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No books yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBooks;
