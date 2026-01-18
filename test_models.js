import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error('No API key found');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        // There isn't a direct "listModels" on the instance in some versions, 
        // but typically it's on the class or via a specific manager.
        // Actually, for @google/generative-ai, it might not expose listModels directly in the client SDK easily 
        // equivalent to the REST API. 
        // Let's try to just test a few specific model names by running a dummy generation.
        
        const modelsToTest = [
            'gemini-pro',
            'gemini-1.5-flash-001',
            'gemini-1.5-flash-latest',
            'gemini-1.5-flash',
            'gemini-pro-vision',
            'gemini-1.0-pro'
        ];

        console.log("Testing model availability...");

        for (const modelName of modelsToTest) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                await model.generateContent("Hello");
                console.log(`✅ ${modelName} is AVAILABLE`);
            } catch (e) {
                console.log(`❌ ${modelName} failed: ${e.message}`); 
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

listModels();
