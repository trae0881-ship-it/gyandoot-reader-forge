// Select a real catalogue book with the oldest article coverage first. Posts
// provide the durable cursor: a failed generation never consumes a book turn.
export async function selectBookBlogTarget(sb: any, excluded = new Set<string>()) {
  const [{ data: books, error: booksError }, { data: knowledge, error: kbError }, { data: posts, error: postsError }] = await Promise.all([
    sb.from("books").select("id,title,slug,author").order("created_at", { ascending: true }),
    sb.from("book_knowledge").select("book_id,summary,topics,concepts,keywords,entities,faqs"),
    sb.from("posts").select("source_book_ids,created_at").eq("post_type", "article")
      .not("source_book_ids", "is", null).order("created_at", { ascending: false }).limit(1000),
  ]);
  if (booksError || kbError || postsError) throw booksError || kbError || postsError;
  const byId = new Map((knowledge || []).map((row: any) => [row.book_id, row]));
  const lastCovered = new Map<string, number>();
  for (const post of posts || []) {
    for (const id of post.source_book_ids || []) {
      if (!lastCovered.has(id)) lastCovered.set(id, new Date(post.created_at).getTime());
    }
  }
  const book = [...(books || [])]
    .filter((b: any) => b.slug && byId.has(b.id) && !excluded.has(b.id))
    .sort((a: any, b: any) => (lastCovered.get(a.id) || 0) - (lastCovered.get(b.id) || 0))[0];
  if (!book) return null;
  const kb: any = byId.get(book.id);
  return {
    id: book.id, title: book.title, slug: book.slug, author: book.author,
    summary: kb.summary || "", topics: kb.topics || [], concepts: kb.concepts || [],
    keywords: kb.keywords || [], entities: kb.entities || [], faqs: kb.faqs || [],
  };
}