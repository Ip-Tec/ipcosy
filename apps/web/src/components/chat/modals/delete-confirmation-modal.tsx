"use client";

import { Loader2, Trash2 } from "lucide-react";

interface DeleteConfirmationModalProps {
  show: boolean;
  setShow: (show: boolean) => void;
  selectedChatInfo: any;
  confirmDeleteGroup: () => void;
  isDeleting: boolean;
}

export function DeleteConfirmationModal({
  show,
  setShow,
  selectedChatInfo,
  confirmDeleteGroup,
  isDeleting,
}: DeleteConfirmationModalProps) {
  if (!show || !selectedChatInfo) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-sidebar w-full max-w-sm rounded-[2.5rem] border border-red-500/20 p-10 shadow-3xl space-y-8 animate-in zoom-in duration-300 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
          <Trash2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-foreground">Delete Group?</h2>
          <p className="text-sm text-muted px-2">
            Are you sure you want to permanently delete{" "}
            <span className="font-bold text-foreground">
              "{selectedChatInfo.name}"
            </span>
            ? All messages and members will be removed. This action is
            irreversible.
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={confirmDeleteGroup}
            disabled={isDeleting}
            className="cursor-pointer w-full py-5 text-sm font-bold bg-red-500 text-white rounded-[1.5rem] shadow-lg shadow-red-500/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isDeleting ? "Deleting..." : "Delete Permanently"}</span>
          </button>
          <button
            onClick={() => setShow(false)}
            className="cursor-pointer w-full py-5 text-sm font-bold text-muted hover:bg-black/5 dark:hover:bg-white/5 rounded-[1.5rem] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
