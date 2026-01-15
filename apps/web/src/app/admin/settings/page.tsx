"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSettingsPage() {
  const [price, setPrice] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.premiumPrice) setPrice(data.premiumPrice);
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSavePrice = async () => {
    if (!price) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ premiumPrice: Number(price) }),
      });
      if (res.ok) {
        toast.success("Price updated successfully!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update price");
      }
    } catch (e) {
      toast.error("Error updating price");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-64 w-full rounded-[2rem]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black">System Settings</h1>
        <p className="text-muted">Configure global platform parameters.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Price Management */}
        <section className="bg-sidebar rounded-[2rem] border border-border p-8 shadow-2xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Premium Pricing</h2>
            <p className="text-xs text-muted">
              Set the cost for premium subscriptions (NGN).
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-primary transition-transform group-focus-within:scale-110">
                ₦
              </span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full bg-background border border-border rounded-2xl pl-12 pr-5 py-4 text-lg font-black focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="450"
              />
            </div>

            <div className="bg-primary/5 rounded-xl p-4 text-xs text-muted leading-relaxed">
              <span className="font-bold text-primary">Note:</span> Changing
              this price affects all new subscriptions immediately. Existing
              recurring subscriptions may vary depending on the payment provider
              logic.
            </div>

            <button
              onClick={handleSavePrice}
              disabled={isSaving}
              className="cursor-pointer w-full bg-primary text-white py-4 rounded-2xl font-black hover:opacity-90 disabled:opacity-50 transition-all shadow-lg active:scale-95 disabled:scale-100"
            >
              {isSaving ? "Saving Configuration..." : "Update Pricing"}
            </button>
          </div>
        </section>

        {/* Placeholder for future settings */}
        <section className="bg-sidebar/50 rounded-[2rem] border border-border border-dashed p-8 shadow-sm space-y-4 flex flex-col justify-center items-center text-center opacity-50">
          <div className="text-4xl">🚧</div>
          <h2 className="font-bold">More Settings Coming Soon</h2>
          <p className="text-xs text-muted max-w-[200px]">
            Future updates will include email templates, notification defaults,
            and feature toggles.
          </p>
        </section>
      </div>
    </div>
  );
}
