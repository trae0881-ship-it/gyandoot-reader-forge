import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, X, Image, Trash2, BookOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

interface BulkBookItem {
  id: string;
  title: string;
  author: string;
  price: number;
  is_free: boolean;
  coverFile: File | null;
  coverPreview: string;
}

const createEmptyItem = (): BulkBookItem => ({
  id: crypto.randomUUID(),
  title: "",
  author: "GyandootNova",
  price: 0,
  is_free: true,
  coverFile: null,
  coverPreview: "",
});

const SAMPLE_BOOKS: Omit<BulkBookItem, "id" | "coverFile" | "coverPreview">[] = [
  { title: "आत्मविश्वास की शक्ति", author: "GyandootNova", price: 0, is_free: true },
  { title: "सफलता के 21 सूत्र", author: "GyandootNova", price: 99, is_free: false },
  { title: "Digital Marketing Guide", author: "GyandootNova", price: 149, is_free: false },
];

const BulkBookUpload = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<BulkBookItem[]>([createEmptyItem(), createEmptyItem(), createEmptyItem()]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const updateItem = (id: string, patch: Partial<BulkBookItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const addRow = () => setItems((prev) => [...prev, createEmptyItem()]);

  const handleCoverSelect = (id: string, file: File | null) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    updateItem(id, { coverFile: file, coverPreview: preview });
  };

  const loadSample = () => {
    setItems(
      SAMPLE_BOOKS.map((s) => ({
        ...s,
        id: crypto.randomUUID(),
        coverFile: null,
        coverPreview: "",
      }))
    );
  };

  const uploadCover = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("book-covers").upload(path, file, { upsert: true });
    if (error) throw error;
    return supabase.storage.from("book-covers").getPublicUrl(path).data.publicUrl;
  };

  const bulkMutation = useMutation({
    mutationFn: async () => {
      const valid = items.filter((it) => it.title.trim());
      if (valid.length === 0) throw new Error("कम से कम एक book का title डालें");

      setUploading(true);
      setProgress(0);
      const total = valid.length;
      let done = 0;

      for (const item of valid) {
        let cover_url: string | null = null;
        if (item.coverFile) {
          cover_url = await uploadCover(item.coverFile);
        }

        const slug = slugify(item.title);
        const { error } = await supabase.from("books").insert({
          title: item.title,
          author: item.author,
          slug,
          price: item.is_free ? 0 : item.price,
          is_free: item.is_free,
          cover_url,
        });
        if (error) throw error;

        done++;
        setProgress(Math.round((done / total) * 100));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      const count = items.filter((it) => it.title.trim()).length;
      toast({ title: `${count} books successfully created! ✅` });
      setOpen(false);
      setItems([createEmptyItem(), createEmptyItem(), createEmptyItem()]);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    onSettled: () => { setUploading(false); setProgress(0); },
  });

  const validCount = items.filter((it) => it.title.trim()).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setItems([createEmptyItem(), createEmptyItem(), createEmptyItem()]); } }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Upload className="mr-1 h-4 w-4" /> Bulk Upload</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Bulk Book Upload
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">एक साथ multiple books add करें</p>
          <Button size="sm" variant="ghost" onClick={loadSample} className="text-xs">
            Load Sample Data
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <Card key={item.id} className="relative">
              <CardContent className="p-3">
                <div className="flex gap-3">
                  {/* Cover thumbnail */}
                  <div
                    className="w-16 h-20 rounded border-2 border-dashed border-border flex-shrink-0 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                    onClick={() => fileRefs.current[item.id]?.click()}
                  >
                    {item.coverPreview ? (
                      <img src={item.coverPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="h-5 w-5 text-muted-foreground" />
                    )}
                    <input
                      ref={(el) => { fileRefs.current[item.id] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleCoverSelect(item.id, e.target.files?.[0] ?? null)}
                    />
                  </div>

                  {/* Fields */}
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder={`Book ${idx + 1} title *`}
                          value={item.title}
                          onChange={(e) => updateItem(item.id, { title: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <Input
                        placeholder="Author"
                        value={item.author}
                        onChange={(e) => updateItem(item.id, { author: e.target.value })}
                        className="h-8 text-sm w-32"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Switch
                          checked={item.is_free}
                          onCheckedChange={(v) => updateItem(item.id, { is_free: v, price: v ? 0 : item.price })}
                          className="scale-75"
                        />
                        <span className="text-xs text-muted-foreground">{item.is_free ? "Free" : "Paid"}</span>
                      </div>
                      {!item.is_free && (
                        <Input
                          type="number"
                          min={1}
                          placeholder="₹ Price"
                          value={item.price || ""}
                          onChange={(e) => updateItem(item.id, { price: Number(e.target.value) })}
                          className="h-7 text-xs w-24"
                        />
                      )}
                      {item.coverFile && (
                        <span className="text-xs text-primary truncate max-w-[120px]">{item.coverFile.name}</span>
                      )}
                    </div>
                  </div>

                  {/* Remove */}
                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0 mt-0.5"
                      onClick={() => removeItem(item.id)}
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={addRow} className="w-full mt-2">
          <Plus className="mr-1 h-4 w-4" /> Add Another Book
        </Button>

        {uploading && (
          <div className="space-y-1 mt-2">
            <p className="text-xs text-muted-foreground">Uploading... {progress}%</p>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <Button
          className="w-full mt-3"
          onClick={() => bulkMutation.mutate()}
          disabled={validCount === 0 || bulkMutation.isPending || uploading}
        >
          {uploading ? "Uploading..." : `Upload ${validCount} Book${validCount !== 1 ? "s" : ""}`}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default BulkBookUpload;
