"use client";

import { useTheme } from "next-themes";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { IpSocket } from "@ipcosy/ip-socket";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { UploadButton } from "../utils/uploadthing";

// Mock Data (still used for list, but messages will be real-time enhanced)
const MOCK_CHATS = [
  {
    id: 1,
    name: "Anonymous 01",
    message: "Hey, are you there?",
    time: "10:30 AM",
    unread: 2,
  },
  {
    id: 2,
    name: "Anonymous Group",
    message: "User 5: shared a file",
    time: "09:15 AM",
    unread: 0,
  },
];

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const socketRef = useRef<IpSocket | null>(null);

  useEffect(() => {
    // 1. Generate Fingerprint
    const setFp = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setVisitorId(result.visitorId);
    };
    setFp();

    // 2. Initialize Socket
    socketRef.current = new IpSocket({
      url: "ws://localhost:8080",
      autoConnect: true,
    });

    socketRef.current.on("connect", () => {
      console.log("Connected to IPCosy Engine");
    });

    socketRef.current.on("message", (payload: any) => {
      if (payload.type === "echo") {
        setMessages((prev) => [...prev, payload.data]);
      } else if (payload.type === "error") {
        alert(payload.message);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const handleSend = (fileUrl?: string) => {
    if (!visitorId) return;
    if (!inputText.trim() && !fileUrl) return;

    const msg = {
      id: Date.now(),
      sender: "me",
      text: inputText,
      fileUrl: fileUrl,
      visitorId: visitorId,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Optimistic update
    setMessages((prev) => [...prev, msg]);

    // Send to server
    socketRef.current?.send(msg);
    setInputText("");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Left Sidebar (Chat List) */}
      <div
        className={`w-full md:w-[400px] flex-col border-r border-black/10 dark:border-white/10 ${
          selectedChat ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-background border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <Image
                src="/logo.png"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-bold text-lg">IPCosy</span>
          </div>

          {/* Theme Switcher Tiny Menu */}
          <div className="flex gap-1">
            <button
              onClick={() => setTheme("light")}
              className={`w-4 h-4 rounded-full bg-gray-200 border border-gray-400 ${theme === "light" ? "ring-2 ring-blue-500" : ""}`}
              title="Light"
            />
            <button
              onClick={() => setTheme("dark")}
              className={`w-4 h-4 rounded-full bg-blue-900 border border-blue-700 ${theme === "dark" ? "ring-2 ring-blue-500" : ""}`}
              title="Dark"
            />
            <button
              onClick={() => setTheme("gray-green")}
              className={`w-4 h-4 rounded-full bg-emerald-700 border border-emerald-900 ${theme === "gray-green" ? "ring-2 ring-blue-500" : ""}`}
              title="Gray Green"
            />
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <input
            type="text"
            placeholder="Search"
            className="w-full rounded-full bg-black/5 dark:bg-white/10 px-4 py-2 text-sm focus:outline-none"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {MOCK_CHATS.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={`flex cursor-pointer items-center gap-3 p-3 hover:bg-black/5 dark:hover:bg-white/5 ${
                selectedChat === chat.id ? "bg-primary/10" : ""
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white font-bold text-sm">
                {chat.name.substring(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold truncate">{chat.name}</h3>
                  <span className="text-xs text-black/50 dark:text-white/50">
                    {chat.time}
                  </span>
                </div>
                <p className="truncate text-sm text-black/60 dark:text-white/60">
                  {chat.message}
                </p>
              </div>
              {chat.unread > 0 && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                  {chat.unread}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Content (Chat Window) */}
      <div
        className={`flex-1 flex-col bg-[#0e1621]/5 dark:bg-[#0e1621] relative ${
          !selectedChat ? "hidden md:flex" : "flex"
        }`}
      >
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-4 border-b border-black/5 dark:border-white/5 bg-background p-3 shadow-sm z-10">
              <button
                onClick={() => setSelectedChat(null)}
                className="md:hidden text-primary"
              >
                ← Back
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs">
                AN
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Anonymous 01</span>
                <span className="text-xs text-primary">online</span>
              </div>
            </div>

            {/* Messages Area */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-2 bg-cover bg-center"
              style={{ backgroundImage: "url('/pattern.png')" }}
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex w-full ${
                    msg.sender === "me" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                      msg.sender === "me"
                        ? "bg-[var(--bubble-out)] text-black dark:text-white rounded-br-none"
                        : "bg-[var(--bubble-in)] text-black dark:text-white rounded-bl-none"
                    }`}
                  >
                    {msg.fileUrl && (
                      <div className="mb-2">
                        {msg.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img
                            src={msg.fileUrl}
                            alt="shared"
                            className="rounded-lg max-w-full h-auto cursor-pointer"
                            onClick={() => window.open(msg.fileUrl)}
                          />
                        ) : (
                          <a
                            href={msg.fileUrl}
                            target="_blank"
                            className="flex items-center gap-2 p-2 bg-black/10 rounded overflow-hidden"
                          >
                            <span className="text-xl">📄</span>
                            <span className="truncate text-xs">
                              View Document
                            </span>
                          </a>
                        )}
                      </div>
                    )}
                    <p>{msg.text}</p>
                    <span
                      className={`float-right mt-1 ml-2 text-[10px] opacity-70`}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="flex h-full items-center justify-center text-black/30 dark:text-white/30 text-sm">
                  No messages yet. Say hello!
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-background">
              <div className="flex items-center gap-2 rounded-2xl bg-black/5 dark:bg-white/5 px-4 py-2">
                <div className="relative overflow-hidden w-8 h-8 flex items-center justify-center group">
                  <span className="text-xl transition-transform group-hover:scale-110">
                    📎
                  </span>
                  <div className="absolute inset-0 opacity-0 cursor-pointer">
                    <UploadButton
                      endpoint="imageUploader"
                      onClientUploadComplete={(res) => {
                        handleSend(res?.[0]?.url);
                      }}
                      onUploadError={(error) =>
                        alert(`Upload Failed: ${error.message}`)
                      }
                      appearance={{
                        button: {
                          background: "transparent",
                          width: "100%",
                          height: "100%",
                        },
                        allowedContent: { display: "none" },
                      }}
                    />
                  </div>
                </div>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Message..."
                  className="flex-1 bg-transparent focus:outline-none"
                />
                <button
                  onClick={() => handleSend()}
                  className="text-primary hover:text-blue-600 transition-colors"
                >
                  ➤
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center p-4">
            <div className="w-24 h-24 relative mb-4 opacity-20">
              <Image
                src="/logo.png"
                alt="Logo"
                fill
                className="object-contain grayscale"
              />
            </div>
            <div className="rounded-full bg-black/10 dark:bg-white/10 px-4 py-1 text-sm">
              Select a chat to start messaging
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
