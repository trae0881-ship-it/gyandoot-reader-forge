import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import useSEO from "@/hooks/useSEO";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, Loader2, Search } from "lucide-react";

const Articles = () => {
  const [search, setSearch] = useState("");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    if (!posts) return [];
    if (!search.trim()) return posts;
    const q = search.trim().toLowerCase();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.excerpt ?? "").toLowerCase().includes(q) ||
        p.post_type.toLowerCase().includes(q)
    );
  }, [posts, search]);

  return (
    <Layout>
      <section className="py-12">
        <div className="container">
          <h1 className="font-serif text-4xl font-bold">Articles & Programs</h1>
          <p className="mt-2 text-muted-foreground">Spiritual insights and transformative programs</p>

          {/* Search */}
          <div className="mt-6 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length > 0 ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((post) => (
                <Link key={post.id} to={`/articles/${post.slug}`}>
                  <Card className="group h-full transition-shadow hover:shadow-lg">
                    {post.cover_url && (
                      <div className="aspect-video overflow-hidden">
                        <img src={post.cover_url} alt={post.title} className="h-full w-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <CardContent className="p-5">
                      <span className="text-xs font-medium uppercase tracking-wider text-primary">{post.post_type}</span>
                      <h2 className="mt-1 font-serif text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                      {post.excerpt && <p className="mt-2 text-sm text-muted-foreground line-clamp-3" dangerouslySetInnerHTML={{ __html: post.excerpt }} />}
                      <p className="mt-3 text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-muted-foreground">{search ? "No articles found." : "No articles published yet."}</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Articles;
