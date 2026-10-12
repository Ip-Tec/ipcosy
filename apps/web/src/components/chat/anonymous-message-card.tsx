"use client";

import { useRef } from "react";
import { Download, Share2, ShieldIcon } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { SenderDetails } from "./sender-details";
import { AttachmentPreview } from "./attachment-preview";

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
    locationSource?: string;
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

          {fileUrl && <div className="relative z-10"><AttachmentPreview url={fileUrl} /></div>}

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

          <SenderDetails metadata={metadata} />
        </div>
      </div>
    </>
  );
}
