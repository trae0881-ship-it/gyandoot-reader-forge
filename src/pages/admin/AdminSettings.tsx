import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, MessageCircle, Facebook, Instagram, Youtube, Linkedin, Flame, BookOpen, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";

const SOCIAL_KEYS = [
  { key: "whatsapp_number", label: "WhatsApp Number", icon: MessageCircle, placeholder: "+91 98765 43210", hint: "With country code, e.g. +919876543210" },
  { key: "facebook_url", label: "Facebook URL", icon: Facebook, placeholder: "https://facebook.com/gyandootnova", hint: "Full Facebook page URL" },
  { key: "instagram_url", label: "Instagram URL", icon: Instagram, placeholder: "https://instagram.com/gyandootnova", hint: "Full Instagram profile URL" },
  { key: "youtube_url", label: "YouTube URL", icon: Youtube, placeholder: "https://youtube.com/@gyandootnova", hint: "Full YouTube channel URL" },
  { key: "linkedin_url", label: "LinkedIn URL", icon: Linkedin, placeholder: "https://linkedin.com/company/gyandootnova", hint: "Full LinkedIn profile or company URL" },
];

const URGENCY_KEYS = [
  { key: "urgency_enabled", label: "Banner Enabled", placeholder: "true", hint: "true या false — banner on/off" },
  { key: "urgency_coupon", label: "Coupon Code", placeholder: "BHAKTI20", hint: "Banner में दिखेगा (coupon table में भी active होना चाहिए)" },
  { key: "urgency_discount_label", label: "Discount Label", placeholder: "20% off", hint: "जैसे: 20% off / ₹100 off" },
  { key: "urgency_ends_at", label: "Ends At (ISO)", placeholder: "2026-07-05T23:59:59+05:30", hint: "खाली छोड़ें = आज रात 11:59 तक auto" },
  { key: "urgency_link", label: "Link", placeholder: "/books", hint: "Coupon पर click करने पर कहाँ ले जाए" },
];

const BOOK_KEYS = [
  { key: "book_free_chapter_note", label: "Free Chapter Note (Book Detail)", placeholder: "पहला अध्याय 100% मुफ़्त है — Login कीजिए और पढ़कर देखिए, पसंद आए तभी खरीदिए।", hint: "Paid book के Table of Contents के ऊपर दिखता है। खाली = hide.", multiline: true },
];

const INVOICE_KEYS: { key: string; label: string; placeholder: string; hint: string; multiline?: boolean; type?: "text" | "logo" }[] = [
  { key: "invoice_business_name", label: "Business Name", placeholder: "GyandootNova", hint: "Invoice header में दिखेगा" },
  { key: "invoice_business_address", label: "Business Address", placeholder: "123 Ashram Road, Varanasi, UP 221001, India", hint: "Multi-line allowed", multiline: true },
  { key: "invoice_gstin", label: "GSTIN", placeholder: "22AAAAA0000A1Z5", hint: "15 chars — regex validated. खाली छोड़ दें अगर registered नहीं हैं।" },
  { key: "invoice_pan", label: "PAN", placeholder: "AAAPL1234C", hint: "10 chars — regex validated. Optional." },
  { key: "invoice_logo_url", label: "Logo", placeholder: "https://gyandootnova.in/logo.png", hint: "PNG/JPG/WEBP · max 2 MB · 512×512 recommended. Upload या public HTTPS URL paste करें।", type: "logo" },
  { key: "invoice_footer_note", label: "Footer Note", placeholder: "Thank you for supporting original scriptures.", hint: "Invoice के नीचे दिखेगा", multiline: true },
];

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const LOGO_ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

const AdminSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("key, value");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      settings.forEach((s) => { map[s.key] = s.value ?? ""; });
      setValues(map);
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async (updates: { key: string; value: string }[]) => {
      for (const { key, value } of updates) {
        const { error } = await supabase
          .from("settings")
          .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "Settings saved", description: "Social links updated successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    const updates = [...SOCIAL_KEYS, ...URGENCY_KEYS, ...BOOK_KEYS, ...INVOICE_KEYS].map(({ key }) => ({ key, value: values[key] ?? "" }));
    mutation.mutate(updates);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="font-serif text-3xl font-bold">Site Settings</h1>
      </div>

      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Social Media & Contact Links</CardTitle>
            <CardDescription>
              These links appear in the header (WhatsApp) and footer of your website. Leave blank to hide.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading settings...</p>
            ) : (
              SOCIAL_KEYS.map(({ key, label, icon: Icon, placeholder, hint }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {label}
                  </Label>
                  <Input
                    value={values[key] ?? ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                  />
                  <p className="text-xs text-muted-foreground">{hint}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-secondary" /> Urgency Banner (Top Strip)
            </CardTitle>
            <CardDescription>
              ऊपर scroll पर दिखने वाली "आज की डील" strip। Coupon code, discount label और countdown end-time यहाँ से बदलें।
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              URGENCY_KEYS.map(({ key, label, placeholder, hint }) => (
                <div key={key} className="space-y-1.5">
                  <Label>{label}</Label>
                  <Input
                    value={values[key] ?? ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                  />
                  <p className="text-xs text-muted-foreground">{hint}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Book Detail — Free Chapter Note
            </CardTitle>
            <CardDescription>
              Paid books के Table of Contents के ऊपर दिखने वाला promo message। खाली छोड़ने पर hide हो जाएगा।
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              BOOK_KEYS.map(({ key, label, placeholder, hint }) => (
                <div key={key} className="space-y-1.5">
                  <Label>{label}</Label>
                  <Textarea
                    value={values[key] ?? ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">{hint}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Invoice Template
            </CardTitle>
            <CardDescription>
              Purchase invoices पर दिखने वाले business details — GSTIN, address, logo, footer note। खाली फ़ील्ड्स hide हो जाएँगी।
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              INVOICE_KEYS.map(({ key, label, placeholder, hint, multiline }) => (
                <div key={key} className="space-y-1.5">
                  <Label>{label}</Label>
                  {multiline ? (
                    <Textarea
                      value={values[key] ?? ""}
                      onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      rows={3}
                    />
                  ) : (
                    <Input
                      value={values[key] ?? ""}
                      onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                    />
                  )}
                  <p className="text-xs text-muted-foreground">{hint}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Button
          className="w-full sm:w-auto"
          onClick={handleSave}
          disabled={mutation.isPending || isLoading}
        >
          {mutation.isPending ? "Saving..." : "Save All Settings"}
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
