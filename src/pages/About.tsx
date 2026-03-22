import Layout from "@/components/layout/Layout";
import { BookOpen, Users, Globe, Award } from "lucide-react";
import useSEO from "@/hooks/useSEO";

const About = () => {
  useSEO({
    title: "About GyandootNova — Dharmik Granth & Spiritual Books Publisher",
    description: "Learn about GyandootNova — India's trusted platform for dharmik granth, spiritual books like Vishnu Sahasraname, Bhagwat Geeta & Ramayana. Our mission, vision & story.",
    canonical: "/about",
  });

  return (
    <Layout>
      <main className="container py-16">
        {/* Hero */}
        <section className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">
            About GyandootNova
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A premier spiritual publication platform dedicated to illuminating seekers with sacred wisdom, transformative books, and enlightening programs.
          </p>
        </section>

        {/* Mission */}
        <section className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              GyandootNova was founded with a singular vision — to make timeless spiritual knowledge accessible to every seeker, regardless of geography or language. We believe that sacred wisdom should flow freely, like a river of light, reaching every corner of the world.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Through our carefully curated collection of books, articles, and programs, we aim to bridge the gap between ancient wisdom and modern seekers, offering a platform where spiritual growth meets digital convenience.
            </p>
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Our Vision</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We envision a world where spiritual knowledge transcends boundaries — where anyone with a thirst for truth can access profound teachings at their fingertips. Our books are available to read online, making spiritual learning seamless and immediate.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              GyandootNova strives to be the most trusted digital destination for spiritual publications, fostering a global community of conscious readers and seekers.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { icon: BookOpen, label: "Books Published", value: "50+" },
            { icon: Users, label: "Readers Worldwide", value: "10,000+" },
            { icon: Globe, label: "Countries Reached", value: "25+" },
            { icon: Award, label: "Years of Service", value: "5+" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-6 rounded-xl bg-muted/50">
              <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </section>

        {/* What We Offer */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl font-bold text-foreground text-center mb-8">What We Offer</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-border">
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Online Book Reading</h3>
              <p className="text-sm text-muted-foreground">
                Read spiritual books directly on our platform with a clean, distraction-free reader. Features include font size control, dark mode, and reading progress tracking.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border">
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Articles & Discourses</h3>
              <p className="text-sm text-muted-foreground">
                Explore insightful articles, spiritual discourses, and transformative programs curated by experienced spiritual teachers.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border">
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Community & Support</h3>
              <p className="text-sm text-muted-foreground">
                Join a growing community of seekers. Support our mission through donations and help spread sacred knowledge to those in need.
              </p>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default About;
