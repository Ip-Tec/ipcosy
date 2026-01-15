"use client";

import { usePaystackPayment } from "react-paystack";
import { toast } from "sonner";

import { ReactNode } from "react";

export default function UpgradeButton({
  user,
  premiumPrice,
  children,
  className,
}: {
  user: any;
  premiumPrice: number;
  children?: ReactNode;
  className?: string;
}) {
  const config = {
    reference: new Date().getTime().toString(),
    email: user?.email,
    amount: premiumPrice * 100,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
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
          toast.error("Payment Error: Public Key missing");
          return;
        }
        if (!config.email || config.email.includes("example.com")) {
          toast.error("Payment Error: User email invalid");
          return;
        }
        if (!config.metadata.userId) {
          toast.error("Payment Error: User ID missing. Try refreshing.");
          return;
        }
        initializePayment({ onSuccess, onClose });
      }}
      className={
        className ||
        "cursor-pointer w-full bg-primary text-white py-4 rounded-2xl font-black text-sm hover:opacity-90 shadow-lg transition-all active:scale-95"
      }
    >
      {children || "Upgrade Now"}
    </button>
  );
}
