"use client";

import { useRef, useState } from "react";
import { Download, Share2, ShieldIcon } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";

export interface AnonymousMessageCardProps {
  content: string;
  time: string;
  username: string;
  metadata?: {
    deviceType?: string;
    deviceOS?: string;
    browser?: string;
    city?: string;
    country?: string;
  } | null;
  fileUrl?: string;
}

export function AnonymousMessageCard({
  content,
  time,
  username,
  metadata,
  fileUrl,
}: AnonymousMessageCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [showMetadata, setShowMetadata] = useState(false);

  const downloadCard = async () => {
    if (cardRef.current === null) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true });
      const link = document.createElement("a");
      link.download = `ipcosy-message-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Card downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download image");
    }
  };

  const shareCard = async () => {
    if (cardRef.current === null) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `ipcosy-message-${Date.now()}.png`, {
        type: "image/png",
      });

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: "Anonymous Message from IP~Cosy",
          text: `Check out this anonymous message I received on IP~Cosy!`,
        });
      } else {
        toast.error("Web Share API not supported on this browser");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to share image");
    }
  };

  return (
    <>
      <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
        <div
          ref={cardRef}
          className="w-full bg-gradient-to-br from-primary/10 via-background to-purple-500/10 border-2 border-primary/20 rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl"></div>

          <div className="flex justify-between items-start relative z-10">
            <div className="bg-primary/10 px-3 py-1 rounded-full text-[10px] font-black text-primary uppercase tracking-widest">
              Anonymous Message
            </div>
            <ShieldIcon className="w-5 h-5 text-primary opacity-50" />
          </div>

          <p className="text-lg font-bold leading-relaxed text-foreground italic relative z-10 py-4 break-words break-all">
            "{content}"
          </p>

          {fileUrl && (
            <div className="relative z-10 rounded-2xl overflow-hidden border border-primary/20 bg-black/5 dark:bg-white/5">
              {fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img
                  src={fileUrl}
                  alt="Shared file"
                  className="w-full max-h-64 object-cover cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => window.open(fileUrl, "_blank")}
                />
              ) : (
                <div
                  className="p-6 flex flex-col items-center gap-2 cursor-pointer hover:bg-black/10 transition-colors"
                  onClick={() => window.open(fileUrl, "_blank")}
                >
                  <div className="text-4xl">📄</div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    View Document
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-primary/10 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">
                IP
              </div>
              <div>
                <p className="text-[10px] font-bold text-foreground">
                  To: {username}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-primary tracking-tighter">
                IP~COSY
              </p>
              <p className="text-[8px] text-muted-foreground uppercase tracking-widest">
                {window.location.origin}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={downloadCard}
              className="flex items-center justify-center p-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-all active:scale-95 shadow-sm"
              title="Download Image"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={shareCard}
              className="flex items-center justify-center p-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-all active:scale-95 shadow-sm"
              title="Share Message"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {metadata && (
            <div className="w-full">
              <button
                onClick={() => setShowMetadata(!showMetadata)}
                className="w-full py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <ShieldIcon className="w-3 h-3" />
                {showMetadata
                  ? "Hide Sender Data"
                  : "View Sender Data (Premium)"}
              </button>

              {showMetadata && (
                <div className="mt-2 p-4 bg-sidebar rounded-2xl border border-border/50 text-[10px] space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-center opacity-70">
                    <span className="font-bold uppercase tracking-tight">
                      Device Type
                    </span>
                    <span className="font-medium">
                      {metadata.deviceType || "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center opacity-70">
                    <span className="font-bold uppercase tracking-tight">
                      OS / System
                    </span>
                    <span className="font-medium">
                      {metadata.deviceOS || "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center opacity-70">
                    <span className="font-bold uppercase tracking-tight">
                      Browser
                    </span>
                    <span className="font-medium">
                      {metadata.browser || "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center opacity-70">
                    <span className="font-bold uppercase tracking-tight">
                      Location
                    </span>
                    <span className="font-medium">
                      {metadata.city && metadata.country
                        ? `${metadata.city}, ${metadata.country}`
                        : "Hidden"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
