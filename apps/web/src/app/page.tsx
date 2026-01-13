"use client";

export const dynamic = "force-dynamic";

import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { APP_VERSION } from "@/lib/constants";
import { useState, useEffect, useRef, Suspense } from "react";
import { IpSocket } from "@ipcosy/ip-socket";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { UploadButton } from "../utils/uploadthing";
import { useSession, signIn, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { OnboardingModal } from "@/components/onboarding-modal";
import { EmptyState } from "@/components/empty-state";
import { CopyIcon } from "lucide-react";

const MOCK_CHATS: any[] = [];

export default function Home() {
  return (
    <Suspense fallback={<div className="h-screen bg-background" />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const [hasMounted, setHasMounted] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatInfo, setSelectedChatInfo] = useState<any>(null);
  const socketRef = useRef<IpSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const user = session?.user as any;
  const isPremium = user?.isPremium;
  const alias = session?.user?.username || "Anonymous";

  useEffect(() => {
    setHasMounted(true);

    // Store referral code if present
    const ref = searchParams.get("r");
    if (ref) {
      localStorage.setItem("ipcosy-referral", ref);
    }

    if (status === "authenticated" && session.user) {
      setVisitorId((session.user as any).id as string);
    } else if (status === "unauthenticated") {
      // Fingerprint for anonymous messaging screen (Step 8)
      const initFp = async () => {
        try {
          const fp = await FingerprintJS.load();
          const result = await fp.get();
          setVisitorId(result.visitorId);
        } catch (e) {
          console.error(e);
        }
      };
      initFp();
    }

    // 2. Fetch Real Chats
    if (status === "authenticated") {
      fetch("/api/groups/list")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setChats(data);
        });
    }

    // 3. Initialize Socket
    let wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname;
      wsUrl = `${protocol}//${host}:8080`;
    }

    socketRef.current = new IpSocket({
      url: wsUrl,
      autoConnect: true,
    });

    socketRef.current.on("error", (err: any) => {
      console.error(
        "IpSocket error handled:",
        err || "Unknown Error (empty error object)",
      );
      if (err && Object.keys(err).length === 0) {
        console.warn(
          "Socket error object is empty. This often indicates a connection reset or failed handshake.",
        );
      }
    });

    socketRef.current.on("message", (payload: any) => {
      if (payload.type === "echo") {
        setMessages((prev) => [
          ...prev,
          {
            ...payload.data,
            sender: payload.data.visitorId === visitorId ? "me" : "them",
          },
        ]);
      } else if (payload.type === "error") {
        console.error(payload.message);
      } else if (payload.type === "typing") {
        if (payload.visitorId !== visitorId) {
          setTypingUser(payload.isTyping ? "Someone" : null);
        }
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [visitorId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingUser]);

  useEffect(() => {
    if (socketRef.current && visitorId) {
      socketRef.current.setTyping(visitorId, inputText.length > 0);
    }
  }, [inputText, visitorId]);

  useEffect(() => {
    if (
      selectedChat &&
      selectedChat !== "mvp-lobby" &&
      status === "authenticated"
    ) {
      // Fetch Chat Info
      fetch(`/api/groups/info?chatId=${selectedChat}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) setSelectedChatInfo(data);
        });

      // Fetch Messages
      fetch(`/api/groups/messages?chatId=${selectedChat}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setMessages(data);
          }
        });
    } else {
      setSelectedChatInfo(null);
      if (selectedChat !== "mvp-lobby") setMessages([]); // Clear messages if deselected
    }
  }, [selectedChat, status]);

  const handleSend = (fileUrl?: string) => {
    if (!visitorId) return;
    if (!inputText.trim() && !fileUrl) return;

    const msg = {
      id: Date.now(),
      text: inputText,
      fileUrl: fileUrl,
      visitorId: visitorId,
      alias: alias,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    };

    socketRef.current?.send(msg);
    setInputText("");
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const res = await fetch("/api/groups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName }),
      });
      if (res.ok) {
        setShowCreateGroup(false);
        setNewGroupName("");
        // Reload or update chat list - for now a simple alert
        toast.success("Group created! Reloading...");
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCodeInput.trim()) return;
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode: joinCodeInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowJoinGroup(false);
        setJoinCodeInput("");
        toast.success(`Joined ${data.chatName}! Reloading...`);
        window.location.reload();
      } else {
        toast.error(data.error || "Failed to join group");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePromoteAdmin = async (targetUserId: string) => {
    try {
      const res = await fetch("/api/groups/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: selectedChat,
          targetUserId,
          role: "ADMIN",
        }),
      });
      if (res.ok) {
        toast.success("User promoted to Admin!");
        // Refresh info
        fetch(`/api/groups/info?chatId=${selectedChat}`)
          .then((res) => res.json())
          .then((data) => {
            if (!data.error) setSelectedChatInfo(data);
          });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!hasMounted || status === "loading")
    return <div className="h-screen bg-background" />;

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
        <h1 className="sr-only">IP~Cosy - Secure & Anonymous Messaging</h1>
        <div className="w-full max-w-sm bg-background border border-border rounded-[2.5rem] p-10 shadow-2xl space-y-10 text-center animate-in fade-in zoom-in duration-500">
          <div className="space-y-6">
            <div className="w-28 h-28 bg-primary/10 rounded-full flex items-center justify-center mx-auto transition-transform hover:scale-105 duration-300">
              <Image
                src="/logo.png"
                alt="Logo"
                width={70}
                height={70}
                className="object-contain"
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-extrabold tracking-tight">
                IP~Cosy
              </h2>
              <p className="text-muted-foreground text-sm px-2 leading-relaxed">
                The most secure way to connect anonymously.
                <br />
                <span className="font-medium">
                  Everything flows from Google identity.
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={async () => {
              // Set fingerprint cookie before redirecting
              if (visitorId) {
                document.cookie = `ipcosy-fingerprint=${visitorId}; path=/; max-age=31536000`;
              }
              signIn("google");
            }}
            className="cursor-pointer w-full flex items-center justify-center gap-4 bg-foreground text-background font-bold py-5 rounded-[1.5rem] hover:opacity-90 active:scale-[0.98] transition-all shadow-xl group"
          >
            <div className="bg-white p-1 rounded-full">
              <img
                src="https://www.google.com/favicon.ico"
                className="w-5 h-5"
                alt="Google"
              />
            </div>
            Continue with Google
          </button>

          <div className="space-y-4">
            <div className="flex items-center gap-2 justify-center opacity-40">
              <span className="h-px w-8 bg-current" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold">
                Secure • Anonymous
              </span>
              <span className="h-px w-8 bg-current" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans">
      <OnboardingModal user={user} />
      {/* Sidebar Menu */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${isMenuOpen ? "visible opacity-100" : "invisible opacity-0"}`}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />
        <div
          className={`absolute top-0 left-0 h-full w-[280px] bg-sidebar border-r border-border transition-transform duration-300 shadow-2xl ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="p-6 bg-primary text-white space-y-4">
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold border-2 border-white/30 shadow-inner">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-lg">{user.username}</p>
              <p className="text-xs text-white/70">Anonymous Identity</p>
            </div>
          </div>
          <nav className="p-2 space-y-1">
            <Link
              href="/profile"
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">
                👤
              </span>
              <span className="font-medium">My Profile</span>
            </Link>
            {user?.isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group text-primary"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">
                  🛡️
                </span>
                <span className="font-medium">Admin Panel</span>
              </Link>
            )}
            <Link
              href="/settings"
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">
                ⚙️
              </span>
              <span className="font-medium">Settings</span>
            </Link>
            <div className="h-px bg-border my-2 mx-2" />
            <button className="cursor-pointer w-full flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group text-left">
              <span className="font-medium">My Public Link</span>
              <span className="text-xl group-hover:scale-110 transition-transform">
                <CopyIcon
                  className="w-5 h-5 cursor-pointer"
                  onClick={() => {
                    const link = `${window.location.origin}/${(user?.username || session?.user?.name || "").toLowerCase().replace(/\s+/g, "")}`;
                    navigator.clipboard.writeText(link);
                    toast.success("Public link copied!");
                  }}
                />
              </span>
            </button>
            <button className="cursor-pointer w-full flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group text-left">
              <span className="font-medium">Invite Friends</span>
              <span className="text-xl group-hover:scale-110 transition-transform">
                <CopyIcon
                  className="w-5 h-5 cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      window.location.origin +
                        "?r=" +
                        (user?.referralCode || ""),
                    );
                    toast.success("Invite link copied!");
                  }}
                />
              </span>
            </button>
          </nav>
          <div className="absolute bottom-4 left-0 w-full text-center text-[10px] text-muted">
            IPCosy Desktop {APP_VERSION}
          </div>
        </div>
      </div>

      {/* Left Sidebar (Chat List) */}
      <div
        className={`w-full md:w-[350px] lg:w-[400px] flex-col bg-sidebar border-r border-border ${
          selectedChat
            ? "hidden md:flex"
            : chats.length === 0
              ? "hidden md:flex"
              : "flex"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="cursor-pointer p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search"
              className="w-full rounded-2xl bg-background border border-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-6 p-2">
          {/* Groups Section */}
          {chats.some((c) => c.isGroup) && (
            <div className="space-y-1">
              <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Groups
              </h3>
              {chats
                .filter((c) => c.isGroup)
                .map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat.id)}
                    className={`flex cursor-pointer items-center gap-4 p-3 mx-2 rounded-2xl transition-all ${
                      selectedChat === chat.id
                        ? "bg-primary text-white shadow-lg"
                        : "hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full font-bold text-lg shadow-sm ${
                        selectedChat === chat.id
                          ? "bg-white/20"
                          : "bg-gradient-to-br from-blue-400 to-purple-500 text-white"
                      }`}
                    >
                      {chat.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-bold truncate">{chat.name}</h3>
                        <span
                          className={`text-[10px] ${selectedChat === chat.id ? "text-white/70" : "text-muted"}`}
                        >
                          {chat.time}
                        </span>
                      </div>
                      <p
                        className={`truncate text-xs ${selectedChat === chat.id ? "text-white/80" : "text-muted"}`}
                      >
                        {chat.message}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Direct Messages Section */}
          {chats.some((c) => !c.isGroup) && (
            <div className="space-y-1">
              <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Direct Messages
              </h3>
              {chats
                .filter((c) => !c.isGroup)
                .map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat.id)}
                    className={`flex cursor-pointer items-center gap-4 p-3 mx-2 rounded-2xl transition-all ${
                      selectedChat === chat.id
                        ? "bg-primary text-white shadow-lg"
                        : "hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full font-bold text-lg shadow-sm ${
                        selectedChat === chat.id
                          ? "bg-white/20"
                          : "bg-gradient-to-br from-green-400 to-teal-500 text-white"
                      }`}
                    >
                      {chat.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-bold truncate">{chat.name}</h3>
                        <span
                          className={`text-[10px] ${selectedChat === chat.id ? "text-white/70" : "text-muted"}`}
                        >
                          {chat.time}
                        </span>
                      </div>
                      <p
                        className={`truncate text-xs ${selectedChat === chat.id ? "text-white/80" : "text-muted"}`}
                      >
                        {chat.message}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        {status === "authenticated" && (
          <div className="absolute bottom-6 right-6 md:right-auto md:left-[300px] lg:left-[350px] z-20 flex flex-col gap-3">
            {/* Join Group Button */}
            <button
              onClick={() => setShowJoinGroup(true)}
              className="cursor-pointer w-12 h-12 bg-sidebar border border-border text-primary rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
              title="Join Group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="16" y1="11" x2="22" y2="11" />
              </svg>
            </button>
            {/* Create Group Button (Only if Premium, but maybe show alert if free?) */}
            <button
              onClick={() => {
                setShowCreateGroup(true);
              }}
              className="cursor-pointer w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all text-2xl group"
              title="Create Group"
            >
              <span className="group-hover:rotate-90 transition-transform duration-300">
                +
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Right Content */}
      <div
        className={`flex-1 flex-col bg-background relative ${
          !selectedChat && chats.length === 0
            ? "flex"
            : !selectedChat
              ? "hidden md:flex"
              : "flex"
        }`}
      >
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-4 border-b border-border bg-sidebar p-3 z-10">
              <button
                onClick={() => setSelectedChat(null)}
                className="md:hidden p-4 -ml-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded-full touch-manipulation"
              >
                <span className="text-2xl">←</span>
              </button>
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-white font-bold">
                {selectedChat === "mvp-lobby"
                  ? "L"
                  : chats
                      .find((c) => c.id === selectedChat)
                      ?.name.substring(0, 1)
                      .toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="font-bold leading-tight">
                  {chats.find((c) => c.id === selectedChat)?.name || "Chat"}
                </h2>
                <p className="text-[10px] text-green-500 font-medium">Online</p>
              </div>
              {selectedChat !== "mvp-lobby" && status === "authenticated" && (
                <button
                  onClick={() => setShowGroupSettings(true)}
                  className="cursor-pointer p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-muted transition-colors"
                  title="Group Settings"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 kitchens-1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Messages Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f0f2f5] dark:bg-[#0e1621] relative"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1519681393784-d120267973ba?q=80&w=2070&auto=format&fit=crop')`,
                backgroundSize: "cover",
                backgroundBlendMode:
                  theme === "dark" ? "multiply" : "soft-light",
              }}
            >
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />

              <div className="relative space-y-3 max-w-3xl mx-auto">
                <div className="flex justify-center mb-6">
                  <div className="bg-black/5 dark:bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] text-muted border border-border/50 text-center max-w-xs">
                    🔒 Messages are end-to-end anonymous. All data is
                    automatically deleted from our servers after 72 hours for
                    your safety.
                  </div>
                </div>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      msg.sender === "me" ? "items-end" : "items-start"
                    }`}
                  >
                    {/* Usernames are hidden for anonymity */}
                    <div
                      className={`max-w-[85%] rounded-[18px] px-3 py-2 shadow-sm relative group overflow-hidden ${
                        msg.sender === "me"
                          ? "bg-bubble-out text-bubble-out-text rounded-tr-[4px]"
                          : "bg-bubble-in text-bubble-in-text rounded-tl-[4px]"
                      }`}
                    >
                      {msg.fileUrl && (
                        <div className="mb-2 -mx-1 -mt-1 overflow-hidden rounded-lg">
                          {msg.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img
                              src={msg.fileUrl}
                              alt="shared"
                              className="max-h-[300px] w-full object-cover"
                              onClick={() => window.open(msg.fileUrl)}
                            />
                          ) : (
                            <div className="flex items-center gap-3 p-3 bg-black/5 dark:bg-white/10 rounded-lg">
                              <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center text-xl">
                                📄
                              </div>
                              <span className="truncate text-xs font-medium">
                                Document
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {msg.text && (
                        <p className="text-[13px] leading-[1.4] whitespace-pre-wrap break-words">
                          {msg.text}
                        </p>
                      )}

                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[9px] opacity-60 font-medium">
                          {msg.time}
                        </span>
                        {msg.sender === "me" && (
                          <span className="text-[10px] text-blue-500">✓✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {typingUser && (
                  <div className="flex justify-start">
                    <div className="bg-bubble-in text-bubble-in-text rounded-2xl rounded-bl-sm px-4 py-2 text-xs shadow-sm animate-pulse italic flex items-center gap-2">
                      <span className="flex gap-1">
                        <span className="w-1 h-1 bg-muted rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1 h-1 bg-muted rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1 h-1 bg-muted rounded-full animate-bounce" />
                      </span>
                      Someone is typing...
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-3 bg-sidebar flex items-center gap-2 max-w-4xl mx-auto w-full">
              <div className="relative group p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors overflow-hidden">
                <span className="text-2xl text-muted grayscale group-hover:grayscale-0 transition-all">
                  📎
                </span>
                <div className="absolute inset-0 opacity-0 cursor-pointer">
                  <UploadButton
                    endpoint="imageUploader"
                    onClientUploadComplete={(res) => {
                      handleSend(res?.[0]?.url);
                    }}
                    onUploadError={(error) =>
                      console.error(`Upload Failed: ${error.message}`)
                    }
                    appearance={{
                      button: { width: "100%", height: "100%" },
                      allowedContent: { display: "none" },
                    }}
                  />
                </div>
              </div>

              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Your message..."
                  className="w-full bg-background/50 border border-border rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted"
                />
              </div>

              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim()}
                className={`p-3 rounded-full transition-all flex items-center justify-center ${
                  inputText.trim()
                    ? "cursor-pointer bg-primary text-white shadow-lg scale-100 hover:opacity-90 active:scale-95"
                    : "bg-transparent text-muted scale-90 opacity-40 cursor-default"
                }`}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="rotate-45 -mt-0.5 ml-0.5"
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </>
        ) : chats.length > 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-8 bg-background">
            <div className="w-32 h-32 relative mb-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
              <Image
                src="/logo.png"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
            <h2 className="text-xl font-bold mb-2">Select a chat</h2>
            <p className="text-muted text-sm max-w-[200px]">
              Choose one from the sidebar to start messaging anonymously.
            </p>
          </div>
        ) : (
          <EmptyState username={alias} />
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
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
                  onClick={() => setShowCreateGroup(false)}
                  className="cursor-pointer flex-1 py-4 text-sm font-bold text-muted hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim()}
                  className="cursor-pointer flex-1 py-4 text-sm font-bold bg-primary text-white rounded-2xl shadow-lg hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinGroup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-sidebar w-full max-w-sm rounded-[2rem] border border-border p-8 shadow-2xl space-y-6 animate-in zoom-in duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black">Join a Group</h2>
              <p className="text-xs text-muted">
                Enter the 6-character join code.
              </p>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="Code (e.g. AB12XY)"
                maxLength={6}
                className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-center text-lg font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowJoinGroup(false)}
                  className="flex-1 py-4 text-sm font-bold text-muted hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinGroup}
                  disabled={joinCodeInput.length < 4}
                  className="cursor-pointer flex-1 py-4 text-sm font-bold bg-primary text-white rounded-2xl shadow-lg hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  Join
                </button>
              </div>
              <p className="text-[10px] text-center text-muted">
                {isPremium
                  ? "You have unlimited joins."
                  : "Free users can join up to 2 groups."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Group Settings Modal */}
      {showGroupSettings && selectedChatInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-sidebar w-full max-w-md rounded-[2rem] border border-border p-8 shadow-2xl space-y-6 animate-in zoom-in duration-300">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-2xl font-black">{selectedChatInfo.name}</h2>
                <p className="text-xs text-muted">Group Settings & Members</p>
              </div>
              <button
                onClick={() => setShowGroupSettings(false)}
                className="cursor-pointer text-muted hover:text-primary"
              >
                ✕
              </button>
            </div>

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
                    {selectedChatInfo.myRole === "OWNER" &&
                      p.role === "MEMBER" && (
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
              onClick={() => setShowGroupSettings(false)}
              className="cursor-pointer w-full py-4 text-sm font-bold bg-background border border-border rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
