import Layout from "@/components/layout/Layout";
import { BookOpen, Users, Globe, Award } from "lucide-react";
import useSEO from "@/hooks/useSEO";

const About = () => {
  useSEO({
    title: "About Us — The Digital Home of Ancient Scriptures",
    description:
      "The story, purpose and team behind GyandootNova (Gyandoot Nova) — bringing old manuscripts to today's readers. Learn how we started and where we are heading.",
    canonical: "/about",
  });

  return (
    <Layout>
      <main className="container py-12 md:py-[72px] lg:py-24">
        <section className="text-center mb-16 md:mb-24">
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
            Our Story
          </span>
          <h1 className="mt-4 font-serif text-4xl md:text-5xl font-bold text-primary">
            A quiet home for timeless scriptures
          </h1>
          <p className="mt-6 prose-reading text-muted-foreground">
            An honest effort to bring the scriptures locked away in grandparents' trunks
            back into every reader's hands — with care, calm, and clarity.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-12 md:gap-16 mb-16 md:mb-24 max-w-5xl mx-auto">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-5">Why we started</h2>
            <p className="text-muted-foreground leading-[1.8] mb-4">
              A few years ago we opened an old family cupboard and found the pages of the
              Ramayana yellowed, the Upanishads' bindings broken, and several books lost to
              termites. It struck us that this is the reality in most homes — there are
              readers, but readable, trustworthy scriptures are hard to come by.
            </p>
            <p className="text-muted-foreground leading-[1.8]">
              GyandootNova was born from that thought — any reader, anywhere, anytime,
              should be able to pick up their phone, log in, and start reading a reliable text.
            </p>
          </div>
          <div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-5">Where we are headed</h2>
            <p className="text-muted-foreground leading-[1.8] mb-4">
              Over the next few years we want to build a digital library where the Vedangas,
              stotras, Puranas and modern commentaries all live in one place — in Hindi,
              Sanskrit and English. No ad clutter, no distractions.
            </p>
            <p className="text-muted-foreground leading-[1.8]">
              The dream is simple — a true text, a faithful translation, and a calm reading
              experience for every reader. The rest can wait.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6 mb-16 md:mb-24 max-w-5xl mx-auto">
          {[
            { icon: BookOpen, label: "Titles available", value: "500+" },
            { icon: Users, label: "Readers joined", value: "24,000+" },
            { icon: Globe, label: "Countries reached", value: "35+" },
            { icon: Award, label: "Team experience", value: "12+ years" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-7 rounded-2xl bg-card border border-border/70 shadow-card transition-all hover:-translate-y-1 hover:shadow-lift"
            >
              <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
              What we've built for you
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Small, thoughtful choices — so reading a scripture feels calm again.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <div className="p-7 rounded-2xl border border-border/70 bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-lift">
              <h3 className="font-serif text-lg font-semibold text-foreground mb-3">A calm reader</h3>
              <p className="text-sm text-muted-foreground leading-[1.8]">
                Adjustable font size, gentle dark mode, bookmarks, resume from the last page —
                everything you need, in the browser, no app download required.
              </p>
            </div>
            <div className="p-7 rounded-2xl border border-border/70 bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-lift">
              <h3 className="font-serif text-lg font-semibold text-foreground mb-3">Trusted translations</h3>
              <p className="text-sm text-muted-foreground leading-[1.8]">
                Every text is first reviewed by Sanskrit scholars and then rendered into simple,
                readable language. The original verse always sits alongside so you can check.
              </p>
            </div>
            <div className="p-7 rounded-2xl border border-border/70 bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-lift">
              <h3 className="font-serif text-lg font-semibold text-foreground mb-3">A living community</h3>
              <p className="text-sm text-muted-foreground leading-[1.8]">
                A question, a suggestion, or a text you want us to add — one WhatsApp message
                is enough. Twelve new titles were added last month on reader requests alone.
              </p>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default About;
