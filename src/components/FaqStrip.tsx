import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "क्या एक बार खरीदने पर हमेशा access रहेगा?",
    a: "जी हाँ, बिल्कुल। एक बार खरीदी हुई ग्रंथ आपके account में जीवनभर रहती है — कोई subscription नहीं, कोई renewal नहीं।",
  },
  {
    q: "क्या मैं फ़ोन और लैपटॉप दोनों पर पढ़ सकता हूँ?",
    a: "हाँ, एक ही login से mobile, tablet और desktop — कहीं भी, कभी भी। आपकी पढ़ाई का progress automatically sync होता है।",
  },
  {
    q: "PDF download क्यों नहीं मिलती?",
    a: "क्योंकि हम आपको असली सुरक्षा देते हैं। फ़ोन खोया तो भी ग्रंथ नहीं खोएंगे, और कोई आपकी किताब चुरा या forward नहीं कर सकता।",
  },
  {
    q: "Payment सुरक्षित है क्या?",
    a: "100% सुरक्षित। Razorpay और PayPal जैसे bank-grade gateways से payment होता है। हम आपका card number कभी save नहीं करते।",
  },
  {
    q: "अगर पसंद न आए तो?",
    a: "7 दिनों के अंदर बिना कोई कारण बताए पूरा refund। बस WhatsApp पर message कीजिए — पैसा वापस।",
  },
];

export default function FaqStrip() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-16 bg-muted/30">
      <div className="container max-w-3xl">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
            <HelpCircle className="h-3 w-3" /> पूछे जाने वाले सवाल
          </span>
          <h2 className="mt-3 font-serif text-2xl md:text-3xl font-bold">
            आपके मन के <span className="text-primary">सारे सवाल</span>
          </h2>
        </div>

        <div className="space-y-2">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-sm"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="w-full flex items-center justify-between gap-3 p-4 text-left"
              >
                <span className="font-serif font-semibold text-card-foreground text-[15px]">
                  {f.q}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === i && (
                <div className="px-4 pb-4 -mt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/60 pt-3">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <Link
            to="/faq"
            className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
          >
            सभी सवाल देखें →
          </Link>
        </div>
      </div>
    </section>
  );
}
