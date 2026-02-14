import Layout from "@/components/layout/Layout";
import { BookOpen, FileText, Headphones, Heart, Monitor, Users } from "lucide-react";

const services = [
  {
    icon: BookOpen,
    title: "Online Book Reading",
    description:
      "Access our complete library of spiritual books directly in your browser. Our custom reader supports font resizing, dark/light mode, bookmarking, and chapter-by-chapter navigation — no downloads needed.",
  },
  {
    icon: FileText,
    title: "Spiritual Articles & Blogs",
    description:
      "Stay inspired with regularly published articles covering meditation, self-realization, dharma, and practical spirituality. All content is freely accessible.",
  },
  {
    icon: Headphones,
    title: "Discourses & Programs",
    description:
      "Explore recorded discourses and structured spiritual programs designed to guide you on your inner journey, from beginner to advanced levels.",
  },
  {
    icon: Monitor,
    title: "Digital Publication",
    description:
      "We publish sacred texts in digital formats optimized for web reading. Authors and spiritual teachers can reach a global audience through our platform.",
  },
  {
    icon: Heart,
    title: "Donation & Seva",
    description:
      "Support the dissemination of spiritual knowledge through donations. Every contribution helps us publish more books and reach more seekers worldwide.",
  },
  {
    icon: Users,
    title: "Community Engagement",
    description:
      "Connect with like-minded seekers, participate in discussions, and be part of a growing spiritual community committed to conscious living.",
  },
];

const Services = () => {
  return (
    <Layout>
      <main className="container py-16">
        <section className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">
            Our Services
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the range of spiritual services and resources GyandootNova offers to support your journey of self-discovery.
          </p>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div
              key={service.title}
              className="group p-8 rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
            >
              <service.icon className="h-10 w-10 text-primary mb-4 transition-transform group-hover:scale-110" />
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">{service.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
            </div>
          ))}
        </section>
      </main>
    </Layout>
  );
};

export default Services;
