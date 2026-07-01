import Layout from "@/components/layout/Layout";
import { BookOpen, FileText, Headphones, Heart, Monitor, Users } from "lucide-react";
import useSEO from "@/hooks/useSEO";

const services = [
  {
    icon: BookOpen,
    title: "Browser में सीधा पाठ",
    description:
      "कोई app नहीं, कोई download नहीं। जो mobile या laptop पास है, उसी पर login कीजिए और अगली पंक्ति वहीं से पढ़िए जहाँ कल छोड़ी थी। Font, रंग, bookmark — सब आपकी पसंद के अनुसार।",
  },
  {
    icon: FileText,
    title: "जीवन-सूत्र लेख",
    description:
      "गुस्सा, चिंता, रिश्तों की उलझन — शास्त्रों में इनका क्या हल है, वो सरल भाषा में लेखों की शक्ल में। हर हफ़्ते कुछ नया, बिना विज्ञापन।",
  },
  {
    icon: Headphones,
    title: "सुनने वाले सत्संग",
    description:
      "पढ़ने का समय नहीं मिलता? कोई बात नहीं — गाड़ी में, टहलते वक़्त, या रसोई में काम करते हुए भी सुन लीजिए। छोटी-छोटी बैठकें, बड़ा असर।",
  },
  {
    icon: Monitor,
    title: "प्रकाशकों के लिए मंच",
    description:
      "आपके पास कोई अनमोल पांडुलिपि है और उसे लोगों तक पहुँचाना चाहते हैं? हमारी संपादकीय टीम मदद करेगी — proofread से लेकर publish तक।",
  },
  {
    icon: Heart,
    title: "दान से चलता एक हिस्सा",
    description:
      "बहुत सारे ग्रंथ हम मुफ़्त रखते हैं ताकि पैसा किसी के भी आड़े न आए। यह संभव आपके योगदान से होता है — जितना बन पड़े, उतना।",
  },
  {
    icon: Users,
    title: "पाठकों का अपना गोल",
    description:
      "WhatsApp, email — जहाँ भी सुविधा हो, जुड़िए। कोई नया ग्रंथ चाहिए तो बताइए, कोई शब्द अटक गया तो पूछिए। जवाब उसी दिन।",
  },
];

const Services = () => {
  useSEO({
    title: "हमारी सेवाएँ — Online ग्रंथ, लेख और सत्संग | GyandootNova",
    description:
      "GyandootNova क्या-क्या देती है — online reader, लेख, सत्संग, प्रकाशन सहायता और पाठक-समुदाय। सब कुछ एक जगह।",
    canonical: "/services",
  });

  return (
    <Layout>
      <main className="container py-16">
        <section className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">
            क्या-क्या मिलता है यहाँ
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            केवल किताबें नहीं — पढ़ने, सुनने, समझने और पूछने की पूरी सुविधा एक ही जगह।
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
