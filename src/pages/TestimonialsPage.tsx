import Layout from "@/components/layout/Layout";
import { Star } from "lucide-react";
import useSEO from "@/hooks/useSEO";

const testimonials = [
  {
    name: "Arjun Sharma",
    location: "New Delhi, India",
    text: "GyandootNova has transformed my spiritual journey. The online reader is so convenient — I can read sacred texts anywhere, anytime. The collection is truly remarkable.",
    rating: 5,
  },
  {
    name: "Priya Patel",
    location: "Mumbai, India",
    text: "The quality of publications and the ease of access is unmatched. I love the dark mode feature for late-night reading sessions. A truly divine platform.",
    rating: 5,
  },
  {
    name: "David Wilson",
    location: "London, UK",
    text: "As someone living abroad, GyandootNova has been my bridge to Indian spiritual wisdom. The articles are insightful and the books are beautifully presented online.",
    rating: 5,
  },
  {
    name: "Meera Joshi",
    location: "Pune, India",
    text: "I've been using GyandootNova for over a year now. The variety of spiritual content — from meditation guides to philosophical discourses — keeps me coming back.",
    rating: 4,
  },
  {
    name: "Rajesh Kumar",
    location: "Varanasi, India",
    text: "What I appreciate most is that many books are free. This platform truly embodies the spirit of knowledge sharing. The donation option lets me give back too.",
    rating: 5,
  },
  {
    name: "Sarah Johnson",
    location: "New York, USA",
    text: "The online book reader is smooth and distraction-free. I can track my progress across chapters which helps me maintain a consistent reading practice.",
    rating: 5,
  },
];

const TestimonialsPage = () => {
  return (
    <Layout>
      <main className="container py-16">
        <section className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">
            What Our Readers Say
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hear from spiritual seekers who have found wisdom and inspiration through GyandootNova.
          </p>
        </section>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="p-6 rounded-xl border border-border bg-card">
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className={`h-4 w-4 ${j < t.rating ? "fill-secondary text-secondary" : "text-muted"}`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">"{t.text}"</p>
              <div>
                <p className="font-semibold text-foreground text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.location}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  );
};

export default TestimonialsPage;
