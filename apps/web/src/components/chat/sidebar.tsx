"use client";

import Link from "next/link";
import Image from "next/image";
import { CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { APP_VERSION, SUPER_ADMIN_EMAILS } from "@/lib/constants";

interface SidebarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  user: any;
  session: any;
  chats: any[];
  selectedChat: string | null;
  setSelectedChat: (id: string | null) => void;
  isLoadingChats: boolean;
  status: string;
  setShowJoinGroup: (show: boolean) => void;
  setShowCreateGroup: (show: boolean) => void;
  isPremium: boolean;
}

export function Sidebar({
  isMenuOpen,
  setIsMenuOpen,
  user,
  session,
  chats,
  selectedChat,
  setSelectedChat,
  isLoadingChats,
  status,
  setShowJoinGroup,
  setShowCreateGroup,
  isPremium,
}: SidebarProps) {
  return (
    <>
      {/* Sidebar Menu Drawer */}
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
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold border-2 border-white/30 shadow-inner overflow-hidden">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt="Avatar"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.username?.substring(0, 2).toUpperCase() || "IP"
              )}
            </div>
            <div>
              <p className="font-bold text-lg">
                {user?.username || "Anonymous"}
              </p>
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
            {user?.email && SUPER_ADMIN_EMAILS.includes(user.email) && (
              <Link
                href="/admin"
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">
                  🛡️
                </span>
                <span className="font-medium">Admin Panel</span>
              </Link>
            )}
            <div className="h-px bg-border my-2 mx-2" />
            <button
              onClick={() => {
                const link = `${window.location.origin}/${(user?.username || session?.user?.name || "").toLowerCase().replace(/\s+/g, "")}`;
                navigator.clipboard.writeText(link);
                toast.success("Public link copied!");
              }}
              className="cursor-pointer w-full flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group text-left"
            >
              <span className="font-medium">
                <p>My Public Link</p>
                <p className="text-xs text-muted">
                  {window.location.origin}/
                  {(user?.username || session?.user?.name || "")
                    .toLowerCase()
                    .replace(/\s+/g, "")}
                </p>
              </span>
              <span className="text-xl group-hover:scale-110 transition-transform">
                <CopyIcon className="w-5 h-5" />
              </span>
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  window.location.origin + "?r=" + (user?.referralCode || ""),
                );
                toast.success("Invite link copied!");
              }}
              className="cursor-pointer w-full flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group text-left"
            >
              <span className="font-medium">
                <p>Invite Friends</p>
                <p className="text-xs text-muted">
                  {window.location.origin}/?r={user?.referralCode}
                </p>
              </span>
              <span className="text-xl group-hover:scale-110 transition-transform">
                <CopyIcon className="w-5 h-5" />
              </span>
            </button>
            <div className="h-px bg-border my-2 mx-2" />
            <button
              onClick={() => signOut()}
              className="cursor-pointer w-full flex items-center gap-4 p-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">
                🚪
              </span>
              <span className="font-medium">Logout</span>
            </button>
          </nav>
          <div className="absolute bottom-4 left-0 w-full text-center text-[10px] text-muted">
            Ip~Cosy WebApp {APP_VERSION}
          </div>
        </div>
      </div>

      {/* Main Sidebar (Chat List) */}
      <div
        className={`w-full md:w-[350px] lg:w-[400px] flex-col bg-sidebar border-r border-border h-full ${
          selectedChat
            ? "hidden md:flex"
            : chats.length === 0 && !isLoadingChats
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
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`text-[10px] ${selectedChat === chat.id ? "text-white/70" : "text-muted"}`}
                          >
                            {chat.time}
                          </span>
                          {chat.unread > 0 && selectedChat !== chat.id && (
                            <span className="bg-white text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                              {chat.unread}
                            </span>
                          )}
                        </div>
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
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`text-[10px] ${selectedChat === chat.id ? "text-white/70" : "text-muted"}`}
                          >
                            {chat.time}
                          </span>
                          {chat.unread > 0 && selectedChat !== chat.id && (
                            <span className="bg-white text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                              {chat.unread}
                            </span>
                          )}
                        </div>
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

          {isLoadingChats && (
            <div className="space-y-4 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 mx-2">
                  <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-full bg-muted animate-pulse rounded" />
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
            {/* Create Group Button */}
            <button
              onClick={() => setShowCreateGroup(true)}
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
    </>
  );
}
