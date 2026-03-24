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
import { Plus, Pencil, Trash2, Upload, Image, FileText, X, ChevronRight, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import RichTextEditor from "@/components/RichTextEditor";
import BulkBookUpload from "@/components/admin/BulkBookUpload";

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/* ═══════════════════════════════════════════════════════════════
   CHAPTER EDITOR
═══════════════════════════════════════════════════════════════ */
const ChapterEditor = ({ book, onBack }: { book: any; onBack: () => void }) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [view, setView] = useState<"list" | "form">("list");
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", content: "", chapter_number: 1, is_preview: true });

  const { data: chapters } = useQuery({
    queryKey: ["admin-chapters", book.id],
    queryFn: async () => {
      const { data } = await supabase.from("book_chapters").select("*").eq("book_id", book.id).order("chapter_number");
      return data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const slug = slugify(form.title);
      const payload = { ...form, slug, book_id: book.id };
      if (editing) {
        const { error } = await supabase.from("book_chapters").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("book_chapters").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-chapters", book.id] });
      toast({ title: editing ? "Chapter updated" : "Chapter created" });
      resetChapterForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("book_chapters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-chapters", book.id] }); toast({ title: "Chapter deleted" }); },
  });

  const resetChapterForm = () => { setForm({ title: "", content: "", chapter_number: (chapters?.length ?? 0) + 1, is_preview: true }); setEditing(null); setView("list"); };

  const openEdit = (ch: any) => {
    setEditing(ch);
    setForm({ title: ch.title, content: ch.content ?? "", chapter_number: ch.chapter_number, is_preview: ch.is_preview });
    setView("form");
  };

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", content: "", chapter_number: (chapters?.length ?? 0) + 1, is_preview: true });
    setView("form");
  };

  if (view === "form") {
    return (
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={resetChapterForm}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <p className="text-xs text-muted-foreground">{book.title}</p>
            <h2 className="font-serif text-xl font-bold">{editing ? "Edit Chapter" : "New Chapter"}</h2>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label>Chapter Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" placeholder="Chapter title" />
            </div>
            <div>
              <Label>Chapter Number</Label>
              <Input type="number" min={1} value={form.chapter_number} onChange={(e) => setForm({ ...form, chapter_number: Number(e.target.value) })} className="mt-1" />
            </div>
          </div>

          <div>
            <Label className="mb-1 block">Content</Label>
            <RichTextEditor
              value={form.content}
              onChange={(html) => setForm({ ...form, content: html })}
              placeholder="Write chapter content here…"
              minHeight={450}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_preview} onCheckedChange={(v) => setForm({ ...form, is_preview: v })} />
              <Label>{form.is_preview ? "Free Preview" : "Paid Chapter"}</Label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetChapterForm}>Cancel</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={!form.title || saveMutation.isPending}>
                {saveMutation.isPending ? "Saving…" : editing ? "Update Chapter" : "Add Chapter"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Chapters</p>
          <h2 className="font-serif text-xl font-bold">{book.title}</h2>
        </div>
        <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add Chapter</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chapters?.map((ch) => (
                <TableRow key={ch.id}>
                  <TableCell className="text-muted-foreground">{ch.chapter_number}</TableCell>
                  <TableCell className="font-medium">{ch.title}</TableCell>
                  <TableCell>{ch.is_preview ? <span className="text-primary font-medium text-sm">Free</span> : <span className="text-muted-foreground text-sm">Paid</span>}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(ch)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(ch.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!chapters || chapters.length === 0) && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No chapters yet. Add your first chapter!</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ADMIN BOOKS (main)
═══════════════════════════════════════════════════════════════ */
const AdminBooks = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [form, setForm] = useState({ title: "", author: "GyandootNova", description: "", price: 0, is_free: true, is_featured: false, cover_url: "", file_url: "", file_type: "", preview_chapters: 0, category: "" });
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
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const bucket = folder === "covers" ? "book-covers" : "book-files";
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      setUploading(true); setUploadProgress(10);
      let cover_url = form.cover_url;
      let file_url = form.file_url;
      let file_type = form.file_type;
      if (coverFile) { setUploadProgress(30); cover_url = await uploadFile(coverFile, "covers"); setUploadProgress(55); }
      if (bookFile) { setUploadProgress(60); file_url = await uploadFile(bookFile, "books"); file_type = bookFile.name.split(".").pop()?.toLowerCase() ?? ""; setUploadProgress(90); }
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
      setOpen(false); resetForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    onSettled: () => { setUploading(false); setUploadProgress(0); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("books").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-books"] }); toast({ title: "Book deleted" }); },
  });

  const resetForm = () => {
    setForm({ title: "", author: "GyandootNova", description: "", price: 0, is_free: true, is_featured: false, cover_url: "", file_url: "", file_type: "", preview_chapters: 0, category: "" });
    setEditing(null); setCoverFile(null); setBookFile(null);
  };

  const openEdit = (book: any) => {
    setEditing(book);
    setForm({ title: book.title, author: book.author, description: book.description ?? "", price: book.price, is_free: book.is_free, is_featured: book.is_featured, cover_url: book.cover_url ?? "", file_url: book.file_url ?? "", file_type: book.file_type ?? "", preview_chapters: book.preview_chapters ?? 0, category: book.category ?? "" });
    setOpen(true);
  };

  /* ─── Chapter manager ──────────────────────────────────────────── */
  if (selectedBook) {
    return <ChapterEditor book={selectedBook} onBack={() => setSelectedBook(null)} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold sm:text-3xl">Books</h1>
        <div className="flex gap-2">
          <BulkBookUpload />
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
              <div>
                <Label>Category</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">No Category</option>
                  <option value="devi">देवी</option>
                  <option value="devta">देवता</option>
                  <option value="adhyatm">अध्यात्म</option>
                  <option value="puran">पुराण</option>
                  <option value="katha">कथा</option>
                  <option value="other">अन्य</option>
                </select>
              </div>
              <div>
                <Label>Description</Label>
                <div className="mt-1">
                  <RichTextEditor
                    value={form.description}
                    onChange={(html) => setForm({ ...form, description: html })}
                    placeholder="Book description with headings, images, etc."
                    minHeight={200}
                  />
                </div>
              </div>

              {/* Cover Image */}
              <div>
                <Label>Cover Image</Label>
                <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => coverRef.current?.click()}>
                  {coverFile ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm"><Image className="h-4 w-4 text-primary" /><span className="truncate max-w-[180px]">{coverFile.name}</span></div>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setCoverFile(null); }}><X className="h-3 w-3" /></Button>
                    </div>
                  ) : form.cover_url ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Image className="h-4 w-4" /><span>Cover uploaded</span><span className="text-xs text-primary">(click to replace)</span></div>
                  ) : (
                    <div className="text-muted-foreground"><Upload className="mx-auto h-6 w-6 mb-1" /><p className="text-xs">Click to upload cover (JPG, PNG, WebP)</p></div>
                  )}
                </div>
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
              </div>

              {/* Book File */}
              <div>
                <Label>Book File (PDF / DOC / DOCX)</Label>
                <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => bookRef.current?.click()}>
                  {bookFile ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-primary" /><span className="truncate max-w-[180px]">{bookFile.name}</span><span className="text-xs text-muted-foreground">({(bookFile.size / 1024 / 1024).toFixed(1)} MB)</span></div>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setBookFile(null); }}><X className="h-3 w-3" /></Button>
                    </div>
                  ) : form.file_url ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><FileText className="h-4 w-4" /><span>File uploaded ({form.file_type})</span><span className="text-xs text-primary">(click to replace)</span></div>
                  ) : (
                    <div className="text-muted-foreground"><Upload className="mx-auto h-6 w-6 mb-1" /><p className="text-xs">Click to upload PDF, DOC, or DOCX</p></div>
                  )}
                </div>
                <input ref={bookRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setBookFile(e.target.files?.[0] ?? null)} />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><Switch checked={form.is_free} onCheckedChange={(v) => setForm({ ...form, is_free: v })} /><Label>Free</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} /><Label>Featured</Label></div>
              </div>
              {!form.is_free && (
                <>
                  <div><Label>Price (₹)</Label><Input type="number" min={1} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="mt-1" /></div>
                  <div>
                    <Label>Free Preview Chapters</Label>
                    <Input type="number" min={0} value={form.preview_chapters} onChange={(e) => setForm({ ...form, preview_chapters: Number(e.target.value) })} className="mt-1" placeholder="e.g. 7" />
                    <p className="text-xs text-muted-foreground mt-1">पहले कितने chapters free demo में दिखाने हैं (0 = कोई नहीं)</p>
                  </div>
                </>
              )}

              {uploading && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Uploading... {uploadProgress}%</p>
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
                  <TableCell>
                    <button
                      className="font-medium hover:text-primary transition-colors flex items-center gap-1 text-left"
                      onClick={() => setSelectedBook(book)}
                    >
                      {book.title}
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </TableCell>
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
