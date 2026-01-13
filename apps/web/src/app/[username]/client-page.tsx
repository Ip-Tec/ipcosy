"use client";

import { useState, useEffect, use } from "react";
import { toast } from "sonner";
import { useSession, signIn } from "next-auth/react";
import { useRouter, notFound } from "next/navigation";
import {
  Heart,
  MessageSquare,
  Smile,
  Flame,
  Zap,
  TrendingUp,
  Send,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
      "I've had a crush on you for a while...",
      "You have the most beautiful smile I've ever seen.",
      "If I could take you anywhere, where would you want to go?",
      "Every time I see you, my day gets better.",
    ],
  },
  {
    id: "flirty",
    label: "Flirty",
    icon: <Smile className="w-4 h-4 text-orange-500" />,
    suggestions: [
      "Are you a magician? Because whenever I look at you, everyone else disappears.",
      "Is it hot in here or is it just you?",
      "I was going to say something sweet, but you're already sweet enough.",
      "Do you believe in love at first sight, or should I walk by again?",
    ],
  },
  {
    id: "friendly",
    label: "Friendly",
    icon: <MessageSquare className="w-4 h-4 text-blue-500" />,
    suggestions: [
      "Hey! Just wanted to say you're a really cool person.",
      "I really appreciate our friendship.",
      "Hope you're having an amazing day!",
      "Let's hang out soon!",
    ],
  },
  {
    id: "happy",
    label: "Happy",
    icon: <Smile className="w-4 h-4 text-yellow-500" />,
    suggestions: [
      "Your energy is so contagious!",
      "You make everyone around you so happy.",
      "Sending you good vibes!",
      "Keep being awesome!",
    ],
  },
  {
    id: "naughty",
    label: "Naughty",
    icon: <Flame className="w-4 h-4 text-purple-500" />,
    suggestions: [
      "I've been thinking about you in a way I probably shouldn't...",
      "What's your biggest secret?",
      "Tell me something you've never told anyone else.",
      "I like the way you look at me.",
    ],
  },
  {
    id: "encouraging",
    label: "Encouraging",
    icon: <TrendingUp className="w-4 h-4 text-green-500" />,
    suggestions: [
      "You're doing amazing, keep pushing!",
      "I believe in you and everything you're working towards.",
      "Don't give up, the best is yet to come.",
      "You've got this!",
    ],
  },
];

export default function ClientPage({
  initialUserInfo,
  username,
}: {
  initialUserInfo: any;
  username: string;
}) {
  const { data: session, status } = useSession();
  const [userInfo, setUserInfo] = useState<any>(initialUserInfo);
  const [message, setMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[2]); // Default Friendly
  const [isSending, setIsSending] = useState(false);
  const [showRegPopup, setShowRegPopup] = useState(false);

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
    if (!message.trim()) return;
    setIsSending(true);

    try {
      const res = await fetch("/api/u/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: userInfo.id,
          content: message,
          isAnonymous: true,
        }),
      });

      if (res.ok) {
        toast.success("Message sent anonymously!");
        setMessage("");
        if (status !== "authenticated") {
          setShowRegPopup(true);
        }
      } else {
        toast.error("Failed to send message.");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred.");
    } finally {
      setIsSending(false);
    }
  };

  if (!userInfo)
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center">
        <div className="w-full max-w-lg space-y-8">
          <Skeleton className="h-48 w-full rounded-[2.5rem]" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
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
              <img
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

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat)}
              className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all ${
                selectedCategory.id === cat.id
                  ? "bg-primary text-white shadow-md scale-105"
                  : "bg-sidebar text-muted-foreground hover:bg-primary/10"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Suggestions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {selectedCategory.suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => setMessage(suggestion)}
              className="cursor-pointer p-4 bg-sidebar/50 border border-border/50 rounded-2xl text-xs text-left text-foreground hover:bg-primary/5 hover:border-primary/30 transition-all active:scale-95"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Message Input Area */}
        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your anonymous message here..."
              className="w-full bg-sidebar border border-border/50 rounded-[2rem] p-6 text-sm text-foreground placeholder:text-muted-foreground/50 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner resize-none"
            />
            <div className="absolute bottom-4 right-6 text-[10px] text-muted font-bold uppercase tracking-widest opacity-40">
              {message.length} Characters
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={!message.trim() || isSending}
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
            Powered by IP~Cosy
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
                  Wait! Don't leave yet
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
                  <img
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
