import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LocaleProvider } from "@/hooks/useLocale";
import { useVisitorTracker } from "@/hooks/useVisitorTracker";



import { lazy, Suspense } from "react";

// Only eagerly load the homepage
import Index from "./pages/Index";

// Lazy load all other pages for faster initial load
const Books = lazy(() => import("./pages/Books"));
const BookDetail = lazy(() => import("./pages/BookDetail"));
const BookReader = lazy(() => import("./pages/BookReader"));
const FileBookReader = lazy(() => import("./pages/FileBookReader"));
const Articles = lazy(() => import("./pages/Articles"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const Donate = lazy(() => import("./pages/Donate"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const About = lazy(() => import("./pages/About"));
const OurStory = lazy(() => import("./pages/OurStory"));
const Services = lazy(() => import("./pages/Services"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const TestimonialsPage = lazy(() => import("./pages/TestimonialsPage"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const Careers = lazy(() => import("./pages/Careers"));
const Support = lazy(() => import("./pages/Support"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const SitemapPage = lazy(() => import("./pages/Sitemap"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Keywords = lazy(() => import("./pages/Keywords"));
const Cart = lazy(() => import("./pages/Cart"));
const Library = lazy(() => import("./pages/Library"));

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminBooks = lazy(() => import("./pages/admin/AdminBooks"));
const AdminPosts = lazy(() => import("./pages/admin/AdminPosts"));
const AdminDonations = lazy(() => import("./pages/admin/AdminDonations"));
const AdminPurchases = lazy(() => import("./pages/admin/AdminPurchases"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminReferrals = lazy(() => import("./pages/admin/AdminReferrals"));
const AdminAI = lazy(() => import("./pages/admin/AdminAI"));
const AdminScripts = lazy(() => import("./pages/admin/AdminScripts"));
const AdminAuthProviders = lazy(() => import("./pages/admin/AdminAuthProviders"));
const AdminEnquiries = lazy(() => import("./pages/admin/AdminEnquiries"));
const AdminLSI = lazy(() => import("./pages/admin/AdminLSI"));
const AdminAIProviders = lazy(() => import("./pages/admin/AdminAIProviders"));
const AdminApiTester = lazy(() => import("./pages/admin/AdminApiTester"));
const AdminVisitors = lazy(() => import("./pages/admin/AdminVisitors"));
const AdminIdentifiedVisitors = lazy(() => import("./pages/admin/AdminIdentifiedVisitors"));
const AdminSeoCommand = lazy(() => import("./pages/admin/AdminSeoCommand"));
const AdminTeam = lazy(() => import("./pages/admin/AdminTeam"));
const AdminContentAudit = lazy(() => import("./pages/admin/AdminContentAudit"));

// SEO content — sacred text hubs, Hindi meaning pages, meditation guides
const BhagavadGitaHub = lazy(() => import("./pages/texts/BhagavadGita"));
const VedasHub = lazy(() => import("./pages/texts/Vedas"));
const UpanishadsHub = lazy(() => import("./pages/texts/Upanishads"));
const RigVedaHub = lazy(() => import("./pages/texts/RigVeda"));
const UpanishadMeaningHindi = lazy(() => import("./pages/hindi/UpanishadMeaningHindi"));
const VedasMeaningHindi = lazy(() => import("./pages/hindi/VedasMeaningHindi"));
const DhyanKaiseKarein = lazy(() => import("./pages/hindi/DhyanKaiseKarein"));
const HowToReadBhagavadGita = lazy(() => import("./pages/how-to-read/HowToReadBhagavadGita"));
const TechniquesCompared = lazy(() => import("./pages/meditation/TechniquesCompared"));
const MeditationForAnxiety = lazy(() => import("./pages/meditation/MeditationForAnxiety"));
const MeditationForStress = lazy(() => import("./pages/meditation/MeditationForStress"));

// Q&A pages (high-volume long-tail search targets)
const QAWhoWroteBhagavadGita = lazy(() => import("./pages/qa/WhoWroteBhagavadGita"));
const QAWhoWroteVedas = lazy(() => import("./pages/qa/WhoWroteVedas"));
const QAHowManyVedas = lazy(() => import("./pages/qa/HowManyVedas"));
const QAHowManyUpanishads = lazy(() => import("./pages/qa/HowManyUpanishads"));
const QAHowManySlokas = lazy(() => import("./pages/qa/HowManySlokasInBhagavadGita"));

// Minimal loading spinner
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const queryClient = new QueryClient();

const AppContent = () => {
  useVisitorTracker();




  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <LocaleProvider>
            
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/books" element={<Books />} />
                <Route path="/books/:slug" element={<BookDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/library" element={<Library />} />

                <Route path="/books/:slug/read-file" element={<FileBookReader />} />
                <Route path="/books/:slug/:chapterSlug" element={<BookReader />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/articles/:slug" element={<ArticleDetail />} />
                <Route path="/support-us" element={<Donate />} />
                <Route path="/donate" element={<Donate />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/about" element={<About />} />
                <Route path="/our-story" element={<OurStory />} />
                <Route path="/story" element={<Navigate to="/our-story" replace />} />
                <Route path="/services" element={<Services />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/testimonials" element={<TestimonialsPage />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-conditions" element={<TermsConditions />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/support" element={<Support />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
                <Route path="/shipping-policy" element={<ShippingPolicy />} />
                <Route path="/sitemap" element={<SitemapPage />} />
                <Route path="/keywords" element={<Keywords />} />

                {/* SEO content pages */}
                <Route path="/texts/bhagavad-gita" element={<BhagavadGitaHub />} />
                <Route path="/texts/vedas" element={<VedasHub />} />
                <Route path="/texts/upanishads" element={<UpanishadsHub />} />
                <Route path="/texts/rig-veda" element={<RigVedaHub />} />
                <Route path="/texts/rigveda" element={<Navigate to="/texts/rig-veda" replace />} />
                <Route path="/hindi/upanishad-meaning-in-hindi" element={<UpanishadMeaningHindi />} />
                <Route path="/hindi/vedas-meaning-in-hindi" element={<VedasMeaningHindi />} />
                <Route path="/hindi/dhyan-kaise-karein" element={<DhyanKaiseKarein />} />
                <Route path="/how-to-read/bhagavad-gita" element={<HowToReadBhagavadGita />} />
                <Route path="/meditation/techniques-compared" element={<TechniquesCompared />} />
                <Route path="/meditation/for-anxiety" element={<MeditationForAnxiety />} />
                <Route path="/meditation/for-stress" element={<MeditationForStress />} />

                {/* Q&A long-tail pages */}
                <Route path="/qa/who-wrote-bhagavad-gita" element={<QAWhoWroteBhagavadGita />} />
                <Route path="/qa/who-wrote-vedas" element={<QAWhoWroteVedas />} />
                <Route path="/qa/how-many-vedas" element={<QAHowManyVedas />} />
                <Route path="/qa/how-many-upanishads" element={<QAHowManyUpanishads />} />
                <Route path="/qa/how-many-slokas-in-bhagavad-gita" element={<QAHowManySlokas />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="books" element={<AdminBooks />} />
                  <Route path="posts" element={<AdminPosts />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="donations" element={<AdminDonations />} />
                  <Route path="purchases" element={<AdminPurchases />} />
                  <Route path="referrals" element={<AdminReferrals />} />
                  <Route path="ai" element={<AdminAI />} />
                  <Route path="scripts" element={<AdminScripts />} />
                  <Route path="auth-providers" element={<AdminAuthProviders />} />
                  <Route path="enquiries" element={<AdminEnquiries />} />
                  <Route path="lsi" element={<AdminLSI />} />
                  <Route path="ai-providers" element={<AdminAIProviders />} />
                  <Route path="api-tester" element={<AdminApiTester />} />
                  <Route path="visitors" element={<AdminVisitors />} />
                  <Route path="identified-visitors" element={<AdminIdentifiedVisitors />} />
                  <Route path="seo-command" element={<AdminSeoCommand />} />
                  <Route path="team" element={<AdminTeam />} />
                  <Route path="content-audit" element={<AdminContentAudit />} />
                  <Route path="settings" element={<AdminSettings />} />

                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </BrowserRouter>
          </LocaleProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const App = () => <AppContent />;

export default App;
