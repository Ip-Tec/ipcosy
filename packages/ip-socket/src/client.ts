import { EventEmitter } from "events";
import { MessagePayload } from "./types";

type Config = {
  url: string;
  autoConnect?: boolean;
};

export class IpSocket extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private shouldReconnect: boolean = true;

  constructor(config: Config) {
    super();
    this.url = config.url;
    if (config.autoConnect) {
      this.connect();
    }
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.emit("connect");
    };

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        this.emit("message", payload);
      } catch (e) {
        console.error("Failed to parse message", e);
      }
    };

    this.ws.onclose = () => {
      this.emit("disconnect");
      if (this.shouldReconnect) {
        setTimeout(() => this.connect(), 3000);
      }
    };

    this.ws.onerror = (error) => {
      if (this.listenerCount("error") > 0) {
        this.emit("error", error);
      } else {
        console.error("IpSocket error (no listeners):", error);
      }
    };
  }

  send(data: MessagePayload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn("Socket not open, cannot send.");
    }
  }

  setTyping(visitorId: string, isTyping: boolean) {
    this.send({
      visitorId,
      type: "typing",
      text: isTyping ? "typing..." : "",
    });
  }

  disconnect() {
    this.shouldReconnect = false;
    this.ws?.close();
  }
}
