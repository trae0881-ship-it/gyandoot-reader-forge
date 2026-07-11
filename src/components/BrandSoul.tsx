import { Link } from "react-router-dom";
import { Sparkles, HeartHandshake, Leaf, ArrowRight, Quote, Sunrise, Wind, BookOpen } from "lucide-react";

/**
 * Three quiet, publishing-brand sections for the homepage:
 *  1. BrandPurpose        — why we exist, in one strong line
 *  2. EmotionalConnection — reader ↔ text, real moments
 *  3. CalmFeeling         — the unhurried atmosphere we protect
 *
 * Uses semantic tokens only. Additive — safe to drop into Index.
 */

// ────────────────────────────────────────────────────────────
// 1. Brand Purpose
// ────────────────────────────────────────────────────────────
export const BrandPurpose = () => (
  <section className="relative py-20 md:py-28 bg-background overflow-hidden">
    <div
      aria-hidden
      className="absolute inset-0 opacity-[0.05]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 30%, hsl(var(--secondary)) 0%, transparent 45%), radial-gradient(circle at 80% 70%, hsl(var(--primary)) 0%, transparent 45%)",
      }}
    />
    <div className="container relative max-w-4xl px-4 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
        <Sparkles className="h-3 w-3" />
        Hamara Uddeshya · Brand Purpose
      </span>
      <h2 className="mt-6 font-serif text-3xl md:text-5xl font-bold leading-[1.2] tracking-tight text-foreground">
        Prachin gyaan ko aaj ke pathak tak —
        <br className="hidden md:block" />
        <span className="text-primary italic font-normal"> bina shor, bina jaldi.</span>
      </h2>
      <p className="mx-auto mt-8 max-w-2xl text-lg md:text-xl leading-[1.85] text-muted-foreground">
        Hum ek publishing brand hain, ek app nahi. Har granth ka ek srot hai,
        har anuvaad ke peeche ek vidwaan hai, aur har pathak ke liye ek shant
        jagah hai — jahaan padhna phir se ek anubhav ban jaaye.
      </p>
      <div className="mt-10 h-px w-24 mx-auto bg-gradient-to-r from-transparent via-secondary to-transparent" />
    </div>
  </section>
);

// ────────────────────────────────────────────────────────────
// 2. Emotional Connection
// ────────────────────────────────────────────────────────────
const moments = [
  {
    icon: Sunrise,
    when: "सुबह की चाय के साथ",
    en: "With the morning tea",
    line: "एक श्लोक, एक साँस — दिन शुरू करने से पहले मन थोड़ा हल्का।",
  },
  {
    icon: Wind,
    when: "मेट्रो के आधे घंटे में",
    en: "In a half-hour commute",
    line: "फ़ोन में शोर नहीं — गीता का एक अध्याय, और भीड़ में भी शांति।",
  },
  {
    icon: BookOpen,
    when: "रात के दीये के पास",
    en: "By the evening lamp",
    line: "पिताजी बड़े font में पढ़ते हैं, बच्चे साथ बैठकर सुनते हैं।",
  },
];

export const EmotionalConnection = () => (
  <section className="relative py-20 md:py-28 bg-gradient-cream">
    <div className="container max-w-6xl px-4">
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary-foreground">
          <HeartHandshake className="h-3 w-3" />
          Pathak Se Judaav · Emotional Connection
        </span>
        <h2 className="mt-6 font-serif text-3xl md:text-4xl font-bold text-foreground">
          Kitaab tab kaam karti hai jab woh
          <span className="text-primary"> aapke din mein baith jaaye</span>
        </h2>
        <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
          Hum bade dawe nahi karte. Bas kuch chhote, sacche pal — jinhe
          humaare pathak hume roz likhkar bhejte hain.
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {moments.map(({ icon: Icon, when, en, line }) => (
          <div
            key={when}
            className="relative surface-card p-8 flex flex-col"
          >
            <Quote className="absolute right-6 top-6 h-8 w-8 text-primary/10" />
            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 font-serif text-xl font-bold text-foreground">{when}</h3>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-primary">{en}</p>
            <p className="mt-4 text-base leading-[1.75] text-muted-foreground flex-1">
              {line}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          to="/testimonials"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Aur pathakon ki zubaani padhein
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  </section>
);

// ────────────────────────────────────────────────────────────
// 3. Calm Feeling
// ────────────────────────────────────────────────────────────
const calmPromises = [
  { hi: "कोई pop-up नहीं", en: "No pop-ups" },
  { hi: "कोई विज्ञापन नहीं", en: "No ads, ever" },
  { hi: "कोई notification शोर नहीं", en: "No notification noise" },
  { hi: "कोई tracking जाल नहीं", en: "No tracking traps" },
];

export const CalmFeeling = () => (
  <section className="relative py-20 md:py-28 bg-primary overflow-hidden">
    <div
      aria-hidden
      className="absolute inset-0 opacity-[0.06]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 50%, hsl(var(--secondary)) 0%, transparent 60%)",
      }}
    />
    <div className="container relative max-w-4xl px-4 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary">
        <Leaf className="h-3 w-3" />
        Shanti Ka Anubhav · A Calm Feeling
      </div>
      <h2 className="mt-6 font-serif text-3xl md:text-5xl font-semibold leading-[1.2] text-primary-foreground">
        Padhne ki jagah bhi
        <span className="text-secondary italic font-normal"> shant honi chahiye.</span>
      </h2>
      <p className="mx-auto mt-8 max-w-2xl text-base md:text-lg leading-[1.85] text-primary-foreground/80">
        Isliye humne ek reader banaya jo aapke saamne aakar khada nahi hota —
        woh peeche hat jaata hai, taaki granth aur aapke beech kuch na aaye.
      </p>

      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
        {calmPromises.map((p) => (
          <div
            key={p.en}
            className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 px-4 py-5 backdrop-blur-sm"
          >
            <p className="font-serif text-base font-semibold text-primary-foreground">{p.hi}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-secondary/90">{p.en}</p>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <Link
          to="/books?filter=free"
          className="inline-flex items-center gap-2 rounded-full bg-secondary px-8 py-3.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90 transition-colors shadow-lg"
        >
          <BookOpen className="h-4 w-4" />
          Shant reader mein padhna shuru karein
        </Link>
      </div>
    </div>
  </section>
);
