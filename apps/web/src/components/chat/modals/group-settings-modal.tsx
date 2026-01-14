"use client";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";

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
  if (!show || !selectedChatInfo) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-sidebar w-full max-w-md rounded-[2rem] border border-border p-8 shadow-2xl space-y-6 animate-in zoom-in duration-300">
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
        )}

        {selectedChatInfo.joinCode && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-2">
            <p className="text-[10px] text-primary font-bold uppercase tracking-wider">
              Join Code
            </p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black tracking-widest">
                {selectedChatInfo.joinCode}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedChatInfo.joinCode);
                  toast.success("Code copied!");
                }}
                className="cursor-pointer text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-bold hover:opacity-90"
              >
                Copy
              </button>
            </div>
            <div className="pt-4 border-t border-border">
              <button
                onClick={handleDeleteGroup}
                className="cursor-pointer w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Delete Group Permanently
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
                  <div className="h-8 w-8 rounded-full bg-background border border-border flex items-center justify-center text-[10px] font-bold">
                    {p.username.substring(0, 1).toUpperCase()}
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
