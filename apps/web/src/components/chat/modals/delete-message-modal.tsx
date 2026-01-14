"use client";

import { X } from "lucide-react";

interface DeleteMessageModalProps {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteMessageModal({
  show,
  onConfirm,
  onCancel,
}: DeleteMessageModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background border border-border rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Delete Message
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              This action cannot be undone
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <p className="text-sm text-foreground mb-6">
          Are you sure you want to delete this message? It will be removed for
          everyone in the conversation.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-sidebar hover:bg-black/5 dark:hover:bg-white/5 text-foreground font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
