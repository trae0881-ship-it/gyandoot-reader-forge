import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2 } from "lucide-react";

const Books = () => {
  const [filter, setFilter] = useState<"all" | "free" | "paid">("all");

  const { data: books, isLoading } = useQuery({
    queryKey: ["books", filter],
    queryFn: async () => {
      let query = supabase.from("books").select("id, title, slug, author, cover_url, price, is_free, is_featured, description, preview_chapters, purchase_count, created_at, updated_at, file_type").order("created_at", { ascending: false });
      if (filter === "free") query = query.eq("is_free", true);
      if (filter === "paid") query = query.eq("is_free", false);
      const { data } = await query;
      return data ?? [];
    },
  });

  return (
    <Layout>
      <section className="py-12">
        <div className="container">
          <h1 className="font-serif text-4xl font-bold">Books Library</h1>
          <p className="mt-2 text-muted-foreground">Explore our collection of spiritual literature</p>

          <div className="mt-6 flex gap-2">
            {(["all", "free", "paid"] as const).map((f) => (
              <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="capitalize">
                {f}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : books && books.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {books.map((book) => (
                <Link key={book.id} to={`/books/${book.slug}`}>
                  <Card className="group overflow-hidden transition-shadow hover:shadow-lg h-full">
                    <div className="aspect-[3/4] bg-muted flex items-center justify-center">
                      {book.cover_url ? (
                        <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h2 className="font-serif font-semibold group-hover:text-primary transition-colors line-clamp-2">{book.title}</h2>
                      <p className="text-sm text-muted-foreground">{book.author}</p>
                      <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${book.is_free ? "bg-green-100 text-green-700" : "bg-secondary/20 text-secondary-foreground"}`}>
                        {book.is_free ? "Free" : `₹${book.price}`}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground">No books found.</div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Books;
