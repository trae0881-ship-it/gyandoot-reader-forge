import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { initiatePayment, type PaymentGateway } from "@/lib/payment";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const PRESET_AMOUNTS = [100, 500, 1000, 5000];

const Donate = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number>(500);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [donated, setDonated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gateway, setGateway] = useState<PaymentGateway>("razorpay");

  const handleDonate = async () => {
    if (!user) {
      toast({ title: "कृपया पहले लॉगिन करें", description: "Donation के लिए login ज़रूरी है।", variant: "destructive" });
      navigate("/auth");
      return;
    }
    setLoading(true);
    await initiatePayment(
      { amount, type: "donation", gateway, name, email },
      () => {
        setDonated(true);
        setLoading(false);
      },
      (error) => {
        toast({ title: "Payment Failed", description: error, variant: "destructive" });
        setLoading(false);
      }
    );
  };

  if (donated) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container max-w-lg text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h1 className="mt-6 font-serif text-3xl font-bold">Thank You!</h1>
            <p className="mt-3 text-muted-foreground">
              Your generous donation of ₹{amount} has been received. May your kindness bring blessings.
            </p>
            <Button className="mt-6" onClick={() => setDonated(false)}>Donate Again</Button>
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
            <h1 className="mt-4 font-serif text-3xl font-bold">Make a Donation</h1>
            <p className="mt-2 text-muted-foreground">
              Support the spread of spiritual knowledge. Every contribution matters.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Donation Amount</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map((a) => (
                  <Button key={a} variant={amount === a ? "default" : "outline"} onClick={() => setAmount(a)}>
                    ₹{a}
                  </Button>
                ))}
              </div>
              <div>
                <Label>Custom Amount (₹)</Label>
                <Input type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label>Your Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" className="mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="mt-1" />
              </div>

              {/* Payment Gateway Selection */}
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

              <Button size="lg" className="w-full" onClick={handleDonate} disabled={amount < 1 || loading}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <><Heart className="mr-2 h-4 w-4" /> Donate ₹{amount}</>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Secure payment via {gateway === "razorpay" ? "Razorpay" : "PayPal"}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Donate;
