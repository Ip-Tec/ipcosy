import { WebSocketServer, WebSocket } from "ws";
import { createServer, Server } from "http";
import { ServerEvent, MessagePayload } from "./types";

export abstract class IpServer {
  protected wss: WebSocketServer;
  protected httpServer: Server;

  public constructor(port: number) {
    this.httpServer = createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("IPCosy Socket Server Running");
    });

    this.wss = new WebSocketServer({ server: this.httpServer });
    this.init();

    this.httpServer.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
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
