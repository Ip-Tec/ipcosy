"use client";

import { X } from "lucide-react";
import { AnonymousMessageCard } from "../anonymous-message-card";

interface MessageCardModalProps {
  show: boolean;
  onClose: () => void;
  message: {
    text: string;
    time: string;
    alias: string;
    metadata?: any;
    sender: "me" | "them";
  } | null;
  username: string;
}

export function MessageCardModal({
  show,
  onClose,
  message,
  username,
}: MessageCardModalProps) {
  if (!show || !message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="w-full">
          <AnonymousMessageCard
            content={message.text}
            time={message.time}
            username={username}
            metadata={message.metadata}
          />
        </div>
      </div>
    </div>
  );
}
