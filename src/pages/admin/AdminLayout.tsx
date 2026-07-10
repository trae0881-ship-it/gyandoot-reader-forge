import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Heart, ShoppingCart, LayoutDashboard, LogOut, ArrowLeft, Settings, Users, Tag, Share2, Sparkles, Code, KeyRound, Mail, Hash, FlaskConical, Globe2, UserCheck, Rocket } from "lucide-react";
import { useEffect, useState } from "react";
import AdminOtpGate, { isAdminOtpValid } from "@/components/admin/AdminOtpGate";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/books", label: "Books", icon: BookOpen },
  { to: "/admin/posts", label: "Posts", icon: FileText },
  { to: "/admin/coupons", label: "Coupons", icon: Tag },
  { to: "/admin/donations", label: "Donations", icon: Heart },
  { to: "/admin/purchases", label: "Purchases", icon: ShoppingCart },
  { to: "/admin/enquiries", label: "Enquiries", icon: Mail },
  { to: "/admin/referrals", label: "Referrals", icon: Share2 },
  { to: "/admin/ai", label: "AI Assistant", icon: Sparkles },
  { to: "/admin/seo-command", label: "SEO Command", icon: Rocket },
  { to: "/admin/lsi", label: "LSI Keywords", icon: Hash },
  { to: "/admin/scripts", label: "Custom Scripts", icon: Code },
  { to: "/admin/auth-providers", label: "Auth Providers", icon: KeyRound },
  { to: "/admin/ai-providers", label: "AI Providers", icon: KeyRound },
  { to: "/admin/api-tester", label: "API Tester", icon: FlaskConical },
  { to: "/admin/visitors", label: "Visitors", icon: Globe2 },
  { to: "/admin/identified-visitors", label: "Identified Visitors", icon: UserCheck },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

const AdminLayout = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [otpVerified, setOtpVerified] = useState<boolean>(() => isAdminOtpValid());

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth");
    }
  }, [user, isAdmin, loading, navigate]);

  // Force Google Translate OFF everywhere admin renders — including portals
  // (Radix Dialog / Select / Toast) that mount on <body> outside our wrapper.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlT = html.getAttribute("translate");
    const prevBodyT = body.getAttribute("translate");
    html.classList.add("notranslate");
    body.classList.add("notranslate");
    html.setAttribute("translate", "no");
    body.setAttribute("translate", "no");
    return () => {
      html.classList.remove("notranslate");
      body.classList.remove("notranslate");
      if (prevHtmlT == null) html.removeAttribute("translate"); else html.setAttribute("translate", prevHtmlT);
      if (prevBodyT == null) body.removeAttribute("translate"); else body.setAttribute("translate", prevBodyT);
    };
  }, []);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!user || !isAdmin) return null;

  if (!otpVerified) {
    return <AdminOtpGate userEmail={user.email ?? undefined} onVerified={() => setOtpVerified(true)} />;
  }

  return (
    <div className="flex min-h-screen notranslate" translate="no">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30 p-4 hidden md:flex md:flex-col md:h-screen md:sticky md:top-0 md:overflow-y-auto">
        <div className="mb-6">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-serif text-lg font-bold text-primary">GyandootNova</span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">Admin Panel</p>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === item.to ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
            <Link to="/"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Site</Link>
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
            <LogOut className="mr-1 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 p-6 md:p-8">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
