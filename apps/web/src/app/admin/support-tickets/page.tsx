"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  Send,
  Loader2,
  MessageSquare,
  Filter,
} from "lucide-react";

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
  user: {
    id: string;
    name?: string;
    email?: string;
    username?: string;
  };
  responses: SupportResponse[];
}

interface SupportResponse {
  id: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
  user: {
    id: string;
    name?: string;
    email?: string;
  };
}

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export default function AdminSupportTicketsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [filterStatus, setFilterStatus] = useState("OPEN");

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchTickets();
    }
  }, [sessionStatus, filterStatus]);

  const fetchTickets = async () => {
    try {
      const query = filterStatus ? `?status=${filterStatus}` : "";
      const res = await fetch(`/api/admin/support-tickets${query}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
        if (data.length > 0 && !selectedTicket) {
          setSelectedTicket(data[0]);
          setNewStatus(data[0].status);
        }
      } else if (res.status === 403) {
        toast.error("Admin access required");
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Failed to load support tickets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyMessage.trim() || !selectedTicket) return;

    setIsReplying(true);
    try {
      const res = await fetch(`/api/admin/support-tickets/${selectedTicket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: replyMessage,
          status: newStatus,
        }),
      });

      if (res.ok) {
        toast.success("Response sent!");
        setReplyMessage("");

        // Refresh the selected ticket
        const ticketRes = await fetch(
          `/api/admin/support-tickets/${selectedTicket.id}`
        );
        if (ticketRes.ok) {
          const updated = await ticketRes.json();
          setSelectedTicket(updated);
          setNewStatus(updated.status);

          // Update in list
          setTickets(
            tickets.map((t) =>
              t.id === updated.id
                ? { ...updated, status: updated.status }
                : t
            )
          );
        }
      } else {
        const text = await res.text();
        toast.error(text || "Failed to send response");
      }
    } catch (error) {
      console.error("Error sending response:", error);
      toast.error("Failed to send response");
    } finally {
      setIsReplying(false);
    }
  };

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="flex h-screen flex-col bg-background text-foreground items-center justify-center">
        <p className="text-lg font-semibold">Please sign in to access this page</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col bg-background text-foreground">
        <div className="flex items-center gap-4 border-b border-border bg-sidebar p-4 shadow-sm">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border bg-sidebar p-4 shadow-sm">
          <ChevronLeft className="w-3 h-3" />
          Admin Panel
        <h1 className="text-xl font-bold">Support Tickets</h1>
      </div>

      <div className="flex-1 overflow-hidden p-4 md:p-8 max-w-6xl mx-auto w-full">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Support Tickets</h2>
            <p className="text-muted-foreground">
              There are no {filterStatus ? filterStatus.toLowerCase() : ""} support
              tickets at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Tickets List */}
            <div className="lg:col-span-1 bg-sidebar rounded-2xl border border-border overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border space-y-4">
                <h2 className="font-semibold flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter by Status
                </h2>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                        filterStatus === s
                          ? "bg-primary text-white"
                          : "bg-background text-muted-foreground hover:bg-background/80"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setNewStatus(ticket.status);
                    }}
                    className={`w-full text-left p-4 border-b border-border hover:bg-background/50 transition-colors ${
                      selectedTicket?.id === ticket.id
                        ? "bg-primary/10 border-l-4 border-l-primary"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm line-clamp-2">
                          {ticket.subject}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ticket.user.email}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
                          ticket.status === "OPEN"
                            ? "bg-blue-500/10 text-blue-600"
                            : ticket.status === "IN_PROGRESS"
                              ? "bg-yellow-500/10 text-yellow-600"
                              : ticket.status === "RESOLVED"
                                ? "bg-green-500/10 text-green-600"
                                : "bg-gray-500/10 text-gray-600"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket Detail */}
            {selectedTicket && (
              <div className="lg:col-span-2 bg-sidebar rounded-2xl border border-border overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-border">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-lg font-bold">{selectedTicket.subject}</h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        From:{" "}
                        <span className="font-semibold">
                          {selectedTicket.user.email}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(selectedTicket.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full text-center ${
                          selectedTicket.status === "OPEN"
                            ? "bg-blue-500/10 text-blue-600"
                            : selectedTicket.status === "IN_PROGRESS"
                              ? "bg-yellow-500/10 text-yellow-600"
                              : selectedTicket.status === "RESOLVED"
                                ? "bg-green-500/10 text-green-600"
                                : "bg-gray-500/10 text-gray-600"
                        }`}
                      >
                        {selectedTicket.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Original Message */}
                  <div className="bg-background/50 rounded-lg p-4 border border-border">
                    <p className="text-xs text-muted-foreground font-semibold mb-2">
                      User&apos;s Issue
                    </p>
                    <p className="text-sm">{selectedTicket.message}</p>
                  </div>

                  {/* Responses */}
                  {selectedTicket.responses.length > 0 && (
                    <div className="space-y-4">
                      {selectedTicket.responses.map((response) => (
                        <div
                          key={response.id}
                          className={`rounded-lg p-4 border ${
                            response.isAdmin
                              ? "bg-blue-500/5 border-blue-200 dark:border-blue-900/30"
                              : "bg-background/50 border-border"
                          }`}
                        >
                          <p className="text-xs text-muted-foreground font-semibold mb-2">
                            {response.isAdmin ? "🔵 Admin Response" : "User"}
                          </p>
                          <p className="text-sm">{response.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(response.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reply Form */}
                <div className="p-6 border-t border-border space-y-4">
                  <div>
                    <label className="text-xs font-semibold block mb-2">
                      Update Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <form onSubmit={handleReply} className="flex gap-3">
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your response..."
                      rows={3}
                      className="flex-1 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                      disabled={isReplying}
                    />
                    <button
                      type="submit"
                      disabled={isReplying || !replyMessage.trim()}
                      className="bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 font-semibold flex items-center gap-2 h-fit"
                    >
                      {isReplying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Send
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
