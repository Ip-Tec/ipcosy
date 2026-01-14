import WebSocket from "ws";

const URL = "ws://localhost:8080";
const ws = new WebSocket(URL);

ws.on("open", () => {
  console.log("Connected to " + URL);

  // 1. Send ID only to register socket?
  // Code seems to assume payload has visitorId every time?

  // 2. Send Message
  const payload = {
    visitorId: "test-verifier",
    text: "Test Message",
    type: "chat",
    chatId: "mvp-lobby",
  };

  console.log("Sending:", payload);
  ws.send(JSON.stringify(payload));

  // 3. Send Anonymous
  setTimeout(() => {
    const anonPayload = {
      visitorId: "test-verifier",
      text: "Test Anonymous",
      type: "chat",
      chatId: "mvp-lobby",
      isAnonymous: true,
    };
    console.log("Sending Anonymous:", anonPayload);
    ws.send(JSON.stringify(anonPayload));
  }, 1000);
});

ws.on("message", (data) => {
  console.log("Received:", data.toString());
});

ws.on("error", (err) => {
  console.error("Connection error:", err.message);
  process.exit(1);
});

ws.on("close", (code, reason) => {
  console.log(`Connection closed: ${code} ${reason}`);
  process.exit(0);
});
