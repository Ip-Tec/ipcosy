"use client";

// import { usePaystackPayment } from "react-paystack";
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
  const handleUpgrade = async () => {
    if (!user?.email) {
      toast.error("User email is missing");
      return;
    }

    const toastId = toast.loading("Initializing payment...");

    try {
      const res = await fetch("/api/payment/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: premiumPrice * 100, // Price in kobo
          email: user.email,
          callbackUrl: `${window.location.origin}/profile` // Or wherever we want them back
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.authorization_url) {
        throw new Error(data.error || "Payment initialization failed");
      }

      // Redirect to Paystack via IpBok
      window.location.href = data.authorization_url;
      
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to start payment", { id: toastId });
    }
  };

  return (
    <button
      onClick={handleUpgrade}
      className={
        className ||
        "cursor-pointer w-full bg-primary text-white py-4 rounded-2xl font-black text-sm hover:opacity-90 shadow-lg transition-all active:scale-95"
      }
    >
      {children || "Upgrade Now"}
    </button>
  );
}
