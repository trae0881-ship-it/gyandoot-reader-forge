import Layout from "@/components/layout/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import useSEO from "@/hooks/useSEO";

const faqs = [
  {
    q: "How can I read books on GyandootNova?",
    a: "All books on GyandootNova are readable online directly in your browser. Simply visit the book page, select a chapter, and start reading. Our reader supports font size adjustments, dark/light mode, and tracks your reading progress.",
  },
  {
    q: "Are the books available for download?",
    a: "No, books are available for online reading only. This helps us protect the authors' content and ensure the best reading experience on our platform.",
  },
  {
    q: "Are there free books available?",
    a: "Yes! Many of our books are completely free to read. Look for the 'Free' badge on book cards. Premium books require a one-time purchase.",
  },
  {
    q: "How do I purchase a paid book?",
    a: "Click on the book you wish to read, then click 'Purchase to Read'. You'll be directed to our secure Razorpay payment gateway. Once payment is confirmed, the full book becomes accessible in your account.",
  },
  {
    q: "Can I donate to support GyandootNova?",
    a: "Absolutely! Visit our Donate page to contribute any amount. Your donations help us publish more spiritual books and make knowledge accessible to all seekers.",
  },
  {
    q: "Do I need an account to read books?",
    a: "Free preview chapters are accessible without an account. However, to read full books (free or purchased), you'll need to create a free account.",
  },
  {
    q: "What types of content does GyandootNova publish?",
    a: "We publish spiritual books, articles, discourses, and program guides covering topics like meditation, self-realization, dharma, yoga, and conscious living.",
  },
  {
    q: "How can I contact GyandootNova for queries?",
    a: "You can reach us via email at contact@gyandootnova.com or use the contact form on our Contact page. We typically respond within 24-48 hours.",
  },
  {
    q: "Is there a refund policy for purchased books?",
    a: "Yes, we offer refunds within 7 days of purchase if you haven't read more than 20% of the book. Please visit our Refund & Cancellation Policy page for details.",
  },
  {
    q: "Can I suggest a book or topic?",
    a: "We welcome suggestions! Please reach out to us through the Contact page with your recommendations, and our editorial team will review them.",
  },
];

const FAQ = () => {
  useSEO({
    title: "FAQ — GyandootNova Spiritual Books & Reading Platform",
    description: "Find answers about reading books online, purchases, payments, account issues & more at GyandootNova. Dharmik granth FAQ.",
    canonical: "/faq",
  });

  return (
    <Layout>
      <main className="container py-16 max-w-3xl mx-auto">
        <section className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-muted-foreground">
            Find answers to common questions about GyandootNova.
          </p>
        </section>

        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium text-foreground">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>
    </Layout>
  );
};

export default FAQ;
