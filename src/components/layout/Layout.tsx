import Header from "./Header";
import Footer from "./Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import AskScripture from "@/components/AskScripture";
import { useReferralCapture } from "@/hooks/useReferral";
import { createContext, useContext, useState } from "react";

// Context to let book pages suppress the global AI chat
export const AskScriptureContext = createContext<{
  suppress: boolean;
  setSuppress: (v: boolean) => void;
}>({ suppress: false, setSuppress: () => {} });

export const useAskScriptureSuppress = () => useContext(AskScriptureContext);

const Layout = ({ children }: { children: React.ReactNode }) => {
  useReferralCapture();
  const [suppress, setSuppress] = useState(false);
  
  return (
    <AskScriptureContext.Provider value={{ suppress, setSuppress }}>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-col flex-1">{children}</main>
        <Footer />
        <FloatingWhatsApp />
        {!suppress && <AskScripture />}
      </div>
    </AskScriptureContext.Provider>
  );
};

export default Layout;
