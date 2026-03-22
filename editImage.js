const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const genAI = new GoogleGenerativeAI("YOUR_KEY");

async function main() {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image",
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
    });

    // Read source image
    const imageData = fs.readFileSync(path.join(__dirname, "sample.png"));
    const base64Image = imageData.toString("base64");

    const result = await model.generateContent([
      "Edit this image: replace the dog with a cat. Keep everything else exactly the same.",
      { inlineData: { mimeType: "image/png", data: base64Image } },
    ]);

    const parts = result.response.candidates[0].content.parts;
    for (const part of parts) {
      if (part.inlineData) {
        const ext = part.inlineData.mimeType.split("/")[1];
        fs.writeFileSync(`edited.${ext}`, Buffer.from(part.inlineData.data, "base64"));
        console.log(`Saved edited.${ext}`);
      }
      if (part.text) console.log("Text:", part.text);
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

main();
