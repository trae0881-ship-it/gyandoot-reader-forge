import Layout from "@/components/layout/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import useSEO from "@/hooks/useSEO";
import { ShieldCheck, Lock, Infinity as InfinityIcon, RefreshCw } from "lucide-react";

const faqs = [
  {
    q: "फ़ाइल डाउनलोड क्यों नहीं मिलती?",
    a: "क्योंकि हमने पाठक की सुविधा को पहले रखा है। फ़ोन खोए, बदले या storage भरे — आपकी pothi वहीं की वहीं रहती है। बस login कीजिए, और किसी भी device पर पढ़ना शुरू कर दीजिए। न पन्ने बिगड़ते हैं, न font टूटता है।",
  },
  {
    q: "क्या access सचमुच जीवन-भर का है?",
    a: "जी हाँ। एक बार जो ग्रंथ आपके account में जुड़ गया, वो हमेशा रहेगा। न कोई मासिक शुल्क, न कोई renewal। लेखक भविष्य में जो सुधार करेंगे, वे भी बिना अलग पैसे आप तक पहुँचेंगे।",
  },
  {
    q: "अगर पढ़कर मन न लगे तो?",
    a: "पहले 7 दिन में एक message काफ़ी है — पूरा पैसा 24 घंटे के भीतर वापस। कोई कारण पूछा नहीं जाता, कोई formalities नहीं।",
  },
  {
    q: "मुफ़्त में कुछ मिलेगा भी?",
    a: "बिलकुल। हर paid ग्रंथ का पहला अध्याय login करते ही खुल जाता है। इसके अलावा 100 से अधिक ग्रंथ पूरी तरह मुफ़्त हैं — 'निःशुल्क' का tag देखकर पहचान लीजिए।",
  },
  {
    q: "Payment किस-किस तरीक़े से हो सकता है?",
    a: "UPI, credit/debit card, net banking, wallet — सब चलते हैं। भारत में Razorpay और विदेश के पाठकों के लिए PayPal। कार्ड की details कभी हमारे पास save नहीं होतीं।",
  },
  {
    q: "मोबाइल पर आँखों को तकलीफ़ तो नहीं होगी?",
    a: "इसी बात को ध्यान में रखकर reader बनाया है। रात वाला हल्का रंग, font बड़ा-छोटा करने का option, और 'जहाँ छोड़ा था' वहीं से आगे — इन सबसे लंबी पढ़ाई भी थकाती नहीं।",
  },
  {
    q: "आपके अनुवाद कितने भरोसेमंद हैं?",
    a: "हर पाठ को पहले संस्कृत के जानकार जाँचते हैं, फिर सरल हिंदी में उतारा जाता है। मूल श्लोक साथ में रहता है ताकि पाठक ख़ुद मिला सके। किसी भी ग़लती की सूचना मिलते ही अगले संस्करण में सुधार हो जाता है।",
  },
  {
    q: "अगर कल को वेबसाइट बंद हो गई तो?",
    a: "GyandootNova एक विधिवत पंजीकृत भारतीय संस्था है और नियमित रूप से बढ़ रही है। फिर भी — हर बड़े बदलाव से पहले पाठकों को email से 90 दिन का पूर्व-सूचना दी जाती है, ताकि किसी को अचानक कुछ बदलता न लगे।",
  },
  {
    q: "क्या account बनाना ज़रूरी है?",
    a: "हाँ, पर इसमें सिर्फ़ आधा मिनट लगता है। Google से sign-in एक tap में हो जाता है। Account से आपके bookmark, नोट, और आधी पढ़ी हुई किताब — सब सुरक्षित रहते हैं।",
  },
  {
    q: "कोई नया ग्रंथ जोड़ने का सुझाव कैसे दूँ?",
    a: "Contact form या WhatsApp पर लिख भेजिए। संपादकीय टीम हर सुझाव पढ़ती है। पिछले महीने पाठकों की माँग पर 12 नए ग्रंथ जोड़े गए हैं।",
  },
  {
    q: "पढ़ते वक़्त कुछ highlight या note कर सकते हैं?",
    a: "जी हाँ। कोई भी पंक्ति चुनकर highlight कर लीजिए या अपनी छोटी टिप्पणी जोड़ दीजिए। अगली बार login करते ही सब कुछ वहीं मिलेगा — आपकी अपनी डिजिटल pothi बनती जाती है।",
  },
  {
    q: "कई ग्रंथ एक साथ लेने या किसी को उपहार देने का तरीक़ा?",
    a: "3 या अधिक ग्रंथ एक साथ जोड़ते ही छूट अपने-आप लग जाती है। किसी परिजन को उपहार देना हो, तो contact कीजिए — हम gift link तैयार कर देते हैं।",
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
    title: "अक्सर पूछे जाने वाले सवाल — GyandootNova",
    description:
      "पढ़ाई, payment, refund और account से जुड़े हर सवाल का सीधा जवाब — बिना घुमाए, बिना छुपाए।",
    canonical: "/faq",
    jsonLd: faqJsonLd,
  });

  return (
    <Layout>
      <main className="container py-12 md:py-16 max-w-3xl mx-auto">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex items-center gap-1.5" itemScope itemType="https://schema.org/BreadcrumbList">
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <a href="/" itemProp="item"><span itemProp="name">मुख्य पृष्ठ</span></a>
              <meta itemProp="position" content="1" />
            </li>
            <li className="text-muted-foreground" aria-hidden="true">/</li>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <span itemProp="name" className="text-foreground font-medium">सवाल-जवाब</span>
              <meta itemProp="position" content="2" />
            </li>
          </ol>
        </nav>

        <section className="text-center mb-10">
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-primary mb-3">
            जो भी उलझन है, यहाँ खुल जाएगी
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            पैसे लगाने से पहले हर बात साफ़ पूछिए — जवाब बिना घुमाए।
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs md:text-sm text-foreground/80">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> 7 दिन में पूरा refund</span>
            <span className="inline-flex items-center gap-1.5"><InfinityIcon className="h-4 w-4 text-primary" /> उम्रभर पहुँच</span>
            <span className="inline-flex items-center gap-1.5"><Lock className="h-4 w-4 text-primary" /> सुरक्षित payment</span>
            <span className="inline-flex items-center gap-1.5"><RefreshCw className="h-4 w-4 text-primary" /> नए संस्करण मुफ़्त</span>
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
          <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground">कुछ और पूछना है?</h2>
          <p className="mt-2 text-sm text-muted-foreground">WhatsApp या email — जो सुविधा हो। जवाब उसी दिन।</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a href="/contact" className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90">
              हमसे बात करें
            </a>
            <a href="/books" className="inline-flex items-center justify-center rounded-md border-2 border-primary px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground">
              पुस्तकालय देखें →
            </a>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default FAQ;
