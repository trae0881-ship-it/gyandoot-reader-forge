import Header from "./Header";
import Footer from "./Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import AskScripture from "@/components/AskScripture";
import { useReferralCapture } from "@/hooks/useReferral";

const Layout = ({ children }: { children: React.ReactNode }) => {
  useReferralCapture();
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-col flex-1">{children}</main>
      <Footer />
      <FloatingWhatsApp />
      <AskScripture />
    </div>
  );
};

export default Layout;
