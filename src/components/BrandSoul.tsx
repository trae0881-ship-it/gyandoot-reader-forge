import { Link } from "react-router-dom";
import { Sparkles, HeartHandshake, Leaf, ArrowRight, Quote, Sunrise, Wind, BookOpen } from "lucide-react";

/**
 * Three quiet, publishing-brand sections for the homepage:
 *  1. BrandPurpose        — why we exist
 *  2. EmotionalConnection — reader ↔ text, real moments
 *  3. CalmFeeling         — the unhurried atmosphere we protect
 *
 * English-only copy. Uses semantic tokens.
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
        Our Purpose
      </span>
      <h2 className="mt-6 font-serif text-3xl md:text-5xl font-bold leading-[1.2] tracking-tight text-foreground">
        Bringing timeless wisdom to today's reader —
        <br className="hidden md:block" />
        <span className="text-primary italic font-normal"> without the noise, without the rush.</span>
      </h2>
      <p className="mx-auto mt-8 max-w-2xl text-lg md:text-xl leading-[1.85] text-muted-foreground">
        We are a publishing brand, not just another app. Every scripture has a
        verified source, every translation is shaped by a scholar, and every
        reader is given a quiet place — where reading becomes an experience
        again.
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
    when: "With the morning tea",
    sub: "A calm start",
    line: "One shloka, one breath — the day begins a little lighter, a little clearer.",
  },
  {
    icon: Wind,
    when: "On a half-hour commute",
    sub: "Stillness in the crowd",
    line: "No noise, no ads — just one chapter of the Gita, and quiet inside the rush.",
  },
  {
    icon: BookOpen,
    when: "By the evening lamp",
    sub: "A family ritual",
    line: "Father reads in a larger font, the children sit close and listen — the ritual returns.",
  },
];

export const EmotionalConnection = () => (
  <section className="relative py-20 md:py-28 bg-gradient-cream">
    <div className="container max-w-6xl px-4">
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary-foreground">
          <HeartHandshake className="h-3 w-3" />
          Emotional Connection
        </span>
        <h2 className="mt-6 font-serif text-3xl md:text-4xl font-bold text-foreground">
          A book only truly works when it
          <span className="text-primary"> settles into your day</span>
        </h2>
        <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
          We don't make loud promises. Just small, honest moments that our
          readers write in and share with us.
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {moments.map(({ icon: Icon, when, sub, line }) => (
          <div
            key={when}
            className="relative surface-card p-8 flex flex-col"
          >
            <Quote className="absolute right-6 top-6 h-8 w-8 text-primary/10" />
            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 font-serif text-xl font-bold text-foreground">{when}</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-primary">{sub}</p>
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
          Read more reader stories
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
  { title: "No pop-ups", sub: "Ever" },
  { title: "No ads", sub: "Never sold" },
  { title: "No noisy alerts", sub: "Silent by default" },
  { title: "No tracking traps", sub: "Your reading is yours" },
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
        A Calm Feeling
      </div>
      <h2 className="mt-6 font-serif text-3xl md:text-5xl font-semibold leading-[1.2] text-primary-foreground">
        The place you read in
        <span className="text-secondary italic font-normal"> should be calm too.</span>
      </h2>
      <p className="mx-auto mt-8 max-w-2xl text-base md:text-lg leading-[1.85] text-primary-foreground/80">
        That is why we built a reader that quietly steps back — so nothing
        stands between you and the scripture in front of you.
      </p>

      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
        {calmPromises.map((p) => (
          <div
            key={p.title}
            className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 px-4 py-5 backdrop-blur-sm"
          >
            <p className="font-serif text-base font-semibold text-primary-foreground">{p.title}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-secondary/90">{p.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <Link
          to="/books?filter=free"
          className="inline-flex items-center gap-2 rounded-full bg-secondary px-8 py-3.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90 transition-colors shadow-lg"
        >
          <BookOpen className="h-4 w-4" />
          Start reading in the calm reader
        </Link>
      </div>
    </div>
  </section>
);
