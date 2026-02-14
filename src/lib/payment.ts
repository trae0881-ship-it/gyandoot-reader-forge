import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export type PaymentGateway = "razorpay" | "paypal";

interface CreateOrderParams {
  amount: number;
  type: "donation" | "purchase";
  gateway?: PaymentGateway;
  book_id?: string;
  name?: string;
  email?: string;
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
}

export async function initiatePayment(
  params: CreateOrderParams,
  onSuccess: () => void,
  onFailure: (error: string) => void
) {
  const gateway = params.gateway || "razorpay";

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      onFailure("Please log in to continue");
      return;
    }

    const res = await supabase.functions.invoke("create-order", {
      body: { ...params, gateway },
    });

    if (res.error || !res.data) {
      onFailure(res.error?.message || "Failed to create order");
      return;
    }

    const orderData = res.data;

    if (gateway === "razorpay") {
      await handleRazorpayCheckout(orderData, params, session.access_token, onSuccess, onFailure);
    } else if (gateway === "paypal") {
      handlePaypalCheckout(orderData, params, session.access_token, onSuccess, onFailure);
    }
  } catch (err: any) {
    onFailure(err.message || "Payment failed");
  }
}

async function handleRazorpayCheckout(
  orderData: any,
  params: CreateOrderParams,
  accessToken: string,
  onSuccess: () => void,
  onFailure: (error: string) => void
) {
  await loadRazorpayScript();

  const options = {
    key: orderData.key_id,
    amount: orderData.amount,
    currency: orderData.currency,
    name: "GyandootNova",
    description: params.type === "purchase" ? "Book Purchase" : "Donation",
    order_id: orderData.order_id,
    handler: async (response: any) => {
      // Verify payment server-side
      const verifyRes = await supabase.functions.invoke("verify-payment", {
        body: {
          gateway: "razorpay",
          order_id: orderData.order_id,
          payment_id: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          type: params.type,
        },
      });

      if (verifyRes.error || !verifyRes.data?.success) {
        onFailure("Payment verification failed");
      } else {
        onSuccess();
      }
    },
    prefill: {
      name: params.name || "",
      email: params.email || "",
    },
    theme: { color: "#B71C1C" },
    modal: {
      ondismiss: () => onFailure("Payment cancelled"),
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}

function handlePaypalCheckout(
  orderData: any,
  params: CreateOrderParams,
  accessToken: string,
  onSuccess: () => void,
  onFailure: (error: string) => void
) {
  if (!orderData.approve_url) {
    onFailure("PayPal approval URL not received");
    return;
  }

  // Open PayPal in a popup
  const popup = window.open(orderData.approve_url, "paypal-checkout", "width=500,height=700");

  // Poll for popup close
  const timer = setInterval(async () => {
    if (popup?.closed) {
      clearInterval(timer);
      // Verify payment after popup closes
      const verifyRes = await supabase.functions.invoke("verify-payment", {
        body: {
          gateway: "paypal",
          order_id: orderData.order_id,
          type: params.type,
        },
      });

      if (verifyRes.error || !verifyRes.data?.success) {
        onFailure("Payment verification failed or was cancelled");
      } else {
        onSuccess();
      }
    }
  }, 1000);
}
