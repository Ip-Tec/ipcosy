"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSession, signIn } from "next-auth/react";
import {
  Heart,
  MessageSquare,
  Smile,
  Flame,
  Zap,
  TrendingUp,
  Send,
  ShieldCheck,
  Dices,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import Image from "next/image";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

interface UserInfo {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  isPremium: boolean;
}

interface SuggestionCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  suggestions: string[];
}

const CATEGORIES: SuggestionCategory[] = [
  {
    id: "romantic",
    label: "Romantic",
    icon: <Heart className="w-4 h-4 text-red-500 fill-red-500" />,
    suggestions: [
      "You're always on my mind.",
      "I've been thinking about you all day.",
      "I've had a crush on you for a while...",
      "Every time I see you, my day gets better.",
      "You have the most beautiful smile I've ever seen.",
      "If I could take you anywhere, where would you want to go?",
      "Being with you feels like home.",
      "Every moment spent with you is my favorite.",
      "I don't need a perfect day, just one with you in it.",
      "You make my heart race in the best way.",
      "I never believed in soulmates until I met you.",
      "The thought of you makes everything else fade away.",
      "You're the reason I look forward to tomorrow.",
      "I'd choose you, over and over, in every lifetime.",
      "You're not just in my heart — you are my heart.",
      "Every love song suddenly makes sense when I think of you.",
    ],
  },
  {
    id: "flirty",
    label: "Flirty",
    icon: <Smile className="w-4 h-4 text-orange-500" />,
    suggestions: [
      "I like the way you look at me.",
      "Is it hot in here or is it just you?",
      "I wasn't looking for anyone… but then I found you.",
      "I wasn't looking for anyone… but then I found you.",
      "Every time you smile, I forget what I was about to say.",
      "You must be trouble… because I can't stop thinking about you.",
      "Do you believe in love at first sight, or should I walk by again?",
      "I was going to say something sweet, but you're already sweet enough.",
      "You make ordinary moments feel like something out of a romantic movie.",
      "You make ordinary moments feel like something out of a romantic movie.",
      "If I had a star for every time you crossed my mind, I'd own the galaxy.",
      "Are you a magician? Because whenever I look at you, everyone else disappears.",
    ],
  },
  {
    id: "friendly",
    label: "Friendly",
    icon: <MessageSquare className="w-4 h-4 text-blue-500" />,
    suggestions: [
      "Let's hang out soon!",
      "Can't wait to catch up again soon!",
      "Hope you're having an amazing day!",
      "I really appreciate our friendship.",
      "You always know how to make me smile.",
      "You've got such a positive vibe, it's contagious.",
      "Hey! Just wanted to say you're a really cool person.",
      "I'm really glad we're friends — you mean a lot to me.",
      "You're one of those people who just makes life better.",
      "Always great talking with you — you make things feel easy.",
    ],
  },
  {
    id: "happy",
    label: "Happy",
    icon: <Smile className="w-4 h-4 text-yellow-500" />,
    suggestions: [
      "Keep being awesome!",
      "Sending you good vibes!",
      "Smile, it's a beautiful day!",
      "Your energy is so contagious!",
      "You make everyone around you so happy.",
      "Stay bright, the world needs your light!",
      "Happiness follows you everywhere you go.",
      "You make ordinary moments feel extraordinary.",
      "Keep shining — you inspire everyone around you.",
      "Your positivity is like sunshine on a cloudy day.",
    ],
  },
  {
    id: "naughty",
    label: "Naughty",
    icon: <Flame className="w-4 h-4 text-purple-500" />,
    suggestions: [
      "What's your biggest secret?",
      "I like the way you look at me.",
      "Tell me something you've never told anyone else.",
      "Every time I think of you, it's in a way that makes me blush…",
      "I've been thinking about you in a way I probably shouldn't...",
      "You've been on my mind lately… and not in the most innocent way.",
      "You keep crossing my mind in ways that feel a little too tempting…",
      "I probably shouldn't admit how much I've been daydreaming about you…",
      "I shouldn't say this, but you've been distracting me more than you know…",
    ],
  },
  {
    id: "encouraging",
    label: "Encouraging",
    icon: <TrendingUp className="w-4 h-4 text-green-500" />,
    suggestions: [
      "You've got this!",
      "You're doing amazing, keep pushing!",
      "Don't give up, the best is yet to come.",
      "I believe in you and everything you're working towards.",
      "Whatever comes your way, I know you'll rise above it — you always do.",
      "The way you handle things inspires me; don't forget how capable you truly are.",
      "The way you handle things inspires me; don't forget how capable you truly are.",
      "You've been making progress, even if it doesn't always feel like it — keep going.",
      "Even on tough days, remember: you're stronger than the challenges in front of you.",
      "I believe in you more than you realize — you've got everything it takes to succeed.",
    ],
  },
  {
    id: "pickup",
    label: "Pickup Lines",
    icon: <TrendingUp className="w-4 h-4 text-green-500" />,
    suggestions: [
      "Are you French? Because Eiffel for you.",
      "You're proof that dreams really do come true.",
      "If you were a vegetable, you'd be a cute-cumber.",
      "You're the reason I believe in love at first sight.",
      "I must be a snowflake, because I've fallen for you.",
      "If kisses were snowflakes, I'd send you a blizzard.",
      "Every love song suddenly makes sense when I think of you.",
      "If I could rearrange the alphabet, I'd put U and I together.",
      "Do you have a map? Because I keep getting lost in your eyes.",
      "I don't need the stars tonight — you're already shining brighter.",
      "Your smile must be a black hole, because it pulls me in every time.",
      "I wasn't planning on falling in love tonight… but then you walked in.",
      "Is your name Google? Because you have everything I've been searching for.",
      "Are you a magician? Because whenever I look at you, everyone else disappears.",
    ],
  },
];

