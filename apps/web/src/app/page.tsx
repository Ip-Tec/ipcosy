"use client";

export const dynamic = "force-dynamic";

import { useTheme } from "next-themes";
import { useState, useEffect, useRef, Suspense } from "react";
import { IpSocket } from "@ipcosy/ip-socket";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { useSession, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { OnboardingModal } from "@/components/onboarding-modal";

// New modular components
import { Sidebar } from "@/components/chat/sidebar";
import { ChatView } from "@/components/chat/chat-view";
import { CreateGroupModal } from "@/components/chat/modals/create-group-modal";
import { JoinGroupModal } from "@/components/chat/modals/join-group-modal";
import { GroupSettingsModal } from "@/components/chat/modals/group-settings-modal";
import { DeleteConfirmationModal } from "@/components/chat/modals/delete-confirmation-modal";

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const selectedChatRef = useRef<string | null>(null);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  const [dbUser, setDbUser] = useState<any>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const socketRef = useRef<IpSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const showNotification = (messageData: any) => {
    if ("Notification" in window && Notification.permission === "granted") {
      const notification = new Notification("IP~Cosy", {
        body: messageData.text || "You have a new message",
        icon: "/logo.png",
        tag: messageData.chatId, // Prevent duplicate notifications for same chat
      });

      notification.onclick = () => {
        window.focus();
        setSelectedChat(messageData.chatId);
        notification.close();
      };
    }
  };

  const user = dbUser || (session?.user as any);
  const isPremium = user?.isPremium;
  const alias = user?.username || "Anonymous";

  useEffect(() => {
    setHasMounted(true);

    if (status === "authenticated") {
      fetch("/api/user/status")
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) setDbUser(data);
        });
    }

    const ref = searchParams.get("r");
    if (ref) {
      localStorage.setItem("ipcosy-referral", ref);
    }

    const jc = searchParams.get("join");
    const isViewOnly = searchParams.get("view") === "true";
    if (jc && !isViewOnly) {
      setJoinCodeInput(jc.toUpperCase());
      setShowJoinGroup(true);
    }

    if (status === "authenticated" && session.user) {
      setVisitorId((session.user as any).id as string);
    } else if (status === "unauthenticated") {
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

    const fetchChats = () => {
      setIsLoadingChats(true);
      fetch("/api/groups/list")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setChats(data);
        })
        .finally(() => setIsLoadingChats(false));
    };

    if (status === "authenticated" || visitorId) {
      fetchChats();
    }

    if (visitorId) {
      document.cookie = `ipcosy-fingerprint=${visitorId}; path=/; max-age=31536000`;
    }

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

    socketRef.current.on("connect", () => {
      console.log("Connected to WebSocket");
      if (visitorId) {
        socketRef.current?.send({
          visitorId,
          type: "identify",
          chatId: "mvp-lobby", // Default context
        } as any);
      }
    });

    socketRef.current.on("error", (err) => {
      console.error("WebSocket error:", err);
    });

    socketRef.current.on("message", (payload: any) => {
      if (payload.type === "echo") {
        const msgChatId = payload.data.chatId || "mvp-lobby";
        const currentChatId = selectedChatRef.current || "mvp-lobby";

        if (msgChatId === currentChatId) {
          setMessages((prev) => [
            ...prev,
            {
              ...payload.data,
              sender: payload.data.visitorId === visitorId ? "me" : "them",
            },
          ]);
        } else if (
          payload.data.visitorId === visitorId &&
          payload.data.isAnonymous
        ) {
          // Message was re-routed to an anonymous chat!
          setSelectedChat(msgChatId);
          fetchChats();
        } else if (payload.data.visitorId !== visitorId) {
          // Message in another chat - show notification
          showNotification(payload.data);
          fetchChats();
        }
      } else if (payload.type === "typing") {
        const typingChatId = payload.chatId || "mvp-lobby";
        const currentChatId = selectedChatRef.current || "mvp-lobby";

        if (typingChatId === currentChatId && payload.visitorId !== visitorId) {
          setTypingUser(payload.isTyping ? "Someone" : null);
        }
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [visitorId, session, status]);

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
    const jc = searchParams.get("join");
    const queryChatId = selectedChat;

    if ((queryChatId && queryChatId !== "mvp-lobby") || jc) {
      const infoUrl = jc
        ? `/api/groups/info?joinCode=${jc}`
        : `/api/groups/info?chatId=${queryChatId}`;

      fetch(infoUrl)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            setSelectedChatInfo(data);
            if (jc && !selectedChat) setSelectedChat(data.id);
          }
        });

      if (
        status === "authenticated" &&
        queryChatId &&
        queryChatId !== "mvp-lobby"
      ) {
        // Mark as seen
        fetch("/api/groups/seen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId: queryChatId }),
        }).then(() => {
          // Refresh chat list to clear unread counts
          fetch("/api/groups/list")
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data)) setChats(data);
            });
        });
      }

      setIsLoadingMessages(true);
      const msgUrl = jc
        ? `/api/groups/messages?joinCode=${jc}`
        : `/api/groups/messages?chatId=${queryChatId}`;

      fetch(msgUrl)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setMessages(data);
          }
        })
        .finally(() => setIsLoadingMessages(false));
    } else {
      setSelectedChatInfo(null);
      if (selectedChat !== "mvp-lobby") setMessages([]);
    }
  }, [selectedChat, status, searchParams]);

  const handleSend = (fileUrl?: string) => {
    if (!visitorId) return;
    if (!inputText.trim() && !fileUrl) return;

    const msg = {
      id: Date.now(),
      text: inputText,
      fileUrl: fileUrl,
      visitorId: visitorId,
      alias: isAnonymous ? "Anonymous" : alias,
      isAnonymous: isAnonymous,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      createdAt: new Date().toISOString(),
      chatId: selectedChat || undefined,
    };

    socketRef.current?.send(msg);
    setInputText("");
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setIsCreatingGroup(true);
    try {
      const res = await fetch("/api/groups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName }),
      });
      if (res.ok) {
        setShowCreateGroup(false);
        setNewGroupName("");
        toast.success("Group created! Reloading...");
        window.location.reload();
      } else {
        const data = await res.json();
        toast.error(data.details ? `${data.error}: ${data.details}` : (data.error || "Failed to create group"));
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred while creating the group");
    } finally {
      setIsCreatingGroup(false);
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

  const handleDeleteGroup = async () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteGroup = async () => {
    if (!selectedChatInfo) return;
    setIsCreatingGroup(true);
    try {
      const res = await fetch("/api/groups/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: selectedChat }),
      });
      if (res.ok) {
        toast.success("Group deleted successfully");
        setShowDeleteConfirm(false);
        setShowGroupSettings(false);
        setSelectedChat(null);
        setSelectedChatInfo(null);
        fetch("/api/groups/list")
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) setChats(data);
          });
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete group");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred while deleting the group");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleToggleJoinCodePrivacy = async () => {
    try {
      const newVal = !selectedChatInfo.isJoinCodePrivate;
      const res = await fetch("/api/groups/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: selectedChat,
          isJoinCodePrivate: newVal,
        }),
      });
      if (res.ok) {
        toast.success(`Join code is now ${newVal ? "private" : "public"}`);
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

  const isViewingOnly =
    searchParams.get("view") === "true" || status === "unauthenticated";
  const joinCodeParam = searchParams.get("join");

  // Only show splash if NOT viewing a group via link
  if (status === "unauthenticated" && !joinCodeParam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
        <div className="w-full max-w-sm bg-background border border-border rounded-[2.5rem] p-10 shadow-2xl space-y-10 text-center animate-in fade-in zoom-in duration-500">
          <div className="space-y-6">
            <div className="w-28 h-28 bg-primary/10 rounded-full flex items-center justify-center mx-auto transition-transform hover:scale-105 duration-300">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-[70px] h-[70px] object-contain"
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
            onClick={() => {
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
        </div>
      </div>
    );
  }

  // If viewing via link, we might need a special effect to load the group even if not in 'chats'
  // But for now, we'll let ChatView handle the 'selectedChat' if it's passed or derived.

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans">
      <OnboardingModal user={user} />

      <Sidebar
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        user={user}
        session={session}
        chats={chats}
        selectedChat={selectedChat}
        setSelectedChat={setSelectedChat}
        isLoadingChats={isLoadingChats}
        status={status}
        setShowJoinGroup={setShowJoinGroup}
        setShowCreateGroup={setShowCreateGroup}
        isPremium={isPremium}
      />

      <ChatView
        selectedChat={selectedChat}
        setSelectedChat={setSelectedChat}
        selectedChatInfo={selectedChatInfo}
        messages={messages}
        isLoadingMessages={isLoadingMessages}
        inputText={inputText}
        setInputText={setInputText}
        handleSend={handleSend}
        typingUser={typingUser}
        setShowGroupSettings={setShowGroupSettings}
        status={status}
        user={user}
        theme={theme}
        alias={alias}
        scrollRef={scrollRef}
        chats={chats}
        isLoadingChats={isLoadingChats}
        setMessages={setMessages}
        isAnonymous={isAnonymous}
        setIsAnonymous={setIsAnonymous}
      />

      <CreateGroupModal
        show={showCreateGroup}
        setShow={setShowCreateGroup}
        newGroupName={newGroupName}
        setNewGroupName={setNewGroupName}
        handleCreateGroup={handleCreateGroup}
        isCreatingGroup={isCreatingGroup}
      />

      <JoinGroupModal
        show={showJoinGroup}
        setShow={setShowJoinGroup}
        joinCodeInput={joinCodeInput}
        setJoinCodeInput={setJoinCodeInput}
        handleJoinGroup={handleJoinGroup}
        isPremium={isPremium}
      />

      <GroupSettingsModal
        show={showGroupSettings}
        setShow={setShowGroupSettings}
        selectedChatInfo={selectedChatInfo}
        handleToggleJoinCodePrivacy={handleToggleJoinCodePrivacy}
        handleDeleteGroup={handleDeleteGroup}
        handlePromoteAdmin={handlePromoteAdmin}
        myUserId={visitorId || ""}
      />

      <DeleteConfirmationModal
        show={showDeleteConfirm}
        setShow={setShowDeleteConfirm}
        selectedChatInfo={selectedChatInfo}
        confirmDeleteGroup={confirmDeleteGroup}
        isDeleting={isCreatingGroup}
      />

      {/* Onboarding Modal - Auto-show for new users */}
      {status === "authenticated" && user && (
        <OnboardingModal
          user={user}
          forceOpen={(session?.user as any)?.needsOnboarding || false}
        />
      )}
    </div>
  );
}
