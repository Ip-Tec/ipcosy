"use client";

import { Loader2 } from "lucide-react";

interface CreateGroupModalProps {
  show: boolean;
  setShow: (show: boolean) => void;
  newGroupName: string;
  setNewGroupName: (name: string) => void;
  handleCreateGroup: () => void;
  isCreatingGroup: boolean;
}

export function CreateGroupModal({
  show,
  setShow,
  newGroupName,
  setNewGroupName,
  handleCreateGroup,
  isCreatingGroup,
}: CreateGroupModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-sidebar w-full max-w-sm rounded-[2rem] border border-border p-8 shadow-2xl space-y-6 animate-in zoom-in duration-300">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black">Create New Group</h2>
          <p className="text-xs text-muted">
            Start a private encrypted community.
          </p>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group Name (e.g. Family Chat)"
            className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            autoFocus
          />
          <div className="flex gap-3">
            <button
              onClick={() => setShow(false)}
              className="cursor-pointer flex-1 py-4 text-sm font-bold text-muted hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || isCreatingGroup}
              className="cursor-pointer flex-1 py-4 text-sm font-bold bg-primary text-white rounded-2xl shadow-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isCreatingGroup && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isCreatingGroup ? "Creating..." : "Create"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