const ALL_SUGGESTIONS = CATEGORIES.flatMap((c) => c.suggestions);

export default function ClientPage({
  initialUserInfo,
  username,
}: {
  initialUserInfo: UserInfo;
  username: string;
}) {
  const { data: session, status } = useSession();
  const [userInfo, setUserInfo] = useState<UserInfo>(initialUserInfo);
  const [message, setMessage] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showRegPopup, setShowRegPopup] = useState(false);
  const [visitorId, setVisitorId] = useState<string | null>(null);

  useEffect(() => {
    const initFp = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        setVisitorId(result.visitorId);
        // Set cookie so API can read it
        document.cookie = `ipcosy-fingerprint=${result.visitorId}; path=/; max-age=31536000`;
      } catch (e) {
        console.error("Fingerprint error:", e);
      }
    };
    initFp();
  }, []);

  useEffect(() => {
    // Increment visit only
    if (initialUserInfo?.id) {
      fetch("/api/u/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: initialUserInfo.id }),
      }).catch(console.error);
    }
  }, [initialUserInfo]);

  const handleSend = async () => {
    if (!message.trim() && !fileUrl) return;

    if (status !== "authenticated" && !visitorId && !document.cookie.includes("ipcosy-fingerprint")) {
      toast.error("Anonymous session not initialized. Please refresh the page and ensure cookies are enabled.");
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch("/api/u/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: userInfo.id,
          content: message,
          fileUrl: fileUrl,
          isAnonymous: true,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Message sent anonymously!");
        setMessage("");
        setFileUrl(null);
        if (status !== "authenticated") {
          setShowRegPopup(true);
        }
      } else {
        toast.error(data.error || "Failed to send message.");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred while sending your message.");
    } finally {
      setIsSending(false);
    }
  };

  const handleRandomSuggestion = () => {
    const random =
      ALL_SUGGESTIONS[Math.floor(Math.random() * ALL_SUGGESTIONS.length)];
    setMessage(random);
    // toast.success("Random message selected!");
  };

  if (!userInfo)
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center">
        <div className="w-full max-w-lg space-y-8">
          <Skeleton className="h-48 w-full rounded-[2.5rem]" />
          <Skeleton className="h-[250px] w-full rounded-[2rem]" />
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header/User Card */}
        <div className="bg-sidebar rounded-[2.5rem] p-8 shadow-xl text-center space-y-4 border border-border/50 relative overflow-hidden text-foreground">
          <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-purple-600 mx-auto flex items-center justify-center text-white text-4xl font-bold shadow-lg overflow-hidden ring-4 ring-white dark:ring-[#17212b]">
            {userInfo.image ? (
              <Image
                src={userInfo.image}
                alt={userInfo.name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              (userInfo.name || "??").substring(0, 2).toUpperCase()
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black">
              Send a message to {userInfo.name}
            </h1>
            <p className="text-xs text-muted font-medium">@{username}</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed px-4">
            They will never know who sent this message unless you reveal
            yourself later!
          </p>
        </div>

        {/* Message Input Area */}
        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your anonymous message here..."
              className="w-full bg-sidebar border border-border/50 rounded-[2rem] p-6 pr-14 text-sm text-foreground placeholder:text-muted-foreground/50 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner resize-none"
            />
            <button
              onClick={handleRandomSuggestion}
              className="absolute top-4 right-4 p-3 bg-primary/10 text-primary rounded-2xl hover:bg-primary/20 transition-all active:scale-95 group"
              title="Roll for a random message"
            >
              <Dices className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
            <div className="absolute bottom-4 right-6 text-[10px] text-muted font-bold uppercase tracking-widest opacity-40">
              {message.length} Characters
            </div>
          </div>

          {/* Image Preview */}
          {fileUrl && (
            <div className="relative w-full bg-sidebar rounded-[1.5rem] p-4 border border-primary/30">
              <div className="relative w-full h-40 rounded-lg overflow-hidden">
                <Image
                  src={fileUrl}
                  alt="Uploaded image"
                  fill
                  className="object-cover"
                />
              </div>
              <button
                onClick={() => setFileUrl(null)}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Upload Section */}
          <div className="w-full">
            <UploadButton<OurFileRouter, "imageUploader">
              endpoint="imageUploader"
              onClientUploadComplete={(res) => {
                if (res?.[0]) {
                  setFileUrl(res[0].url);
                  toast.success("Image uploaded!");
                }
              }}
              onUploadError={(error: Error) => {
                toast.error(`Upload failed: ${error.message}`);
              }}
              content={{
                button({ ready, isUploading }) {
                  if (isUploading) return "Uploading...";
                  if (ready) return <div className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Add Image</div>;
                  return "Getting ready...";
                },
              }}
              appearance={{
                container: "w-full",
                button: "w-full ut-button:bg-primary/20 ut-button:text-primary ut-button:font-bold ut-button:py-3 ut-button:rounded-[1.5rem] ut-button:border-0 ut-button:transition-all hover:ut-button:bg-primary/30",
                allowedContent: "hidden",
              }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={(!message.trim() && !fileUrl) || isSending}
            className="cursor-pointer w-full bg-primary text-white py-5 rounded-[1.5rem] font-black text-sm shadow-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isSending ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Send Anonymously</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2 pb-8">
          <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em]">
            Powered by IP~Tec
          </p>
          <p className="text-[10px] text-muted-foreground italic flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3" /> End-to-end anonymous encryption
            enabled.
          </p>
        </div>
      </div>

      {/* Registration Popup */}
      {showRegPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-sidebar w-full max-w-sm rounded-[2.5rem] border border-border p-10 shadow-2xl space-y-8 animate-in zoom-in duration-300 text-foreground">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto transition-transform hover:scale-110">
                <Zap className="w-10 h-10 text-primary fill-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black italic">
                  Wait! Don&apos;t leave yet
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed h-12">
                  Register now so you can see when {userInfo.name} replies to
                  your message!
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => signIn("google")}
                className="cursor-pointer w-full flex items-center justify-center gap-4 bg-foreground text-background font-bold py-5 rounded-[1.5rem] hover:opacity-90 active:scale-[0.98] transition-all shadow-xl group"
              >
                <div className="bg-white p-1 rounded-full">
                  <Image
                    src="https://www.google.com/favicon.ico"
                    className="w-4 h-4"
                    alt="Google"
                  />
                </div>
                Continue with Google
              </button>
              <button
                onClick={() => setShowRegPopup(false)}
                className="cursor-pointer w-full py-4 text-xs font-bold text-muted hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
