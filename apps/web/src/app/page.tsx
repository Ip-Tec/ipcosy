"use client";

export const dynamic = "force-dynamic";

import { useTheme } from "next-themes";
import { useState, useEffect, useRef, Suspense } from "react";
import { IpSocket } from "@ipcosy/ip-socket";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { useSession, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { SharedCity } from "@/lib/shared-city";
import { OnboardingModal } from "@/components/onboarding-modal";
import { LandingPage } from "@/components/landing-page";

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

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      if (selectedChatRef.current && !event.state?.ipcosyChatOpen) setSelectedChat(null);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!selectedChat) {
      if (history.state?.ipcosyChatOpen) history.replaceState({ ...history.state, ipcosyChatOpen: false }, "", window.location.href);
      return;
    }
    if (!history.state?.ipcosyChatOpen) history.pushState({ ...history.state, ipcosyChatOpen: true }, "", window.location.href);
  }, [selectedChat]);

  useEffect(() => {
    const openChat = (event: Event) => {
      const chatId = (event as CustomEvent<{ chatId?: string }>).detail?.chatId;
      if (chatId) setSelectedChat(chatId);
    };
    window.addEventListener("ipcosy:open-chat", openChat);
    return () => window.removeEventListener("ipcosy:open-chat", openChat);
  }, []);

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

    } else {
      setSelectedChatInfo(null);
      if (selectedChat !== "mvp-lobby") setMessages([]);
    }
  }, [selectedChat, status, searchParams]);

  const sendingRef = useRef(false);
  const handleSend = async (fileUrl?: string, sharedCity?: SharedCity | null): Promise<boolean> => {
    if (sendingRef.current || !visitorId || (!inputText.trim() && !fileUrl)) return false;
    sendingRef.current = true;
    const chatId = selectedChat || "mvp-lobby";
    const text = inputText;
    try {
      const response = await fetch("/api/messages/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, text, fileUrl, isAnonymous, sharedCity }),
      });
      const message = await response.json();
      if (!response.ok) throw new Error(message.error || "Message could not be sent");
      if ((selectedChatRef.current || "mvp-lobby") === chatId) {
        setMessages((previous) => previous.some((item) => item.id === message.id) ? previous : [...previous, message]);
        setInputText((current) => current === text ? "" : current);
      }
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Message could not be sent");
      return false;
    } finally { sendingRef.current = false; }
  };

  // Refresh recipient-filtered history so both API sending paths appear without reloading.
  useEffect(() => {
    if (!selectedChat) return;
    setIsLoadingMessages(true);
    const controller = new AbortController();
    let running = false;
    const refresh = async () => {
      if (running || document.hidden) return;
      running = true;
      try {
        const response = await fetch("/api/groups/messages?chatId=" + encodeURIComponent(selectedChat), { cache: "no-store", signal: controller.signal });
        if (response.ok) {
          const data = await response.json();
          if (!controller.signal.aborted && Array.isArray(data)) setMessages((previous) => JSON.stringify(previous) === JSON.stringify(data) ? previous : data);
        }
      } catch { /* Keep history during temporary connection failures. */ }
      finally { running = false; if (!controller.signal.aborted) setIsLoadingMessages(false); }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 4000);
    return () => { clearInterval(timer); controller.abort(); };
  }, [selectedChat, status]);

  useEffect(() => {
    if (!visitorId) return;
    const controller = new AbortController();
    const timer = setInterval(() => {
      if (document.hidden) return;
      void fetch("/api/groups/list", { cache: "no-store", signal: controller.signal })
        .then(async (response) => response.ok ? response.json() : null)
        .then((data) => { if (!controller.signal.aborted && Array.isArray(data)) setChats(data); })
        .catch(() => {});
    }, 8000);
    return () => { clearInterval(timer); controller.abort(); };
  }, [visitorId]);

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

  if (status === "unauthenticated" && !joinCodeParam) {
    return (
      <LandingPage
        onContinue={() => {
          if (visitorId) document.cookie = "ipcosy-fingerprint=" + visitorId + "; path=/; max-age=31536000";
          void signIn("google");
        }}
      />
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
