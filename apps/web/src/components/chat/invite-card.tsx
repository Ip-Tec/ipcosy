"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Users, AlertCircle, CheckCircle2 } from "lucide-react";

interface InviteCardProps {
  code: string;
  groupInfo: {
    id: string;
    name: string;
    description?: string;
    membersCount: number;
    previewMembers: {
      name: string | null;
      username: string | null;
      image: string | null;
    }[];
    isExpired: boolean;
  };
}

export function InviteCard({ code, groupInfo }: InviteCardProps) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch("/api/groups/join-via-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to join group");
      }

      if (data.message === "Already a member") {
        toast.info("You are already a member of this group");
        router.push(`/chat/${data.chatId}`);
        return;
      }

      toast.success("Successfully joined the group!");
      router.push(`/chat/${data.chatId}`);
    } catch (error: any) {
      toast.error(error.message);
      setJoining(false);
    }
  };

  if (groupInfo.isExpired) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <div className="w-full max-w-md p-8 text-center bg-card border border-border rounded-3xl shadow-xl space-y-4">
          <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black">Invite Link Expired</h1>
          <p className="text-muted-foreground">
            This invite link is no longer valid. Please ask the group admin for
            a new link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-xl overflow-hidden">
        {/* Header Pattern */}
        <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 w-full relative">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
              backgroundSize: "16px 16px",
            }}
          ></div>
        </div>

        <div className="px-8 pb-8 -mt-12 flex flex-col items-center text-center space-y-6">
          {/* Group Icon Placeholder - could be an image if valid */}
          <div className="w-24 h-24 bg-background rounded-3xl border-4 border-background shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-primary/10 rounded-2xl flex items-center justify-center text-3xl font-black text-primary uppercase">
              {groupInfo.name.substring(0, 2)}
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black">{groupInfo.name}</h1>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground font-medium bg-secondary/50 py-1.5 px-4 rounded-full w-fit mx-auto">
              <Users className="w-4 h-4" />
              <span>{groupInfo.membersCount} members</span>
            </div>
            {groupInfo.description && (
              <p className="text-sm text-muted-foreground max-w-sm mx-auto line-clamp-3">
                {groupInfo.description}
              </p>
            )}
          </div>

          {/* Member Preview */}
          {groupInfo.previewMembers.length > 0 && (
            <div className="flex items-center justify-center -space-x-3 py-2">
              {groupInfo.previewMembers.map((m, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-background overflow-hidden bg-secondary relative z-10"
                >
                  {m.image ? (
                    <Image
                      src={m.image}
                      alt={m.username || "User"}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold bg-primary/20 text-primary">
                      {m.username?.substring(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
              {groupInfo.membersCount > 5 && (
                <div className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground relative z-0">
                  +{groupInfo.membersCount - 5}
                </div>
              )}
            </div>
          )}

          <div className="w-full pt-4">
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              {joining ? (
                <span className="animate-pulse">Joining Group...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Join Group
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-muted-foreground font-medium">
        Secured by IPCosy
      </p>
    </div>
  );
}
