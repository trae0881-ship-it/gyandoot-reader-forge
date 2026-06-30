import Layout from "@/components/layout/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import useSEO from "@/hooks/useSEO";
import { ShieldCheck, Lock, Infinity as InfinityIcon, RefreshCw } from "lucide-react";

const faqs = [
  {
    q: "क्या मैं book download कर सकता हूँ?",
    a: "नहीं — और यह आपके फ़ायदे के लिए है। फ़ोन बदलने, खोने या storage भरने पर भी आपकी सारी books safe रहती हैं। बस login कीजिए — मोबाइल, टैबलेट, लैपटॉप, कहीं भी पढ़िए। पन्ने कभी corrupt नहीं होंगे, format कभी नहीं टूटेगा।",
  },
  {
    q: "क्या यह सच में जीवनभर का access है?",
    a: "हाँ, 100%। एक बार खरीदी हुई book हमेशा आपके account में रहती है — कोई subscription नहीं, कोई renewal fees नहीं, कोई expiry नहीं। Author updates भी जीवनभर मुफ़्त मिलेंगे।",
  },
  {
    q: "अगर book पसंद ना आए तो पैसा वापस मिलेगा?",
    a: "हाँ — 7 दिन के अंदर, बिना कोई सवाल पूछे, 100% refund। बस एक email या contact form से request कीजिए, 24 घंटे में पैसे आपके account में।",
  },
  {
    q: "क्या free में पढ़ने को मिलेगा?",
    a: "बिल्कुल। हर paid book का पहला अध्याय Login करते ही free पढ़ सकते हैं। साथ ही 100+ books पूरी तरह FREE हैं — 'Free' badge देखकर पहचानिए। पहले try कीजिए, पसंद आए तो ही खरीदिए।",
  },
  {
    q: "Payment safe है ना? कौन से options हैं?",
    a: "100% safe। हम Razorpay (India का सबसे trusted gateway) और PayPal (international) use करते हैं। UPI, Credit/Debit Card, Net Banking, Wallets — सब accept है। आपकी payment details कभी हमारे server पर store नहीं होतीं।",
  },
  {
    q: "मोबाइल पर पढ़ना comfortable है?",
    a: "बहुत ही ज़्यादा। हमारा reader specially design किया गया है — Dark mode (रात के लिए), font size adjust, bookmarks, और 'जहाँ छोड़ा था वहीं से' continue feature। आँखों पर ज़ोर नहीं पड़ता।",
  },
  {
    q: "क्या ग्रंथ authentic हैं?",
    a: "हर ग्रंथ संस्कृत विद्वानों और experienced editors द्वारा verify किया गया है। मूल श्लोक के साथ सरल हिंदी अनुवाद, टीका, और अर्थ — सब प्रामाणिक sources से। 24,000+ पाठक भरोसा कर चुके हैं।",
  },
  {
    q: "अगर वेबसाइट कभी बंद हो जाए तो?",
    a: "GyandootNova एक registered Indian company है, 2020 से active और तेज़ी से बढ़ रही है। फिर भी — हम email पर हर update भेजते हैं, और किसी भी major change से पहले 90 दिन पहले notice देते हैं।",
  },
  {
    q: "क्या मुझे account बनाना ज़रूरी है?",
    a: "हाँ — और सिर्फ़ 30 second में हो जाता है। Account से आपकी books, bookmarks, और reading progress हमेशा safe रहती है। Google sign-in से एक click में हो जाएगा।",
  },
  {
    q: "किसी book या topic का सुझाव दे सकते हैं?",
    a: "बिल्कुल! Contact page से लिखिए — हमारी editorial team हर सुझाव पढ़ती है। पिछले महीने 12 reader-requested books publish हुई हैं।",
  },
  {
    q: "क्या Highlights और Notes save होते हैं?",
    a: "हाँ — कोई भी पंक्ति select करके highlight या personal note add कर सकते हैं। अगली बार login करने पर सब वहीं मिलेगा। आपकी अपनी डिजिटल pothi बन जाएगी।",
  },
  {
    q: "Bulk discount या gift कर सकते हैं?",
    a: "हाँ! 3+ books एक साथ खरीदने पर automatic discount। किसी और को gift करने के लिए contact कीजिए — हम gift link भेज देंगे।",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map((faq) => ({
    "@type": "Question",
    "name": faq.q,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.a,
    },
  })),
};

const FAQ = () => {
  useSEO({
    title: "FAQ — GyandootNova | आपके सवालों के जवाब",
    description: "GyandootNova के सभी सवालों के जवाब — lifetime access, refund policy, payment safety, mobile reading aur authentic dharmik granth के बारे में।",
    canonical: "/faq",
    jsonLd: faqJsonLd,
  });

  return (
    <Layout>
      <main className="container py-12 md:py-16 max-w-3xl mx-auto">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex items-center gap-1.5" itemScope itemType="https://schema.org/BreadcrumbList">
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <a href="/" itemProp="item"><span itemProp="name">Home</span></a>
              <meta itemProp="position" content="1" />
            </li>
            <li className="text-muted-foreground" aria-hidden="true">/</li>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <span itemProp="name" className="text-foreground font-medium">FAQ</span>
              <meta itemProp="position" content="2" />
            </li>
          </ol>
        </nav>

        <section className="text-center mb-10">
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-primary mb-3">
            आपके सवाल, साफ़ जवाब
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            खरीदने से पहले जो भी confusion है — यहाँ हर जवाब मिलेगा।
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs md:text-sm text-foreground/80">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> 7-दिन पैसा वापसी</span>
            <span className="inline-flex items-center gap-1.5"><InfinityIcon className="h-4 w-4 text-primary" /> जीवनभर access</span>
            <span className="inline-flex items-center gap-1.5"><Lock className="h-4 w-4 text-primary" /> Secure payment</span>
            <span className="inline-flex items-center gap-1.5"><RefreshCw className="h-4 w-4 text-primary" /> Free updates</span>
          </div>
        </section>

        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4 bg-card">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-foreground/75 leading-relaxed text-[15px]">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 md:p-8 text-center">
          <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground">अभी भी कोई सवाल है?</h2>
          <p className="mt-2 text-sm text-muted-foreground">हम WhatsApp aur email par 24 ghante mein reply karte hain.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a href="/contact" className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90">
              Contact करें
            </a>
            <a href="/books" className="inline-flex items-center justify-center rounded-md border-2 border-primary px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground">
              Books देखें →
            </a>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default FAQ;
