import Layout from "@/components/layout/Layout";
import { BookOpen, Users, Globe, Award } from "lucide-react";
import useSEO from "@/hooks/useSEO";

const About = () => {
  useSEO({
    title: "हमारे बारे में — GyandootNova | प्राचीन ग्रंथों का डिजिटल घर",
    description:
      "GyandootNova की शुरुआत, सोच और वो टीम जो पुरानी पांडुलिपियों को आज के पाठक तक पहुँचा रही है — जानिए हमारी कहानी।",
    canonical: "/about",
  });

  return (
    <Layout>
      <main className="container py-16">
        <section className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">
            हमारी कहानी
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            जो ग्रंथ दादी-नानी की पेटी में बंद हो गए थे, उन्हें फिर से हर हाथ तक पहुँचाने की
            एक ईमानदार कोशिश।
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">क्यों शुरू किया</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              कुछ साल पहले घर की पुरानी अलमारी खोली तो देखा — रामायण के पन्ने पीले हो चले हैं,
              उपनिषदों की जिल्द टूटी है, कई किताबें दीमक की भेंट चढ़ गई हैं। तभी लगा, यही हाल
              हर घर में है। पढ़ने वाले लोग हैं, पर पढ़ने-लायक़ ग्रंथ मिलना मुश्किल।
            </p>
            <p className="text-muted-foreground leading-relaxed">
              GyandootNova इसी सोच से बनी — कि किसी भी पाठक को कहीं भी, कभी भी, एक भरोसे वाला
              पाठ चाहिए तो बस मोबाइल उठाए, login करे, और पढ़ना शुरू कर दे।
            </p>
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">आगे क्या सोचते हैं</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              अगले कुछ बरसों में हम एक ऐसा डिजिटल भंडार बनाना चाहते हैं जहाँ वेदांग, स्तोत्र,
              पुराण और आधुनिक चिंतकों के लेख — सब एक जगह हों। हिंदी, संस्कृत, अंग्रेज़ी — तीनों
              में। बिना विज्ञापन की भरमार, बिना ध्यान भटकाए।
            </p>
            <p className="text-muted-foreground leading-relaxed">
              सपना छोटा है — हर पाठक तक सच्चा पाठ, सही अनुवाद और शांत reading experience।
              बाक़ी सब बाद में।
            </p>
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { icon: BookOpen, label: "उपलब्ध ग्रंथ", value: "500+" },
            { icon: Users, label: "जुड़े पाठक", value: "24,000+" },
            { icon: Globe, label: "देश-विदेश", value: "35+" },
            { icon: Award, label: "टीम का अनुभव", value: "12 वर्ष+" },
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
            आपके लिए क्या रखा है
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-border">
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">आराम से पढ़ने की सुविधा</h3>
              <p className="text-sm text-muted-foreground">
                Font छोटा-बड़ा, रात वाला हल्का रंग, bookmark, आख़िरी पन्ने पर वापस — जो चाहिए
                वो सब बिना ऐप डाउनलोड किए, browser में ही।
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border">
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">भरोसेमंद अनुवाद</h3>
              <p className="text-sm text-muted-foreground">
                हर ग्रंथ को संस्कृत के जानकार पहले जाँचते हैं, फिर हिंदी में सरल भाषा में
                उतारा जाता है। मूल श्लोक हमेशा साथ रहता है, ताकि आप ख़ुद मिला सकें।
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border">
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">एक जीता-जागता समुदाय</h3>
              <p className="text-sm text-muted-foreground">
                सवाल हो, सुझाव हो या किसी ग्रंथ की माँग — WhatsApp पर एक message काफ़ी है।
                पाठकों की माँग पर ही पिछले महीने 12 नए ग्रंथ जोड़े हैं।
              </p>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default About;
