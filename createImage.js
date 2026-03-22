const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

const genAI = new GoogleGenerativeAI("YOUR_KEY");

async function main() {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image",
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
    });

    const result = await model.generateContent("Generate an image of a cute resistor wearing a tiny top hat sitting on a stack of books");
    const parts = result.response.candidates[0].content.parts;

    for (const part of parts) {
      if (part.inlineData) {
        const ext = part.inlineData.mimeType.split("/")[1];
        fs.writeFileSync(`generated.${ext}`, Buffer.from(part.inlineData.data, "base64"));
        console.log(`Image saved to generated.${ext}`);
      }
      if (part.text) console.log("Text:", part.text);
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

main();
