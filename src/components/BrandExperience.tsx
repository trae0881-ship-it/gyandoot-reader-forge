import { Link } from "react-router-dom";
import { BookOpen, Compass, Sparkles, HeartHandshake, ShieldCheck, Library, Feather, ArrowRight } from "lucide-react";

/**
 * Premium publishing-brand experience blocks.
 * Bilingual (Hindi + English). Uses semantic tokens only.
 * Additive — safe to drop into any page.
 */

// ────────────────────────────────────────────────────────────
// Why GyandootNova Exists
// ────────────────────────────────────────────────────────────
export const WhyWeExist = () => (
  <section className="relative py-20 md:py-28 bg-background">
    <div className="container max-w-5xl px-4">
      <div className="text-center">
        <span className="section-eyebrow">Hamara Uddeshya · Our Purpose</span>
        <h2 className="mt-5 text-3xl md:text-5xl font-bold tracking-tight text-foreground">
          Kitaabein sirf panne nahi hain —
          <br className="hidden md:block" />
          <span className="text-primary"> vichaar, anubhav aur gyaan hain.</span>
        </h2>
        <p className="mt-6 mx-auto max-w-2xl text-lg md:text-xl leading-relaxed text-muted-foreground">
          Books are more than pages. They are ideas, experiences and wisdom that
          quietly shape our journey. GyandootNova exists to bring meaningful books
          closer to readers — a trusted space for knowledge, imagination and
          lifelong learning.
        </p>
        <div className="divider-gold mt-10" />
      </div>
    </div>
  </section>
);

// ────────────────────────────────────────────────────────────
// Reader Journey — four archetypes
// ────────────────────────────────────────────────────────────
const journeys = [
  {
    icon: Compass,
    title: "Curious Readers",
    hindi: "Jigyasu Pathak",
    line: "Naye vichaaron aur nayi duniyaon ki khoj mein.",
    href: "/books",
  },
  {
    icon: BookOpen,
    title: "Lifelong Learners",
    hindi: "Nirantar Sikhne Wale",
    line: "Har din thoda gyaan, thoda vistaar.",
    href: "/articles",
  },
  {
    icon: Sparkles,
    title: "Knowledge Seekers",
    hindi: "Gyaan Ki Or",
    line: "Prachin granthon ka gehra adhyayan.",
    href: "/books?category=adhyatm",
  },
  {
    icon: Feather,
    title: "Story Lovers",
    hindi: "Kathaon Ke Premi",
    line: "Kahaniyan jo sadiyon se saath chalti hain.",
    href: "/books?category=katha",
  },
];

