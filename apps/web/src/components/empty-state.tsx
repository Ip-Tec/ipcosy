"use client";

import { CopyIcon, MessageSquare, Share2, Upload } from "lucide-react";
import { toast } from "sonner";

interface EmptyStateProps {
  username: string;
}

export function EmptyState({ username }: EmptyStateProps) {
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${username}`
      : `https://ipcosy.vercel.app/${username}`;
  const shareText = `Start an anonymous conversation with ${username}! 🤫\n\n${shareUrl}`;

  const socials = [
    {
      name: "WhatsApp",
      color: "bg-[#25D366]",
      url: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
    },
    {
      name: "X (Twitter)",
      color: "bg-black",
      textColor: "text-white",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      color: "bg-[#1877F2]",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: "Instagram",
      color: "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]",
      isSocialAction: true, // Use web share
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.069-4.85.069-3.204 0-3.584-.012-4.849-.069-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.069-1.644-.069-4.849 0-3.204.013-3.583.069-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      name: "TikTok",
      color: "bg-black",
      isSocialAction: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v6.16c0 2.52-1.12 4.84-3.11 6.19-2.09 1.41-4.71 1.72-7.12.87-2.45-.87-4.33-3.08-4.94-5.61-.59-2.43.08-5.07 1.8-6.98 1.68-1.87 4.29-2.75 6.78-2.29V10.6c-2.34-.72-5.08.38-6.29 2.53-1.26 2.25-.66 5.16 1.42 6.8 2.37 1.86 5.85 1.34 7.64-1.14.9-1.25 1.39-2.76 1.39-4.31V.02z" />
        </svg>
      ),
    },
    {
      name: "Share via...",
      color: "bg-zinc-700",
      textColor: "text-white",
      isSocialAction: true,
      icon: <Upload className="w-5 h-5" />,
    },
  ];

  const handleSocialAction = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "IPCosy Anonymous Message",
          text: `Start an anonymous conversation with ${username}! 🤫`,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 max-w-sm mx-auto h-full min-h-[50vh]">
      <div className="bg-primary/10 p-6 rounded-3xl mb-2 animate-bounce-slow">
        <MessageSquare className="w-12 h-12 text-primary" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold">No messages yet?</h3>
        <p className="text-sm text-muted-foreground">
          Share your anonymous link on social media to start the conversation!
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full">
        {socials.map((s) => (
          <button
            key={s.name}
            onClick={() =>
              s.isSocialAction
                ? handleSocialAction()
                : window.open(s.url, "_blank")
            }
            className={`${s.color} ${s.textColor || "text-white"} cursor-pointer p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-transform active:scale-95 hover:opacity-90 shadow-lg`}
          >
            {s.icon}
            {s.name}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-[10px] text-muted-foreground w-full break-all font-mono">
        {shareUrl}
        <CopyIcon className="w-5 h-5 cursor-pointer" onClick={handleCopy} />
      </div>
    </div>
  );
}
