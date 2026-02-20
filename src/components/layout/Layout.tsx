import Header from "./Header";
import Footer from "./Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col">
    <Header />
    <main className="flex flex-col flex-1">{children}</main>
    <Footer />
    <FloatingWhatsApp />
  </div>
);

export default Layout;

