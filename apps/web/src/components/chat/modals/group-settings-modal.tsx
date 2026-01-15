"use client";

import {
  Trash2,
  RefreshCw,
  Clock,
  Copy,
  Link as LinkIcon,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface GroupSettingsModalProps {
  show: boolean;
  setShow: (show: boolean) => void;
  selectedChatInfo: any;
  handleToggleJoinCodePrivacy: () => void;
  handleDeleteGroup: () => void;
  handlePromoteAdmin: (userId: string) => void;
}

export function GroupSettingsModal({
  show,
  setShow,
  selectedChatInfo,
  handleToggleJoinCodePrivacy,
  handleDeleteGroup,
  handlePromoteAdmin,
}: GroupSettingsModalProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isUpdatingExpiration, setIsUpdatingExpiration] = useState(false);

  if (!show || !selectedChatInfo) return null;

  const handleRegenerateLink = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/groups/${selectedChatInfo.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REGENERATE" }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Link regenerated successfully");
        // We'd ideally update parent state here, but for now force reload or just wait for next fetch cycle
        // Simple way: mutate the prop object in place if parent doesn't strictly prevent it,
        // OR trigger a refresh in parent. Parent polls or refetches on open/close?
        // Page.tsx has logic to fetch info when selectedChat changes.
        // Let's just encourage a reload or re-open.
        // Actually, better: window.location.reload() inside modal is bad UX.
        // We can assume the user will see the new code if they close/open.
        // But the modal is OPEN. We need to update the UI.
        // The parent passes `selectedChatInfo`. If we can't update it, the UI won't change.
        // But `selectedChatInfo` is state in `page.tsx`. Can we trigger a re-fetch?
        // Usually we'd pass `refreshInfo` prop.
        // For now, let's create a local display override? No, that's messy.
        // Let's reload the page for safety as this is a sensitive action, OR just accept it might lag until re-open.
        // Actually, page.tsx has a `fetch` in useEffect dependency on `selectedChat`.
        // Maybe just `window.location.reload()` is acceptable for MVP "Regenerate" as it finishes the task cleanly.
        // Let's try to update without full reload if possible.
        // The endpoint returns the new data.

        // Update the object in place (dirty but works for display if React works with it)
        selectedChatInfo.joinCode = data.joinCode;
        if (data.joinCodeExpiresAt)
          selectedChatInfo.joinCodeExpiresAt = data.joinCodeExpiresAt;
        else selectedChatInfo.joinCodeExpiresAt = null;
      } else {
        toast.error(data.error || "Failed to regenerate");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error regenerating link");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSetExpiration = async (minutes: number | null) => {
    setIsUpdatingExpiration(true);
    try {
      const res = await fetch(`/api/groups/${selectedChatInfo.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SET_EXPIRATION", expiresIn: minutes }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          minutes ? "Expiration updated" : "Link set to never expire",
        );
        selectedChatInfo.joinCodeExpiresAt = data.joinCodeExpiresAt;
      } else {
        toast.error("Failed to update expiration");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error updating expiration");
    } finally {
      setIsUpdatingExpiration(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-sidebar w-full max-w-md rounded-[2rem] border border-border p-8 shadow-2xl space-y-6 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-2xl font-black">{selectedChatInfo.name}</h2>
            <p className="text-xs text-muted">Group Settings & Members</p>
          </div>
          <button
            onClick={() => setShow(false)}
            className="cursor-pointer text-muted hover:text-primary"
          >
            ✕
          </button>
        </div>

        {selectedChatInfo.myRole === "OWNER" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-2xl">
              <div>
                <p className="text-sm font-bold">Private Join Code</p>
                <p className="text-[10px] text-muted-foreground">
                  Only you can see the join code.
                </p>
              </div>
              <button
                onClick={handleToggleJoinCodePrivacy}
                className={`w-12 h-6 rounded-full transition-all relative ${
                  selectedChatInfo.isJoinCodePrivate
                    ? "bg-primary"
                    : "bg-muted-foreground/30"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${
                    selectedChatInfo.isJoinCodePrivate ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold ml-1">
                Group Description
              </label>
              <div className="relative">
                <textarea
                  defaultValue={selectedChatInfo.description || ""}
                  placeholder="Add a description to your group..."
                  className="w-full bg-background border border-border rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none"
                  onBlur={async (e) => {
                    const newDescription = e.target.value;
                    if (newDescription === selectedChatInfo.description) return;

                    try {
                      const res = await fetch(
                        `/api/groups/${selectedChatInfo.id}/settings`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            chatId: selectedChatInfo.id,
                            description: newDescription,
                          }),
                        },
                      );
                      if (res.ok) {
                        toast.success("Description updated");
                        selectedChatInfo.description = newDescription;
                      } else {
                        toast.error("Failed to update description");
                      }
                    } catch (err) {
                      console.error(err);
                      toast.error("Error updating description");
                    }
                  }}
                />
                <div className="absolute bottom-3 right-3 text-[10px] text-muted-foreground pointer-events-none">
                  Click outside to save
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedChatInfo.joinCode && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-primary font-bold uppercase tracking-wider flex items-center gap-1">
                <LinkIcon className="w-3 h-3" />
                Invite Link
              </p>
              {selectedChatInfo.joinCodeExpiresAt && (
                <span className="text-[10px] text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Expires{" "}
                  {new Date(
                    selectedChatInfo.joinCodeExpiresAt,
                  ).toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 bg-background/50 border border-border rounded-xl p-2">
              <div className="flex-1 overflow-hidden">
                <p className="text-xs text-muted-foreground truncate font-mono">
                  {typeof window !== "undefined" ? window.location.origin : ""}
                  /invite/{selectedChatInfo.joinCode}
                </p>
              </div>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/invite/${selectedChatInfo.joinCode}`;
                  navigator.clipboard.writeText(url);
                  toast.success("Link copied!");
                }}
                className="p-2 hover:bg-background rounded-lg text-primary transition-colors"
                title="Copy Link"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleRegenerateLink}
                disabled={isRegenerating}
                className="flex items-center justify-center gap-2 text-[10px] font-bold bg-background border border-border py-2.5 rounded-xl hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isRegenerating ? "animate-spin" : ""}`}
                />
                Regenerate
              </button>

              <div className="relative group">
                <select
                  className="w-full h-full absolute opacity-0 cursor-pointer z-10"
                  onChange={(e) => {
                    const val =
                      e.target.value === "null" ? null : Number(e.target.value);
                    handleSetExpiration(val);
                  }}
                  disabled={isUpdatingExpiration}
                  value={selectedChatInfo.joinCodeExpiresAt ? "custom" : "null"}
                >
                  <option value="null">Never Verify</option>
                  <option value="60">1 Hour</option>
                  <option value="1440">1 Day</option>
                  <option value="10080">7 Days</option>
                  <option value="43200">30 Days</option>
                </select>
                <button className="w-full flex items-center justify-center gap-2 text-[10px] font-bold bg-background border border-border py-2.5 rounded-xl hover:bg-primary hover:text-white transition-colors">
                  <Clock className="w-3 h-3" />
                  {isUpdatingExpiration ? "Updating..." : "Set Expiration"}
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-primary/10">
              <button
                onClick={handleDeleteGroup}
                className="cursor-pointer w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Delete Group
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-xs font-bold text-muted uppercase tracking-wider">
            Members ({selectedChatInfo.participants.length})
          </p>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {selectedChatInfo.participants.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-background border border-border flex items-center justify-center text-[10px] font-bold overflow-hidden">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      p.username.substring(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{p.username}</span>
                    <span className="text-[10px] text-muted">{p.role}</span>
                  </div>
                </div>
                {selectedChatInfo.myRole === "OWNER" && p.role === "MEMBER" && (
                  <button
                    onClick={() => handlePromoteAdmin(p.id)}
                    className="cursor-pointer text-[10px] bg-sidebar border border-border px-2 py-1 rounded-md hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    Make Admin
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShow(false)}
          className="cursor-pointer w-full py-4 text-sm font-bold bg-background border border-border rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
