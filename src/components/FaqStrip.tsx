import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "एक बार लिया — फिर हमेशा मेरा?",
    a: "हाँ। जो ग्रंथ आपके account में जुड़ गया, वो जीवन-भर रहेगा। न किराया, न renewal। लेखक के आगे के सुधार भी बिना पैसे मिलते रहेंगे।",
  },
  {
    q: "फ़ोन, tablet, laptop — तीनों पर चलेगा?",
    a: "एक ही login से हर device पर। पढ़ाई कहाँ छूटी थी, यह भी अपने-आप याद रहता है — अगला पन्ना वहीं से खुलेगा।",
  },
  {
    q: "फ़ाइल डाउनलोड क्यों नहीं मिलती?",
    a: "क्योंकि उसमें पाठक का नुक़सान ज़्यादा है — फ़ोन खोया तो सब गया, storage भरा तो झंझट। हमारे यहाँ login ही आपकी pothi है, कहीं खोने का सवाल नहीं।",
  },
  {
    q: "Payment सुरक्षित है क्या?",
    a: "पूरी तरह। Razorpay और PayPal — दोनों bank-स्तर की सुरक्षा वाले हैं। आपके card की जानकारी कभी हमारे server पर नहीं आती।",
  },
  {
    q: "अगर पसंद न आया?",
    a: "7 दिन के भीतर एक message — बस इतना काफ़ी है। पूरा पैसा 24 घंटे में वापस, बिना कोई सवाल।",
  },
];

export default function FaqStrip() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-16 bg-muted/30">
      <div className="container max-w-3xl">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
            <HelpCircle className="h-3 w-3" /> मन की उलझनें
          </span>
          <h2 className="mt-3 font-serif text-2xl md:text-3xl font-bold">
            जो पूछने में झिझक होती है, <span className="text-primary">वो सब यहाँ।</span>
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
            बाक़ी सारे सवाल देखिए →
          </Link>
        </div>
      </div>
    </section>
  );
}
