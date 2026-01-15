"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSupportPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/reports")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setReports(data);
      })
      .catch(() => toast.error("Failed to load reports"))
      .finally(() => setLoading(false));
  }, []);

  const handleResolve = async (reportId: string, status: string) => {
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status }),
      });
      if (res.ok) {
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status } : r)),
        );
        toast.success(`Report marked as ${status}`);
      }
    } catch (e) {
      toast.error("Failed to update report");
    }
  };

  const handleBanUser = async (userId: string) => {
    // Reuse existing admin user ban API
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isBanned: true }),
      });
      if (res.ok) {
        toast.success("User banned successfully");
        // Update local report UI to show user is now banned
        setReports((prev) =>
          prev.map((r) =>
            r.reported.id === userId
              ? { ...r, reported: { ...r.reported, isBanned: true } }
              : r,
          ),
        );
      }
    } catch (e) {
      toast.error("Failed to ban user");
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black">Support Tickets</h1>
        <p className="text-muted">Review and resolve user reports.</p>
      </div>

      <div className="space-y-4">
        {loading && <Skeleton className="h-64 rounded-xl" />}

        {!loading && reports.length === 0 && (
          <div className="text-center py-12 rounded-2xl bg-sidebar border border-border">
            <p className="text-4xl mb-2">✅</p>
            <p className="text-sm font-bold">All caught up!</p>
            <p className="text-xs text-muted">No pending reports.</p>
          </div>
        )}

        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-sidebar border border-border p-6 rounded-2xl space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${report.status === "PENDING" ? "bg-yellow-500/20 text-yellow-500" : "bg-green-500/20 text-green-500"}`}
                  >
                    {report.status}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-bold text-lg">
                  Report against {report.reported?.name || "Unknown"}
                </h3>
                <p className="text-sm text-foreground/80 bg-background/50 p-3 rounded-lg border border-border/50">
                  "{report.reason}"
                </p>
              </div>
              {report.reported?.isBanned && (
                <span className="text-red-500 font-bold text-xs uppercase border border-red-500/50 px-2 py-1 rounded">
                  BANNED
                </span>
              )}
            </div>

            <div className="flex justify-between items-center border-t border-border pt-4">
              <div className="text-xs text-muted">
                Reported by:{" "}
                <span className="font-bold">
                  {report.reporter?.name || report.reporter?.email}
                </span>
              </div>
              <div className="flex gap-2">
                {report.status === "PENDING" && (
                  <button
                    onClick={() => handleResolve(report.id, "RESOLVED")}
                    className="px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg text-xs font-bold transition-all"
                  >
                    MARK RESOLVED
                  </button>
                )}
                {!report.reported?.isBanned && (
                  <button
                    onClick={() => handleBanUser(report.reported.id)}
                    className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold transition-all"
                  >
                    BAN USER
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
