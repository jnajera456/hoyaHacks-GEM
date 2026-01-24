import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

// Create client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Best free general model
const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
});

async function run() {
  const result = await model.generateContent(
    "Find the race condition in this multi-threaded C++ snippet: [code here]"
  );

  console.log(result.response.text());
}

run();
