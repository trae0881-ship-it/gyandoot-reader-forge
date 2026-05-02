import Header from "./Header";
import Footer from "./Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { useReferralCapture } from "@/hooks/useReferral";
import { useCustomScripts } from "@/hooks/useCustomScripts";

const Layout = ({ children }: { children: React.ReactNode }) => {
  useReferralCapture();
  useCustomScripts();
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-col flex-1">{children}</main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
};

export default Layout;
