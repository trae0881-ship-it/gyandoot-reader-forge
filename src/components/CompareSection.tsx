import { Check, X } from "lucide-react";

const rows = [
  { feature: "एक बार खरीद, जीवनभर पढ़ें", us: true, print: false, pdf: false },
  { feature: "मोबाइल / टैबलेट / लैपटॉप पर पढ़ें", us: true, print: false, pdf: true },
  { feature: "Dark mode + font बड़ा/छोटा", us: true, print: false, pdf: false },
  { feature: "पन्ने फटने/खोने का डर नहीं", us: true, print: false, pdf: true },
  { feature: "Bookmark + पढ़ाई का progress", us: true, print: false, pdf: false },
  { feature: "Author updates मुफ़्त", us: true, print: false, pdf: false },
  { feature: "चोरी / forward नहीं हो सकती", us: true, print: false, pdf: false },
  { feature: "Shipping / delay नहीं", us: true, print: false, pdf: true },
];

const Cell = ({ ok }: { ok: boolean }) =>
  ok ? (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-600/15 text-green-700">
      <Check className="h-3.5 w-3.5" />
    </span>
  ) : (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-destructive/10 text-destructive">
      <X className="h-3.5 w-3.5" />
    </span>
  );

export default function CompareSection() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container max-w-4xl">
        <div className="text-center mb-8">
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
            फ़र्क समझिए
          </span>
          <h2 className="mt-3 font-serif text-2xl md:text-3xl font-bold">
            छपी हुई किताब, साधारण PDF, या <span className="text-primary">GyandootNova?</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            एक ही नज़र में देखिए — सबसे smart विकल्प कौन सा है।
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left p-3 md:p-4 font-semibold">सुविधा</th>
                <th className="p-3 md:p-4 font-serif font-bold text-primary text-center whitespace-nowrap">
                  GyandootNova
                </th>
                <th className="p-3 md:p-4 font-semibold text-muted-foreground text-center whitespace-nowrap">
                  छपी किताब
                </th>
                <th className="p-3 md:p-4 font-semibold text-muted-foreground text-center whitespace-nowrap">
                  PDF
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.feature} className="border-b border-border last:border-0">
                  <td className="p-3 md:p-4 font-medium text-foreground/90">{r.feature}</td>
                  <td className="p-3 md:p-4 text-center bg-primary/[0.04]">
                    <Cell ok={r.us} />
                  </td>
                  <td className="p-3 md:p-4 text-center">
                    <Cell ok={r.print} />
                  </td>
                  <td className="p-3 md:p-4 text-center">
                    <Cell ok={r.pdf} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
