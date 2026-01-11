"use client";

export const dynamic = "force-dynamic";

import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, Suspense } from "react";
import { IpSocket } from "@ipcosy/ip-socket";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { UploadButton } from "../utils/uploadthing";
import { useSession, signIn, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";

// Mock Data
const MOCK_CHATS = [
  {
    id: "mvp-lobby",
    name: "Public Lobby",
    message: "Welcome to IPCosy!",
    time: "Now",
    unread: 0,
    isGroup: true,
  },
];

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
  const [selectedChat, setSelectedChat] = useState<string | null>("mvp-lobby");
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const socketRef = useRef<IpSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const alias = session?.user?.name || "Anonymous";

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

    // 2. Initialize Socket
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";
    socketRef.current = new IpSocket({
      url: wsUrl,
      autoConnect: true,
    });

    socketRef.current.on("error", (err: any) => {
      console.error("IpSocket error handled:", err);
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

  if (!hasMounted || status === "loading")
    return <div className="h-screen bg-background" />;

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
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
              <h2 className="text-4xl font-extrabold tracking-tight">IPCosy</h2>
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
              {alias.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-lg">{alias}</p>
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
            <button
              className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group text-left"
              onClick={() => alert("Invite link copied!")}
            >
              <span className="text-xl group-hover:scale-110 transition-transform">
                🔗
              </span>
              <span className="font-medium">Invite Friends</span>
            </button>
          </nav>

          <div className="absolute bottom-4 left-0 w-full text-center text-[10px] text-muted">
            IPCosy Desktop v0.1.0
          </div>
        </div>
      </div>

      {/* Left Sidebar (Chat List) */}
      <div
        className={`w-full md:w-[350px] lg:w-[400px] flex-col bg-sidebar border-r border-border ${
          selectedChat && selectedChat !== "mvp-lobby"
            ? "hidden md:flex"
            : "flex"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
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
        <div className="flex-1 overflow-y-auto">
          {MOCK_CHATS.map((chat) => (
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
      </div>

      {/* Right Content */}
      <div
        className={`flex-1 flex-col bg-background relative ${
          !selectedChat ? "hidden md:flex" : "flex"
        }`}
      >
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-4 border-b border-border bg-sidebar p-3 z-10">
              <button
                onClick={() => setSelectedChat(null)}
                className="md:hidden p-2 rounded-full hover:bg-black/5 text-primary"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white font-bold shadow-md">
                PL
              </div>
              <div className="flex flex-col flex-1">
                <span className="font-bold text-sm tracking-tight flex items-center gap-1">
                  Public Lobby
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                    Group
                  </span>
                </span>
                <span className="text-[10px] text-primary font-medium">
                  99+ members, 12 online
                </span>
              </div>
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
                    {msg.sender !== "me" && (
                      <span className="text-[10px] font-bold text-primary mb-1 ml-2">
                        {msg.alias || "Anonymous"}
                      </span>
                    )}
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
                    ? "bg-primary text-white shadow-lg scale-100 hover:opacity-90 active:scale-95"
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
        ) : (
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
        )}
      </div>
    </div>
  );
}
