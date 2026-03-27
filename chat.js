const http = require("http");
const { GoogleGenAI } = require("@google/genai");

const API_KEY = "Adddddddddd9lc";
const ai = new GoogleGenAI({ apiKey: API_KEY });

const chat = ai.chats.create({
  model: "gemini-2.5-flash",
  config: {
    systemInstruction: "You are a concise, helpful assistant. Please keep answers relatively brief.",
  }
});

const HTML_UI = `
<!DOCTYPE html>
<html>
<head>
  <title>Streaming Gemini Chat</title>
  <style>
    body { font-family: sans-serif; background: #f0f2f5; margin: 0; padding: 20px; display: flex; justify-content: center; }
    #chat-container { width: 100%; max-width: 600px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; display: flex; flex-direction: column; height: 80vh; }
    #messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
    .msg { padding: 10px 14px; border-radius: 18px; max-width: 80%; line-height: 1.4; white-space: pre-wrap; }
    .user { background: #007bff; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
    .bot { background: #f1f0f0; color: black; align-self: flex-start; border-bottom-left-radius: 4px; }
    #input-area { display: flex; padding: 10px; border-top: 1px solid #ddd; background: #fafafa; }
    input { flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 20px; outline: none; }
    button { margin-left: 10px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 20px; cursor: pointer; }
    button:disabled { background: #ccc; }
  </style>
</head>
<body>
  <div id="chat-container">
    <div id="messages">
      <div class="msg bot">Hello! I am Gemini. What would you like to chat about? (I stream live!)</div>
    </div>
    <div id="input-area">
      <input type="text" id="userInput" placeholder="Type a message..." onkeypress="handleEnter(event)" />
      <button id="sendBtn" onclick="sendMessage()">Send</button>
    </div>
  </div>

  <script>
    const msgs = document.getElementById("messages");
    const input = document.getElementById("userInput");
    const btn = document.getElementById("sendBtn");

    function createUserMessage(text) {
      const el = document.createElement("div");
      el.className = "msg user";
      el.textContent = text;
      msgs.appendChild(el);
      msgs.scrollTop = msgs.scrollHeight;
    }

    function createBotMessage() {
      const el = document.createElement("div");
      el.className = "msg bot";
      msgs.appendChild(el);
      return el;
    }

    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;

      createUserMessage(text);
      input.value = "";
      input.disabled = true;
      btn.disabled = true;

      // Create a new blank bubble for the bot's incoming text
      const botEl = createBotMessage();

      try {
        const response = await fetch("/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text })
        });
        
        // Read the stream chunk-by-chunk using the Streams API
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunkStr = decoder.decode(value, { stream: true });
          botEl.textContent += chunkStr;
          msgs.scrollTop = msgs.scrollHeight; // Scroll down as text streams in
        }
      } catch(err) {
        botEl.textContent = "Network error.";
      } finally {
        input.disabled = false;
        btn.disabled = false;
        input.focus();
      }
    }

    function handleEnter(e) {
      if(e.key === "Enter") sendMessage();
    }
  </script>
</body>
</html>
`;

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(HTML_UI);
  } else if (req.method === "POST" && req.url === "/chat") {
    let body = "";
    req.on("data", chunk => { body += chunk.toString(); });
    req.on("end", async () => {
      try {
        const { message } = JSON.parse(body);
        
        // Prepare to send chunks as plain text stream
        res.writeHead(200, { "Content-Type": "text/plain", "Transfer-Encoding": "chunked" });
        
        // Use streaming!
        const resultStream = await chat.sendMessageStream({ message });
        for await (const chunk of resultStream) {
          // Send exactly the piece of text we just received
          if (chunk.text) {
            res.write(chunk.text);
          }
        }
        res.end();
      } catch (err) {
        console.error("Chat error:", err.message);
        res.end("Failed to get response from Gemini.");
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log("Web chat server (Streaming) is running! Open http://localhost:" + PORT);
});
