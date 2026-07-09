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
      <main className="container py-16">
        <section className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">
            Our Story
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            An honest effort to bring the scriptures locked away in grandparents' trunks
            back into every reader's hands.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Why we started</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              A few years ago we opened an old family cupboard and found the pages of the
              Ramayana yellowed, the Upanishads' bindings broken, and several books lost to
              termites. It struck us that this is the reality in most homes — there are
              readers, but readable, trustworthy scriptures are hard to come by.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              GyandootNova was born from that thought — any reader, anywhere, anytime,
              should be able to pick up their phone, log in, and start reading a reliable text.
            </p>
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Where we are headed</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Over the next few years we want to build a digital library where the Vedangas,
              stotras, Puranas and modern commentaries all live in one place — in Hindi,
              Sanskrit and English. No ad clutter, no distractions.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The dream is simple — a true text, a faithful translation, and a calm reading
              experience for every reader. The rest can wait.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { icon: BookOpen, label: "Titles available", value: "500+" },
            { icon: Users, label: "Readers joined", value: "24,000+" },
            { icon: Globe, label: "Countries reached", value: "35+" },
            { icon: Award, label: "Team experience", value: "12+ years" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-6 rounded-xl bg-muted/50">
              <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="mb-16">
          <h2 className="font-serif text-2xl font-bold text-foreground text-center mb-8">
            What we've built for you
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-border">
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">A calm reader</h3>
              <p className="text-sm text-muted-foreground">
                Adjustable font size, gentle dark mode, bookmarks, resume from the last page —
                everything you need, in the browser, no app download required.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border">
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Trusted translations</h3>
              <p className="text-sm text-muted-foreground">
                Every text is first reviewed by Sanskrit scholars and then rendered into simple,
                readable language. The original verse always sits alongside so you can check.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border">
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">A living community</h3>
              <p className="text-sm text-muted-foreground">
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
