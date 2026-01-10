"use client";

import { useTheme } from "next-themes";
import Image from "next/image";
import { useState } from "react";

// Mock Data
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
  {
    id: 3,
    name: "Anonymous 05",
    message: "Can you send the docs?",
    time: "Yesterday",
    unread: 0,
  },
];

const MOCK_MESSAGES = [
  { id: 1, sender: "them", text: "Hello! Is this secure?", time: "10:00 AM" },
  { id: 2, sender: "me", text: "Yes, fully anonymous.", time: "10:05 AM" },
  {
    id: 3,
    sender: "them",
    text: "Great. I have some files to share.",
    time: "10:06 AM",
  },
];

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [selectedChat, setSelectedChat] = useState<number | null>(null);

  // Mobile: If chat selected, show chat window. Else show list.
  // Desktop: Show both side-by-side.

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Left Sidebar (Chat List) */}
      <div
        className={`w-full md:w-[400px] flex-col border-r border-black/10 dark:border-white/10 ${
          selectedChat ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-background">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <Image
                src="/ip cosy logo.png"
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
        <div className="px-4 pb-2">
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
              {/* Note: pattern.png is a placeholder, strictly using CSS colors for now */}
              {MOCK_MESSAGES.map((msg) => (
                <div
                  key={msg.id}
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
                    <p>{msg.text}</p>
                    <span
                      className={`float-right mt-1 ml-2 text-[10px] opacity-70`}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-background">
              <div className="flex items-center gap-2 rounded-2xl bg-black/5 dark:bg-white/5 px-4 py-2">
                <button className="text-black/40 dark:text-white/40 hover:text-primary transition-colors">
                  📎
                </button>
                <input
                  type="text"
                  placeholder="Message..."
                  className="flex-1 bg-transparent focus:outline-none"
                />
                <button className="text-primary hover:text-blue-600 transition-colors">
                  ➤
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center p-4">
            <div className="w-24 h-24 relative mb-4 opacity-20">
              <Image
                src="/ip cosy logo.png"
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
