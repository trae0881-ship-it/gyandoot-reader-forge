import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Heart, User, Calendar, IndianRupee, ExternalLink } from "lucide-react";

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const { data: purchases } = useQuery({
    queryKey: ["user-purchases", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_purchases", { _user_id: user!.id });
      if (error) throw error;
      // fetch book details for each purchase
      const bookIds = (data ?? []).map((p: any) => p.book_id);
      if (!bookIds.length) return [];
      const { data: books } = await supabase.from("books").select("id, title, slug, cover_url, price, is_free").in("id", bookIds);
      return (data ?? []).map((p: any) => ({
        ...p,
        book: books?.find((b) => b.id === p.book_id),
      }));
    },
  });

  const { data: donations } = useQuery({
    queryKey: ["user-donations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_donations", { _user_id: user!.id });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["user-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("display_name, avatar_url").eq("user_id", user!.id).single();
      return data;
    },
  });

  if (loading) return <Layout><div className="container py-20 text-center text-muted-foreground">Loading...</div></Layout>;
  if (!user) return null;

  const totalDonated = donations?.reduce((sum: number, d: any) => sum + Number(d.amount), 0) ?? 0;
  const completedPurchases = purchases?.filter((p: any) => p.status === "completed") ?? [];

  return (
    <Layout>
      <main className="container py-12 max-w-4xl">
        {/* Profile Header */}
        <section className="flex items-center gap-5 mb-10">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">
              {profile?.display_name ?? user.email?.split("@")[0]}
            </h1>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
        </section>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          <Card className="text-center p-4">
            <BookOpen className="h-6 w-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{completedPurchases.length}</p>
            <p className="text-xs text-muted-foreground">Books Purchased</p>
          </Card>
          <Card className="text-center p-4">
            <Heart className="h-6 w-6 text-secondary mx-auto mb-1" />
            <p className="text-2xl font-bold">{donations?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">Donations Made</p>
          </Card>
          <Card className="text-center p-4 col-span-2 md:col-span-1">
            <IndianRupee className="h-6 w-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">₹{totalDonated.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Donated</p>
          </Card>
        </div>

        {/* Purchased Books */}
        <section className="mb-10">
          <h2 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> My Books
          </h2>
          {completedPurchases.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No books purchased yet.</p>
                <Link to="/books" className="text-primary text-sm underline mt-1 inline-block">Browse Books</Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {completedPurchases.map((p: any) => (
                <Card key={p.id} className="flex items-start gap-4 p-4">
                  {p.book?.cover_url ? (
                    <img src={p.book.cover_url} alt={p.book?.title} className="h-20 w-14 object-cover rounded-md shrink-0" />
                  ) : (
                    <div className="h-20 w-14 bg-muted rounded-md flex items-center justify-center shrink-0">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2">{p.book?.title ?? "Unknown Book"}</h3>
                    <Badge variant="secondary" className="text-xs mt-1">{p.status}</Badge>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(p.created_at).toLocaleDateString("en-IN")}
                    </p>
                    {p.book?.slug && (
                      <Link
                        to={`/books/${p.book.slug}`}
                        className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                      >
                        Read Book <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <Separator className="my-8" />

        {/* Donation History */}
        <section>
          <h2 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-secondary" /> Donation History
          </h2>
          {(!donations || donations.length === 0) ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <Heart className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No donations yet.</p>
                <Link to="/donate" className="text-primary text-sm underline mt-1 inline-block">Make a Donation</Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {donations.map((d: any) => (
                <Card key={d.id}>
                  <CardContent className="flex items-center justify-between py-4 px-5">
                    <div>
                      <p className="font-semibold text-foreground">₹{Number(d.amount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(d.created_at).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <Badge variant={d.status === "completed" ? "default" : "secondary"}>
                      {d.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
};

export default Profile;
