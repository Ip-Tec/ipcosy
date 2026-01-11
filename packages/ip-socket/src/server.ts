import { WebSocketServer, WebSocket } from "ws";
import { ServerEvent, MessagePayload } from "./types";

export abstract class IpServer {
  protected wss: WebSocketServer;

  public constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.init();
  }

  private init() {
    this.wss.on("connection", (ws: WebSocket) => {
      ws.on("message", (data: Buffer | string | ArrayBuffer | Buffer[]) => {
        try {
          const payload = JSON.parse(data.toString()) as MessagePayload;
          this.onMessage(ws, payload);
        } catch (e) {
          console.error("Failed to parse message", e);
        }
      });
    });
  }

  public abstract onMessage(ws: WebSocket, payload: MessagePayload): void;

  public broadcast(event: ServerEvent) {
    const data = JSON.stringify(event);
    this.wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
}
