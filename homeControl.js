const http = require("http");
const { GoogleGenAI } = require("@google/genai");

const API_KEY = "AIsssssssssssssc";
const ai = new GoogleGenAI({ apiKey: API_KEY });

// The mock state of our smart home!
const lights = {
  kitchen: false,
  bathroom: false,
  bedroom: false,
  living_room: false,
  garage: false,
  hall: false
};

// Define the tool (function) that Gemini is allowed to use
const homeAssistantTools = [{
  functionDeclarations: [
    {
      name: "setLightOn",
      description: "Turns a specific light in a room ON or OFF.",
      parameters: {
        type: "OBJECT",
        properties: {
          room: { 
            type: "STRING", 
            description: "The room to control.",
            enum: ["kitchen", "bathroom", "bedroom", "living_room", "garage", "hall"] 
          },
          is_on: { 
            type: "BOOLEAN", 
            description: "true to turn the light ON, false to turn it OFF." 
          }
        },
        required: ["room", "is_on"]
      }
    }
  ]
}];

// Initialize a persistent chat with our tool bound to it
const chat = ai.chats.create({
  model: "gemini-2.5-flash",
  config: {
    systemInstruction: "You are a helpful smart home assistant. You manage the lights in the house. Note that the hall connects all rooms together, and you must always turn on the hall light when routing a person between rooms. Always enthusiastically confirm when you turn a light on or off. If the user asks for a room that doesn't exist, politely tell them.",
    tools: homeAssistantTools
  }
});

