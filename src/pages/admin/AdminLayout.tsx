import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Heart, ShoppingCart, LayoutDashboard, LogOut, ArrowLeft, Settings, Users, Tag, Share2, Sparkles, Code, KeyRound, Mail, Hash, FlaskConical, Globe2, UserCheck, Rocket, UsersRound, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import AdminOtpGate, { isAdminOtpValid } from "@/components/admin/AdminOtpGate";

import type { AdminPermissions } from "@/hooks/useAuth";

type NavItem = {
  to: string;
  label: string;
  icon: any;
  /** Which permission area gates this link. undefined = super admin only. */
  area?: keyof AdminPermissions;
};

const navItems: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, area: "hasAdminAccess" },
  { to: "/admin/users", label: "Users", icon: Users, area: "users" },
  { to: "/admin/books", label: "Books", icon: BookOpen, area: "books" },
  { to: "/admin/posts", label: "Posts", icon: FileText, area: "seo" },
  { to: "/admin/content-audit", label: "Content Audit", icon: ShieldCheck, area: "hasAdminAccess" },
  { to: "/admin/coupons", label: "Coupons", icon: Tag, area: "payments" },
  { to: "/admin/donations", label: "Donations", icon: Heart, area: "payments" },
  { to: "/admin/purchases", label: "Purchases", icon: ShoppingCart, area: "payments" },
  { to: "/admin/enquiries", label: "Enquiries", icon: Mail, area: "users" },
  { to: "/admin/referrals", label: "Referrals", icon: Share2, area: "payments" },
  { to: "/admin/ai", label: "AI Assistant", icon: Sparkles, area: "isSuperAdmin" },
  { to: "/admin/seo-command", label: "SEO Command", icon: Rocket, area: "seo" },
  { to: "/admin/team", label: "Team & Agents", icon: UsersRound, area: "users" },
  { to: "/admin/lsi", label: "LSI Keywords", icon: Hash, area: "seo" },
  { to: "/admin/scripts", label: "Custom Scripts", icon: Code, area: "isSuperAdmin" },
  { to: "/admin/auth-providers", label: "Auth Providers", icon: KeyRound, area: "isSuperAdmin" },
  { to: "/admin/ai-providers", label: "AI Providers", icon: KeyRound, area: "isSuperAdmin" },
  { to: "/admin/api-tester", label: "API Tester", icon: FlaskConical, area: "isSuperAdmin" },
  { to: "/admin/visitors", label: "Visitors", icon: Globe2, area: "isSuperAdmin" },
  { to: "/admin/identified-visitors", label: "Identified Visitors", icon: UserCheck, area: "isSuperAdmin" },
  { to: "/admin/settings", label: "Settings", icon: Settings, area: "isSuperAdmin" },
];

const AdminLayout = () => {
  const { user, isAdmin, perms, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [otpVerified, setOtpVerified] = useState<boolean>(() => isAdminOtpValid());

  const canEnter = perms.hasAdminAccess || isAdmin;

  useEffect(() => {
    if (!loading && (!user || !canEnter)) {
      navigate("/auth");
    }
  }, [user, canEnter, loading, navigate]);

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

  if (!user || !canEnter) return null;

  if (!otpVerified) {
    return <AdminOtpGate userEmail={user.email ?? undefined} onVerified={() => setOtpVerified(true)} />;
  }

  const visibleItems = navItems.filter((item) => {
    if (!item.area) return isAdmin;
    return perms[item.area];
  });

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
          {visibleItems.map((item) => (
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