export const ReaderJourney = () => (
  <section className="relative py-20 md:py-28 bg-gradient-cream">
    <div className="container max-w-6xl px-4">
      <div className="text-center max-w-2xl mx-auto">
        <span className="section-eyebrow">Aapki Padhne Ki Yatra · Your Reading Journey</span>
        <h2 className="mt-5 text-3xl md:text-4xl font-bold text-foreground">
          Har pathak ki apni raah hai
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Aap kaisi bhi yatra par hon, GyandootNova mein aapke liye kuch hai.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {journeys.map(({ icon: Icon, title, hindi, line, href }) => (
          <Link
            key={title}
            to={href}
            className="group surface-card p-8 flex flex-col"
          >
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-6 text-xl font-bold text-foreground">{title}</h3>
            <p className="mt-1 text-sm font-medium text-primary">{hindi}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground flex-1">
              {line}
            </p>
            <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              Explore <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

// ────────────────────────────────────────────────────────────
// Trust triad
// ────────────────────────────────────────────────────────────
const trustPillars = [
  {
    icon: Library,
    title: "Quality Books",
    hindi: "Utkrisht Sangraha",
    body: "Har pustak ka path evam sudhaar samay lekar kiya jata hai — jaldbaazi mein kuch nahi.",
  },
  {
    icon: HeartHandshake,
    title: "Reader First",
    hindi: "Pathak Sarvopari",
    body: "Aapka anubhav — shanti, sugamta aur bharosa — humari pehli prathmikta hai.",
  },
  {
    icon: ShieldCheck,
    title: "Authentic Sources",
    hindi: "Praamaanik Srot",
    body: "Har granth ke saath uska mool srot — bina badle, bina jodh-tod.",
  },
];

export const TrustPillars = () => (
  <section className="relative py-20 md:py-28 bg-background">
    <div className="container max-w-6xl px-4">
      <div className="text-center max-w-2xl mx-auto">
        <span className="section-eyebrow">Vishwas · Trust</span>
        <h2 className="mt-5 text-3xl md:text-4xl font-bold text-foreground">
          Ek publishing brand jispar aap bharosa kar sakein
        </h2>
      </div>

      <div className="mt-14 grid gap-8 md:grid-cols-3">
        {trustPillars.map(({ icon: Icon, title, hindi, body }) => (
          <div key={title} className="text-center px-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-xl font-bold text-foreground">{title}</h3>
            <p className="mt-1 text-sm font-medium text-primary">{hindi}</p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground max-w-xs mx-auto">
              {body}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ────────────────────────────────────────────────────────────
// Books-listing hero intro
// ────────────────────────────────────────────────────────────
export const BooksJourneyIntro = () => (
  <section className="relative py-16 md:py-24 bg-gradient-cream border-b border-border/60">
    <div className="container max-w-4xl px-4 text-center">
      <span className="section-eyebrow">Pustak Bhandaar · Our Library</span>
      <h1 className="mt-5 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
        Explore books for your journey
      </h1>
      <p className="mt-6 mx-auto max-w-2xl text-lg md:text-xl leading-relaxed text-muted-foreground">
        Ek shant, curated bhandaar — jahan har pustak soch samajh kar chuni gayi hai.
        Browse without pressure. Find something that stays with you.
      </p>
    </div>
  </section>
);

// ────────────────────────────────────────────────────────────
// Book-detail "Why this book matters" strip
// ────────────────────────────────────────────────────────────
interface WhyBookMattersProps {
  title?: string;
}
export const WhyBookMatters = ({ title }: WhyBookMattersProps) => (
  <section className="py-16 md:py-20 bg-gradient-cream border-y border-border/60">
    <div className="container max-w-5xl px-4">
      <div className="text-center mb-12">
        <span className="section-eyebrow">Is Pustak Ke Baare Mein · Why This Book Matters</span>
        <h2 className="mt-4 text-3xl md:text-4xl font-bold text-foreground">
          {title ? `Kya milega "${title}" mein` : "Kya milega is pustak mein"}
        </h2>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        {[
          {
            icon: BookOpen,
            head: "Gehri samajh",
            sub: "Deep understanding",
            body: "Sirf shabd nahi — bhaav, sandarbh aur artha ke saath padhein.",
          },
          {
            icon: Sparkles,
            head: "Naye drishtikon",
            sub: "New perspectives",
            body: "Prachin gyaan ko aaj ke jeevan mein utaarne ki drishti.",
          },
          {
            icon: HeartHandshake,
            head: "Shant sangat",
            sub: "A quiet companion",
            body: "Ek pustak jo baar-baar padhne par har baar kuch naya deti hai.",
          },
        ].map(({ icon: Icon, head, sub, body }) => (
          <div key={head} className="surface-card p-8">
            <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-lg font-bold text-foreground">{head}</h3>
            <p className="text-sm font-medium text-primary">{sub}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ────────────────────────────────────────────────────────────
// Mission · Vision · Values triad — for About page
// ────────────────────────────────────────────────────────────
export const MissionVisionValues = () => {
  const items = [
    {
      head: "Hamara Uddeshya",
      sub: "Our Mission",
      body: "Prachin gyaan ko aaj ke pathak tak — bina jaldi, bina milaawat — pahunchana.",
    },
    {
      head: "Hamari Drishti",
      sub: "Our Vision",
      body: "Ek aisi digital sthali jahan padhna ek shant, praamaanik aur bharoseband anubhav ho.",
    },
    {
      head: "Hamare Mulya",
      sub: "Our Values",
      body: "Praamaanikta, dhairya, pathak ke prati aadar aur srot ke prati shraddha.",
    },
  ];
  return (
    <section className="py-20 md:py-28 bg-gradient-cream border-y border-border/60">
      <div className="container max-w-6xl px-4">
        <div className="text-center max-w-2xl mx-auto">
          <span className="section-eyebrow">Hamari Neev · Our Foundation</span>
          <h2 className="mt-5 text-3xl md:text-4xl font-bold text-foreground">
            Jispar humara har nirnay tika hai
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((it) => (
            <div key={it.sub} className="surface-card p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{it.sub}</p>
              <h3 className="mt-3 text-2xl font-bold text-foreground">{it.head}</h3>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ────────────────────────────────────────────────────────────
// Continue-your-reading invitation — for ArticleDetail
// ────────────────────────────────────────────────────────────
export const ContinueReadingInvite = () => (
  <section className="py-16 md:py-20 bg-gradient-cream border-t border-border/60">
    <div className="container max-w-3xl px-4 text-center">
      <span className="section-eyebrow">Aage Padhein · Continue Your Reading Journey</span>
      <h2 className="mt-5 text-3xl md:text-4xl font-bold text-foreground">
        Ek vichaar samapt hua — agla intezaar mein hai
      </h2>
      <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
        Har lekh ek chhoti yatra hai. Agli yatra shuru karein — apni ruchi ke anusaar.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/articles"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          More articles <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/books"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          Browse books
        </Link>
      </div>
    </div>
  </section>
);
