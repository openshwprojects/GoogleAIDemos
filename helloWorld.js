const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("YOUR_KEY_HERE");

async function main() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Say hello world and tell me a fun fact!");
    console.log(result.response.text());
  } catch (e) {
    console.error("Error:", e.message);
    if (e.errorDetails) console.error("Details:", JSON.stringify(e.errorDetails, null, 2));
  }
}

main();
