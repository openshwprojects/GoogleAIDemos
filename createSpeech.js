const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");

const ai = new GoogleGenAI({ apiKey: "YOUR_KEY" });

function writeWav(filename, pcmBuffer, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * bitsPerSample / 8, 28);
  header.writeUInt16LE(channels * bitsPerSample / 8, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  fs.writeFileSync(filename, Buffer.concat([header, pcmBuffer]));
}

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: "Hello! I am an Arduino wearing a tiny top hat. Pleased to meet you!",
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
      },
    });

    const audio = response.candidates[0].content.parts[0].inlineData;
    console.log("Audio format:", audio.mimeType);
    const pcm = Buffer.from(audio.data, "base64");

    if (audio.mimeType.includes("wav")) {
      fs.writeFileSync("speech.wav", pcm);
    } else {
      // Raw PCM — add WAV header (Gemini TTS outputs 24kHz 16-bit mono)
      writeWav("speech.wav", pcm);
    }
    console.log(`Saved speech.wav (${(fs.statSync("speech.wav").size / 1024).toFixed(0)} KB)`);
  } catch (e) {
    console.error("Error:", e.message);
  }
}

main();
