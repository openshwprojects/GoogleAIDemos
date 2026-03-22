const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const genAI = new GoogleGenerativeAI("YOUR_KEY");

async function main() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Read image and convert to base64
    const imagePath = path.join(__dirname, "sample.png");
    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString("base64");

    const result = await model.generateContent([
      "Describe this image in two sentences. What do you see?",
      {
        inlineData: {
          mimeType: "image/png",
          data: base64Image,
        },
      },
    ]);

    console.log(result.response.text());
  } catch (e) {
    console.error("Error:", e.message);
    if (e.errorDetails) console.error("Details:", JSON.stringify(e.errorDetails, null, 2));
  }
}

main();
