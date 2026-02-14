import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Loader2 } from "lucide-react";

const ArticleDetail = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", slug],
    queryFn: async () => {
      const { data } = await supabase.from("posts").select("*").eq("slug", slug!).eq("is_published", true).single();
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return <Layout><div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  if (!post) {
    return <Layout><div className="py-32 text-center text-muted-foreground">Article not found.</div></Layout>;
  }

  return (
    <Layout>
      <article className="py-12">
        <div className="container max-w-3xl">
          <span className="text-xs font-medium uppercase tracking-wider text-primary">{post.post_type}</span>
          <h1 className="mt-2 font-serif text-3xl font-bold md:text-4xl">{post.title}</h1>
          <p className="mt-2 text-muted-foreground">
            {new Date(post.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
          </p>
          {post.cover_url && (
            <div className="mt-6 aspect-video overflow-hidden rounded-lg">
              <img src={post.cover_url} alt={post.title} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="prose prose-lg mt-8 max-w-none leading-relaxed whitespace-pre-line">
            {post.content}
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default ArticleDetail;
