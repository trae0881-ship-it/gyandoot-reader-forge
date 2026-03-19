import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, CheckCircle, Loader2, User, Mail, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { initiatePayment, type PaymentGateway } from "@/lib/payment";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const PRESET_AMOUNTS = [100, 500, 1000, 5000];

const Donate = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState<number>(500);
  const [name, setName] = useState(user?.user_metadata?.display_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [donated, setDonated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gateway, setGateway] = useState<PaymentGateway>("razorpay");

  const handleDonate = async () => {
    if (!amount || amount < 1) {
      toast({ title: "Invalid Amount", description: "Please enter a valid donation amount.", variant: "destructive" });
      return;
    }
    if (!name.trim()) {
      toast({ title: "Name Required", description: "Kripya apna naam darj karein.", variant: "destructive" });
      return;
    }
    if (!email.trim()) {
      toast({ title: "Email Required", description: "Kripya apna email darj karein.", variant: "destructive" });
      return;
    }
    setLoading(true);
    await initiatePayment(
      { amount, type: "donation", gateway, name: name.trim(), email: email.trim() },
      () => {
        setDonated(true);
        setLoading(false);
      },
      (error) => {
        if (error !== "Payment cancelled") {
          toast({ title: "Payment Failed", description: error, variant: "destructive" });
        }
        setLoading(false);
      }
    );
  };

  if (donated) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container max-w-lg text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-primary" />
            <h1 className="mt-6 font-serif text-3xl font-bold">Dhanyavaad! 🙏</h1>
            <p className="mt-3 text-muted-foreground">
              Aapka ₹{amount.toLocaleString("en-IN")} ka daan prapt ho gaya. Aapki udaarta ko pranam. May your kindness bring blessings.
            </p>
            {email && (
              <p className="mt-2 text-sm text-muted-foreground">Receipt sent to <strong>{email}</strong></p>
            )}
            <Button className="mt-6" onClick={() => { setDonated(false); }}>Phir Se Daan Karein</Button>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12">
        <div className="container max-w-lg">
          <div className="text-center mb-8">
            <Heart className="mx-auto h-10 w-10 text-primary" />
            <h1 className="mt-4 font-serif text-3xl font-bold">Daan Karein</h1>
            <p className="mt-2 text-muted-foreground">
              Adhyatmik gyan ke prasar mein sahyog karein. Aapka har yogdan mahatvapurna hai.
            </p>
            {!user && (
              <p className="mt-3 text-sm text-muted-foreground">
                <Link to="/auth" className="text-primary hover:underline inline-flex items-center gap-1">
                  <LogIn className="h-3.5 w-3.5" /> Sign in
                </Link>{" "}
                karein taaki daan history profile mein dikhaye — ya bina login ke bhi daan kar sakte hain.
              </p>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Daan Rashi Chunein</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Preset amounts */}
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map((a) => (
                  <Button
                    key={a}
                    variant={amount === a ? "default" : "outline"}
                    onClick={() => setAmount(a)}
                  >
                    ₹{a}
                  </Button>
                ))}
              </div>

              {/* Custom amount */}
              <div>
                <Label>Custom Amount (₹)</Label>
                <Input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="mt-1"
                  placeholder="Apni rashi darj karein"
                />
              </div>

              {/* Donor details */}
              <div className="space-y-4 pt-1">
                <p className="text-sm font-medium text-muted-foreground">Aapki Jaankari (Optional)</p>
                <div>
                  <Label className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Naam
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aapka naam (optional)"
                    className="mt-1"
                    disabled={!!user}
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Receipt ke liye email (optional)"
                    className="mt-1"
                    disabled={!!user}
                  />
                </div>
              </div>

              {/* Payment gateway */}
              <div>
                <Label className="mb-2 block">Payment Method</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={gateway === "razorpay" ? "default" : "outline"}
                    onClick={() => setGateway("razorpay")}
                    className="flex-1"
                  >
                    Razorpay
                  </Button>
                  <Button
                    type="button"
                    variant={gateway === "paypal" ? "default" : "outline"}
                    onClick={() => setGateway("paypal")}
                    className="flex-1"
                  >
                    PayPal
                  </Button>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full gap-2"
                onClick={handleDonate}
                disabled={amount < 1 || loading}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <><Heart className="h-4 w-4" /> ₹{amount.toLocaleString("en-IN")} Daan Karein</>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                🔒 Secure payment via {gateway === "razorpay" ? "Razorpay" : "PayPal"} · Login required nahi
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Donate;
