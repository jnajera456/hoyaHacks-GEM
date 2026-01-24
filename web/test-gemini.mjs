import "dotenv/config";
import { GoogleGenerativeAI } from '@google/generative-ai';



const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
});

async function run() {
    const result = await model.generateContent(
        "Explain quantum computing simply");
    console.log(result.response.text());
}
run();