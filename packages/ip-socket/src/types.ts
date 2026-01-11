export type MessagePayload = {
  visitorId: string;
  text?: string;
  fileUrl?: string;
  type?: "chat" | "typing";
  chatId?: string;
};

export type ServerEvent =
  | { type: "echo"; data: MessagePayload }
  | { type: "error"; message: string }
  | { type: "typing"; visitorId: string; isTyping: boolean };
