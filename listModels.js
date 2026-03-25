const API_KEY = "YOUR_KEY";

async function main() {
  try {
    console.log("Fetching available models...\n");
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await response.json();
    
    if (data.models) {
      for (const model of data.models) {
        console.log(`- ${model.name.padEnd(45)} | ${model.displayName}`);
      }
    } else {
      console.error("Failed to fetch models: ", data);
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

main();
