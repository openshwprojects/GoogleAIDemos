const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: "YOUR_KEY" });

async function main() {
  try {
    console.log("Asking Gemini with Google Search grounding...\n");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "What is the current price of Bitcoin and Ethereum today?",
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // 1. Print the answer
    console.log("--- Answer ---");
    console.log(response.text);

    // 2. Print source citations
    const metadata = response.candidates[0]?.groundingMetadata;
    if (metadata?.groundingChunks) {
      console.log("\n--- Sources ---");
      metadata.groundingChunks.forEach((chunk, i) => {
        if (chunk.web) {
          console.log(`[${i + 1}] ${chunk.web.title || "Source"}`);
          console.log(`    ${chunk.web.uri}`);
        }
      });
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

main();
