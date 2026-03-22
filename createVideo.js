const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");

const API_KEY = "YOUR_KEY";
const ai = new GoogleGenAI({ apiKey: API_KEY });

async function main() {
  try {
    // 1. Submit video generation
    console.log("Submitting video generation...");
    let operation = await ai.models.generateVideos({
      model: "veo-3.0-fast-generate-001",
      prompt: "A cute Arduino wearing a tiny top hat, sitting on old books in a cozy library, looking at camera and blinking LEDs slowly, cinematic lighting",
      config: { aspectRatio: "16:9", numberOfVideos: 1 },
    });

    const opName = operation.name;
    console.log("Operation:", opName);

    // 2. Poll until done
    while (!operation.done) {
      await new Promise(r => setTimeout(r, 5000));
      process.stdout.write(".");
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/${opName}?key=${API_KEY}`);
      operation = await resp.json();
    }

    console.log("\nDone! Downloading video...");

    // 3. Save video
    const videos = operation.response.generateVideoResponse.generatedSamples;
    for (let i = 0; i < videos.length; i++) {
      const uri = videos[i].video.uri;
      const resp = await fetch(`${uri}&key=${API_KEY}`);
      const buffer = Buffer.from(await resp.arrayBuffer());
      fs.writeFileSync(`video_${i}.mp4`, buffer);
      console.log(`Saved video_${i}.mp4 (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

main();
