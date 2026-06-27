import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import useSEO from "@/hooks/useSEO";
import Layout from "@/components/layout/Layout";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

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

  // Fetch older and newer posts for navigation
  const { data: navPosts } = useQuery({
    queryKey: ["post-nav", post?.created_at],
    queryFn: async () => {
      const createdAt = post!.created_at;
      const [olderRes, newerRes] = await Promise.all([
        supabase
          .from("posts")
          .select("title, slug")
          .eq("is_published", true)
          .lt("created_at", createdAt)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("posts")
          .select("title, slug")
          .eq("is_published", true)
          .gt("created_at", createdAt)
          .order("created_at", { ascending: true })
          .limit(1),
      ]);
      return {
        older: olderRes.data?.[0] ?? null,
        newer: newerRes.data?.[0] ?? null,
      };
    },
    enabled: !!post,
  });

  const articleDesc = post?.meta_description || post?.excerpt?.replace(/<[^>]*>/g, "").slice(0, 155) || (post ? `Read ${post.title} on GyandootNova.` : "Spiritual articles and insights at GyandootNova.");

  const articleJsonLd = post ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": articleDesc,
    "url": `https://gyandootnova.in/articles/${post.slug}`,
    "datePublished": post.created_at,
    "dateModified": post.updated_at,
    ...(post.cover_url && { "image": post.cover_url }),
    "publisher": {
      "@type": "Organization",
      "name": "GyandootNova",
      "url": "https://gyandootnova.in",
    },
  } : undefined;

  useSEO({
    title: post ? (post.meta_title || post.title) : "Loading Article... | GyandootNova",
    description: articleDesc,
    canonical: post ? `/articles/${post.slug}` : undefined,
    ogImage: post?.cover_url ?? undefined,
    ogType: "article",
    jsonLd: articleJsonLd,
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
          <div
            className="prose prose-lg mt-8 max-w-none leading-relaxed"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content ?? "") }}
          />

          {/* Prev / Next Navigation */}
          {navPosts && (navPosts.older || navPosts.newer) && (
            <nav className="mt-12 border-t border-border pt-8 grid grid-cols-2 gap-4">
              {navPosts.older ? (
                <Link
                  to={`/articles/${navPosts.older.slug}`}
                  className="group flex items-start gap-2 text-left"
                >
                  <ChevronLeft className="mt-1 h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Previous</span>
                    <p className="mt-1 text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {navPosts.older.title}
                    </p>
                  </div>
                </Link>
              ) : <div />}

              {navPosts.newer ? (
                <Link
                  to={`/articles/${navPosts.newer.slug}`}
                  className="group flex items-start gap-2 text-right justify-end"
                >
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Next</span>
                    <p className="mt-1 text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {navPosts.newer.title}
                    </p>
                  </div>
                  <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ) : <div />}
            </nav>
          )}
        </div>
      </article>
    </Layout>
  );
};

export default ArticleDetail;
