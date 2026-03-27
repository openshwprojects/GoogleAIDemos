const { GoogleGenAI } = require("@google/genai");

const API_KEY = "Afdssdflc";
const ai = new GoogleGenAI({ apiKey: API_KEY });

async function main() {
  try {
    console.log("Uploading video to Gemini...");
    const uploadedFile = await ai.files.upload({
      file: "cat_walking.mp4",
      mimeType: "video/mp4",
    });

    console.log(`Uploaded file as: ${uploadedFile.name}`);
    console.log("Waiting for video to be processed...");

    // Poll until the file is ACTIVE
    let fileState = await ai.files.get({ name: uploadedFile.name });
    while (fileState.state === "PROCESSING") {
      process.stdout.write(".");
      await new Promise(r => setTimeout(r, 2000));
      fileState = await ai.files.get({ name: uploadedFile.name });
    }
    console.log();

    if (fileState.state === "FAILED") {
      throw new Error("Video processing failed on Google's servers.");
    }

    console.log("Video processed! Asking Gemini to describe it...");
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { fileData: { fileUri: uploadedFile.uri, mimeType: uploadedFile.mimeType } },
        "Describe exactly what happens in this video. Provide details about the cat, the environment, and the camera movement."
      ]
    });

    console.log("\n--- Gemini's Description ---");
    console.log(response.text);

    // Optional: Delete the file after use
    await ai.files.delete({ name: uploadedFile.name });
    console.log("\n(Cleaned up uploaded file)");

  } catch (e) {
    console.error("Error:", e.message);
  }
}

main();
