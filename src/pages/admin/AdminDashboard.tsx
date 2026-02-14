import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Heart, ShoppingCart } from "lucide-react";

const AdminDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [books, posts, donations, purchases] = await Promise.all([
        supabase.from("books").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("donations").select("amount").eq("status", "completed"),
        supabase.from("purchases").select("id", { count: "exact", head: true }).eq("status", "completed"),
      ]);
      const totalDonations = donations.data?.reduce((sum, d) => sum + Number(d.amount), 0) ?? 0;
      return {
        bookCount: books.count ?? 0,
        postCount: posts.count ?? 0,
        totalDonations,
        purchaseCount: purchases.count ?? 0,
      };
    },
  });

  const cards = [
    { label: "Books", value: stats?.bookCount ?? 0, icon: BookOpen, color: "text-primary" },
    { label: "Posts", value: stats?.postCount ?? 0, icon: FileText, color: "text-blue-600" },
    { label: "Donations", value: `₹${stats?.totalDonations ?? 0}`, icon: Heart, color: "text-green-600" },
    { label: "Purchases", value: stats?.purchaseCount ?? 0, icon: ShoppingCart, color: "text-secondary-foreground" },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
