export function messageView(message: any, viewerId: string | null, isPremium: boolean) {
  const isMe = message.userId === viewerId;
  const anonymous = message.isAnonymous || (!!message.user.fingerprint && !message.user.email);
  return {
    id: message.id, text: message.content, fileUrl: message.fileUrl,
    createdAt: new Date(message.createdAt).toISOString(),
    sender: isMe ? "me" : "them",
    alias: anonymous && !isMe ? "Anonymous" : message.user.username || message.user.name || "Anonymous",
    visitorId: anonymous && !isMe ? "anonymous" : message.userId,
    time: new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
    isAnonymous: anonymous,
    metadata: isPremium && !isMe ? {
      deviceType: message.deviceType, deviceOS: message.deviceOS, browser: message.browser,
      city: message.city, country: message.country,
    } : null,
  };
}
