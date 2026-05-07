import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Mail } from "lucide-react";

const STORAGE_KEY = "admin_otp_verified";

export function isAdminOtpValid(): boolean {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const { expires_at } = JSON.parse(raw);
    return new Date(expires_at) > new Date();
  } catch { return false; }
}

interface Props { onVerified: () => void; userEmail?: string }

const AdminOtpGate = ({ onVerified, userEmail }: Props) => {
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const sendOtp = async () => {
    setSending(true);
    const { data, error } = await supabase.functions.invoke("admin-otp-send");
    setSending(false);
    if (error || (data as any)?.error) {
      toast({ title: "Failed to send OTP", description: (data as any)?.error || error?.message, variant: "destructive" });
      return;
    }
    setSent(true);
    toast({ title: "OTP sent", description: `Check ${userEmail || "your email"} for the code.` });
  };

  useEffect(() => { sendOtp(); /* auto-send on mount */ /* eslint-disable-next-line */ }, []);

  const verify = async () => {
    if (code.length !== 6) return;
    setVerifying(true);
    const { data, error } = await supabase.functions.invoke("admin-otp-verify", { body: { code } });
    setVerifying(false);
    if (error || (data as any)?.error) {
      toast({ title: "Verification failed", description: (data as any)?.error || error?.message, variant: "destructive" });
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ expires_at: (data as any).expires_at }));
    toast({ title: "Verified", description: "Welcome, admin." });
    onVerified();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          <CardTitle className="font-serif text-2xl">Admin Verification</CardTitle>
          <CardDescription>
            <Mail className="inline h-4 w-4 mr-1" />
            Enter the 6-digit code sent to {userEmail || "your email"}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button className="w-full" onClick={verify} disabled={verifying || code.length !== 6}>
            {verifying ? "Verifying..." : "Verify & Continue"}
          </Button>
          <Button variant="ghost" className="w-full" onClick={sendOtp} disabled={sending}>
            {sending ? "Sending..." : sent ? "Resend OTP" : "Send OTP"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOtpGate;
