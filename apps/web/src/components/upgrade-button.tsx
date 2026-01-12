"use client";

import { usePaystackPayment } from "react-paystack";
import { toast } from "sonner";

export default function UpgradeButton({
  user,
  premiumPrice,
}: {
  user: any;
  premiumPrice: number;
}) {
  const config = {
    reference: new Date().getTime().toString(),
    email: user?.email || "customer@example.com",
    amount: premiumPrice * 100,
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || "",
    // Fallback URL for safety, though this component should only mount on client
    callback_url: `${typeof window !== "undefined" ? window.location.origin : ""}/api/callback/paystack`,
    metadata: {
      userId: user?.id,
      custom_fields: [
        {
          display_name: "Upgrade",
          variable_name: "upgrade",
          value: "premium",
        },
      ],
    },
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = () => {
    toast.success("Payment Successful! Upgrading or refreshing...");
    window.location.reload();
  };

  const onClose = () => {
    console.log("Payment closed");
  };

  return (
    <button
      onClick={() => {
        if (!config.publicKey) {
          toast.error("Paystack Public Key is missing!");
          return;
        }
        initializePayment({ onSuccess, onClose });
      }}
      className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm hover:opacity-90 shadow-lg transition-all active:scale-95"
    >
      Upgrade Now with Paystack
    </button>
  );
}
