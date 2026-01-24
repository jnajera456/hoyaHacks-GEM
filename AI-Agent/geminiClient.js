import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
});

/**
 * Generate text from Gemini
 * @param {string} prompt
 * @returns {Promise<string>} generated text
 */
export async function generateText(prompt) {
    const result = await model.generateContent(prompt);
    return result.response.text();
}
