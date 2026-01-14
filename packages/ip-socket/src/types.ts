export type MessagePayload = {
  visitorId: string;
  text?: string;
  fileUrl?: string;
  type?: "chat" | "typing";
  chatId?: string;
  isAnonymous?: boolean;
};

export type ServerEvent =
  | { type: "echo"; data: MessagePayload }
  | { type: "error"; message: string }
  | { type: "typing"; visitorId: string; isTyping: boolean; chatId?: string }
  | { type: "chat"; data: MessagePayload; chatId?: string };
