import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import useSEO from "@/hooks/useSEO";

const Contact = () => {
  useSEO({
    title: "हमसे बात करें — GyandootNova से जुड़िए",
    description:
      "ग्रंथ, order, सुझाव या साझेदारी — जो भी बात हो, WhatsApp, email या form से पहुँचिए। जवाब उसी दिन।",
    canonical: "/contact",
  });

  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: form,
      });
      if (error) throw error;
      toast({ title: "संदेश पहुँच गया ✅", description: "बहुत जल्द जवाब मिलेगा।" });
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      toast({ title: "भेजने में दिक़्क़त हुई", description: "थोड़ी देर बाद कोशिश कीजिए या सीधे email कीजिए।", variant: "destructive" });
    } finally {

      setSending(false);
    }
  };

  return (
    <Layout>
      <main className="container py-16">
        <section className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">एक बात कहनी है?</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            शिकायत, सुझाव, या बस हाल-चाल — जो भी हो, लिख भेजिए। हम पढ़ते हैं, और उसी दिन जवाब देते हैं।
          </p>
        </section>


        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact Info */}
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-6">सीधा सम्पर्क</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Mail className="h-6 w-6 text-primary mt-1" />
                <div>
                  <p className="font-semibold text-foreground">ईमेल</p>
                  <p className="text-muted-foreground">contact@gyandootnova.in</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="h-6 w-6 text-primary mt-1" />
                <div>
                  <p className="font-semibold text-foreground">फ़ोन / WhatsApp</p>
                  <p className="text-muted-foreground">+91 91615 33353</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-primary mt-1" />
                <div>
                  <p className="font-semibold text-foreground">पता</p>
                  <p className="text-muted-foreground">उन्नाव, उत्तर प्रदेश — भारत</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-muted/50 rounded-xl">
              <h3 className="font-serif font-semibold text-foreground mb-2">कब पहुँचें</h3>
              <p className="text-sm text-muted-foreground">सोम से शनि: सुबह 10 से शाम 6 (भारतीय समय)</p>
              <p className="text-sm text-muted-foreground">रविवार: विश्राम दिवस</p>
            </div>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-6">फ़ॉर्म भरिए</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="आपका नाम"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                type="email"
                placeholder="ईमेल पता"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                placeholder="विषय"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
              <Textarea
                placeholder="अपनी बात लिखिए…"
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> भेज रहे हैं…
                  </>
                ) : (
                  "संदेश भेजें"
                )}
              </Button>

            </form>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Contact;