// ----------------------------------------------------------------------------------
// Frontend HTML / CSS / JS
// ----------------------------------------------------------------------------------
const HTML_UI = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Gemini Home Assistant</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #eef2f5; margin: 0; display: flex; height: 100vh; }
    .sidebar { width: 300px; background: #fff; padding: 20px; box-shadow: 2px 0 10px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 15px; }
    .light-card { background: #fafafa; border: 1px solid #eee; padding: 15px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; font-weight: 500; font-size: 16px; text-transform: capitalize; transition: 0.3s; }
    .light-card.on { background: #fff9e6; border-color: #ffd166; box-shadow: 0 4px 10px rgba(255,209,102,0.2); }
    .bulb { font-size: 24px; filter: grayscale(1); transition: 0.3s; }
    .light-card.on .bulb { filter: drop-shadow(0 0 10px #ffd166) grayscale(0); }
    
    .main { flex: 1; padding: 30px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    #chat-container { width: 100%; max-width: 600px; background: white; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.08); overflow: hidden; display: flex; flex-direction: column; height: 100%; max-height: 800px; }
    #messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
    .msg { padding: 12px 16px; border-radius: 18px; max-width: 80%; line-height: 1.4; white-space: pre-wrap; }
    .user { background: #007bff; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
    .bot { background: #f1f3f5; color: #333; align-self: flex-start; border-bottom-left-radius: 4px; }
    .sys { font-size: 0.8em; color: #888; align-self: center; background: none; margin-bottom: -5px; }
    
    #input-area { display: flex; padding: 15px; border-top: 1px solid #eee; background: #fff; }
    input { flex: 1; padding: 12px 18px; border: 1px solid #ddd; border-radius: 25px; outline: none; font-size: 15px; }
    button { margin-left: 10px; padding: 0 25px; background: #007bff; color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 15px; display: flex; align-items: center; }
    button:disabled { background: #ccc; }
    h2 { margin-top: 0; color: #333; }
  </style>
</head>
<body>

  <!-- Smart Home Dashboard Panel -->
  <div class="sidebar" id="dashboard">
    <h2>My Home 🏠</h2>
    <!-- Lights will be injected here -->
  </div>

  <!-- Chat Panel -->
  <div class="main">
    <div id="chat-container">
      <div id="messages">
        <div class="msg bot">Hello! I'm your Gemini Home Assistant! I can magically turn on/off the lights. Just ask me to turn on the bathroom, for example.</div>
      </div>
      <div id="input-area">
        <input type="text" id="userInput" placeholder="Ask your assistant..." onkeypress="handleEnter(event)" />
        <button id="sendBtn" onclick="sendMessage()">Send</button>
      </div>
    </div>
  </div>

  <script>
    const msgs = document.getElementById("messages");
    const input = document.getElementById("userInput");
    const btn = document.getElementById("sendBtn");
    const dashboard = document.getElementById("dashboard");

    // Initialize the UI lights
    let currentLights = { kitchen: false, bathroom: false, bedroom: false, living_room: false, garage: false, hall: false };

    function renderLights() {
      // Clear all children except the H2 title
      while(dashboard.children.length > 1) { dashboard.removeChild(dashboard.lastChild); }
      
      for (const [room, isOn] of Object.entries(currentLights)) {
        const card = document.createElement("div");
        card.className = "light-card " + (isOn ? "on" : "");
        
        // Replace underscore with space for display
        const roomName = room.replace("_", " ");
        card.innerHTML = "<span>" + roomName + "</span> <span class='bulb'>" + (isOn ? '💡' : '🌑') + "</span>";
        dashboard.appendChild(card);
      }
    }
    renderLights(); // initial render

    function appendMessage(text, type) {
      const el = document.createElement("div");
      el.className = "msg " + type;
      el.textContent = text;
      msgs.appendChild(el);
      msgs.scrollTop = msgs.scrollHeight;
    }

    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;

      appendMessage(text, "user");
      input.value = "";
      input.disabled = true;
      btn.disabled = true;

      try {
        const response = await fetch("/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text })
        });
        
        const data = await response.json();
        
        // In case the AI triggered a tool, show a little system message for visual coolness!
        if (data.toolsCalled && data.toolsCalled.length > 0) {
          data.toolsCalled.forEach(t => appendMessage("⚡ System: Executed " + t.name + "(" + JSON.stringify(t.args) + ")", "sys"));
        }

        // Output final text
        appendMessage(data.response, "bot");
        
        // Update dashboard!
        if(data.lights) {
          currentLights = data.lights;
          renderLights();
        }

      } catch(err) {
        appendMessage("Network error: " + err.message, "bot");
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

// ----------------------------------------------------------------------------------
// Backend Logic
// ----------------------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(HTML_UI);
  } 
  
  else if (req.method === "POST" && req.url === "/chat") {
    let body = "";
    req.on("data", chunk => body += chunk.toString());
    req.on("end", async () => {
      try {
        const { message } = JSON.parse(body);
        
        // 1. Send the user's message to the model
        let response = await chat.sendMessage({ message });
        let toolsCalled = [];
        
        // 2. Check if the model decided it needs to call our function!
        // We use a while loop because it might want to call multiple tools consecutively
        // (like if someone says "turn on the kitchen and the bathroom")
        while (response.functionCalls && response.functionCalls.length > 0) {
          
          const functionResponses = [];
          
          for (const call of response.functionCalls) {
            console.log("Model requested function: " + call.name, call.args);
            toolsCalled.push({ name: call.name, args: call.args });
            
            if (call.name === "setLightOn") {
              const { room, is_on } = call.args;
              
              // Validate and update our server's state
              if (lights.hasOwnProperty(room)) {
                lights[room] = is_on;
                console.log("Backend: Updated " + room + " to " + is_on);
                
                // Tell the model it was a success!
                functionResponses.push({
                  functionResponse: {
                    name: "setLightOn",
                    response: { result: "success", new_state: is_on }
                  }
                });
              } else {
                functionResponses.push({
                  functionResponse: {
                    name: "setLightOn",
                    response: { error: "Room not found in house." }
                  }
                });
              }
            }
          }
          
          // 3. Send the function result(s) back to the model so it can finish its thought
          response = await chat.sendMessage({ message: functionResponses });
        }

        // 4. Send the final text and the current state of the home down to the frontend
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ 
          response: response.text, 
          lights: lights,
          toolsCalled: toolsCalled
        }));

      } catch (err) {
        console.error("Chat error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } 
  else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log("Home Assistant server is running! Open http://localhost:" + PORT + " in your browser.");
});
