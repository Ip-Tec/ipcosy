"use client";

import { useState } from "react";
import Image from "next/image";
import { Share2, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadButton } from "../../utils/uploadthing";
import { AnonymousMessageCard } from "./anonymous-message-card";
import { EmptyState } from "@/components/empty-state";
import { DeleteMessageModal } from "./modals/delete-message-modal";
import { MessageCardModal } from "./modals/message-card-modal";
import { signIn } from "next-auth/react";

interface ChatViewProps {
  selectedChat: string | null;
  setSelectedChat: (chat: string | null) => void;
  selectedChatInfo: any;
  messages: any[];
  isLoadingMessages: boolean;
  inputText: string;
  setInputText: (text: string) => void;
  handleSend: (fileUrl?: string) => void;
  typingUser: string | null;
  setShowGroupSettings: (show: boolean) => void;
  status: string;
  user: any;
  theme: string | undefined;
  alias: string;
  scrollRef: any;
  chats: any[];
  isLoadingChats: boolean;
  currentChat?: any;
  setMessages: (messages: any[] | ((prev: any[]) => any[])) => void;
  isAnonymous: boolean;
  setIsAnonymous: (val: boolean) => void;
}

export function ChatView({
  selectedChat,
  setSelectedChat,
  selectedChatInfo,
  messages,
  isLoadingMessages,
  inputText,
  setInputText,
  handleSend,
  typingUser,
  setShowGroupSettings,
  status,
  user,
  theme,
  alias,
  scrollRef,
  chats,
  isLoadingChats,
  setMessages,
  isAnonymous,
  setIsAnonymous,
}: ChatViewProps) {
  const currentChat = chats.find((c) => c.id === selectedChat);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  // Card Sharing Modal State
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedMessageForCard, setSelectedMessageForCard] =
    useState<any>(null);

  const handleDeleteClick = (messageId: string) => {
    setMessageToDelete(messageId);
    setShowDeleteModal(true);
  };

  const handleShareClick = (msg: any) => {
    setSelectedMessageForCard(msg);
    setShowCardModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!messageToDelete) return;
    setShowDeleteModal(false);

    try {
      const res = await fetch("/api/messages/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: messageToDelete }),
      });

      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageToDelete));
        toast.success("Message deleted");
        setMessageToDelete(null);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete message");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete message");
    }
  };

  const handleJoin = async () => {
    const code = selectedChatInfo?.joinCode;
    if (!code) return;

    try {
      const res = await fetch("/api/groups/join-via-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Joined group!");
        // Refresh EVERYTHING
        window.location.reload(); // Simplest way to refresh all states
      } else {
        toast.error(data.error || "Failed to join");
      }
    } catch (err) {
      toast.error("Error joining group");
    }
  };

  return (
    <div
      className={`flex-1 flex-col bg-background relative h-full ${
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
                : (selectedChatInfo?.name || "C").substring(0, 1).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="font-bold leading-tight">
                {selectedChatInfo?.name || "Chat"}
              </h2>
              <p className="text-[10px] text-green-500 font-medium">Online</p>
            </div>
            {selectedChat !== "mvp-lobby" && selectedChatInfo?.myRole && (
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
            className="h-[calc(100vh-100px)] flex-1 overflow-y-auto p-4 space-y-4 bg-background relative"
          >
            {/* Fixed Background Layer */}
            <div
              className="absolute inset-0 z-0 pointer-events-none"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1519681393784-d120267973ba?q=80&w=2070&auto=format&fit=crop')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
                backgroundBlendMode:
                  theme === "dark" ? "multiply" : "soft-light",
                opacity: 0.15,
              }}
            />
            <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] z-0 pointer-events-none" />

            <div className="relative space-y-3 max-w-3xl mx-auto">
              <div className="flex justify-center mb-6">
                <div className="bg-black/5 dark:bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] text-muted border border-border/50 text-center max-w-xs">
                  🔒 Messages are end-to-end anonymous. All data is
                  automatically deleted from our servers after 72 hours for your
                  safety.
                </div>
              </div>

              {isLoadingMessages && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${i % 2 === 0 ? "items-end" : "items-start"}`}
                    >
                      <Skeleton
                        className={`h-12 w-[60%] rounded-2xl ${
                          i % 2 === 0 ? "rounded-tr-none" : "rounded-tl-none"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {messages.map((msg, idx) => {
                // If message is explicitly anonymous OR matches legacy anonymous conditions
                const isAnonymousMessage =
                  msg.isAnonymous ||
                  (msg.sender === "them" &&
                    msg.text &&
                    (selectedChatInfo?.name === "Anonymous Messages" ||
                      msg.alias === "Anonymous"));

                const lastSeenAt = currentChat?.lastSeenAt;
                const isUnread =
                  msg.sender === "them" &&
                  lastSeenAt &&
                  new Date(msg.createdAt) > new Date(lastSeenAt);

                // Show "Unread Messages" bar before the first unread message
                const showUnreadBar =
                  isUnread &&
                  (idx === 0 ||
                    !(
                      new Date(messages[idx - 1].createdAt) >
                      new Date(lastSeenAt)
                    ));

                return (
                  <div key={idx} className="space-y-3">
                    {showUnreadBar && (
                      <div className="flex items-center gap-4 my-6">
                        <div className="h-px bg-primary/20 flex-1" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full">
                          Unread Messages
                        </span>
                        <div className="h-px bg-primary/20 flex-1" />
                      </div>
                    )}

                    {isAnonymousMessage ? (
                      <div className="flex justify-start w-full mb-4">
                        <AnonymousMessageCard
                          content={msg.text}
                          time={msg.time}
                          username={user?.username || "You"}
                          metadata={msg.metadata}
                          fileUrl={msg.fileUrl}
                        />
                      </div>
                    ) : (
                      <div
                        className={`flex flex-col ${
                          msg.sender === "me" ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-[18px] px-3 py-2 shadow-sm relative group overflow-hidden ${
                            msg.sender === "me"
                              ? "bg-primary text-white rounded-tr-[4px]"
                              : "bg-sidebar text-foreground rounded-tl-[4px] border border-border"
                          }`}
                        >
                          {msg.fileUrl && (
                            <div className="mb-2 -mx-1 -mt-1 overflow-hidden rounded-lg">
                              {msg.fileUrl.match(
                                /\.(jpg|jpeg|png|gif|webp)$/i,
                              ) ? (
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
                              <span className="text-[10px] text-blue-500">
                                ✓✓
                              </span>
                            )}
                          </div>

                          {/* Action Buttons: Delete & Share */}
                          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button
                              onClick={() => handleShareClick(msg)}
                              className="bg-sidebar hover:bg-muted text-foreground rounded-full p-1.5 shadow-lg border border-border"
                              title="Share as Card"
                            >
                              <Share2 className="w-3 h-3" />
                            </button>

                            {msg.sender === "me" && msg.id && (
                              <button
                                onClick={() => handleDeleteClick(msg.id)}
                                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg"
                                title="Delete message"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {typingUser && (
                <div className="flex justify-start">
                  <div className="bg-sidebar text-foreground border border-border rounded-2xl rounded-bl-sm px-4 py-2 text-xs shadow-sm animate-pulse italic flex items-center gap-2">
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

          {/* Input Area or Join CTA */}
          {selectedChatInfo?.myRole ? (
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

              {/* Anonymous Toggle */}
              <button
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`p-2 rounded-full transition-all ${
                  isAnonymous
                    ? "bg-purple-500/10 text-purple-600"
                    : "hover:bg-black/5 dark:hover:bg-white/5 text-muted"
                }`}
                title="Toggle Anonymous Mode"
              >
                <Shield
                  className={`w-6 h-6 ${isAnonymous ? "fill-purple-600" : ""}`}
                />
              </button>

              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={
                    isAnonymous ? "Send anonymously..." : "Your message..."
                  }
                  className={`w-full bg-background/50 border rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-muted ${
                    isAnonymous
                      ? "border-purple-500/30 focus:ring-purple-500/20"
                      : "border-border focus:ring-primary/20"
                  }`}
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
          ) : (
            <div className="p-4 bg-sidebar/80 backdrop-blur-md border-t border-border flex flex-col items-center gap-3">
              <p className="text-sm font-medium text-muted-foreground">
                Only members can send messages in this group.
              </p>
              {status === "unauthenticated" ? (
                <button
                  onClick={() => signIn("google")}
                  className="bg-foreground text-background font-bold px-8 py-3 rounded-2xl hover:opacity-90 transition-all shadow-lg text-sm"
                >
                  Sign in to Join Conversation
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  className="bg-primary text-white font-bold px-8 py-3 rounded-2xl hover:opacity-90 transition-all shadow-lg text-sm"
                >
                  Join Group
                </button>
              )}
            </div>
          )}
        </>
      ) : isLoadingMessages || isLoadingChats ? (
        <div className="flex h-full items-center justify-center">
          <Skeleton className="h-64 w-full max-w-sm rounded-[2rem]" />
        </div>
      ) : chats.length > 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center p-8 bg-background">
          <div className="w-32 h-32 relative mb-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <h2 className="text-xl font-bold mb-2">Select a chat</h2>
          <p className="text-muted text-sm max-w-[200px]">
            Choose one from the sidebar to start messaging anonymously.
          </p>
        </div>
      ) : (
        <EmptyState username={alias} />
      )}

      {/* Delete Message Modal */}
      <DeleteMessageModal
        show={showDeleteModal}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setMessageToDelete(null);
        }}
      />

      {/* Share Card Modal */}
      <MessageCardModal
        show={showCardModal}
        onClose={() => setShowCardModal(false)}
        message={selectedMessageForCard}
        username={alias || "User"}
      />
    </div>
  );
}
