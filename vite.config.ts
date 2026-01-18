import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'nano-banana-backend',
      configureServer(server) {
        server.middlewares.use('/api/generate', async (req, res, next) => {
          if (req.method !== 'POST') return next();

          try {
            // 1. Parse Body
            const buffers = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const body = JSON.parse(Buffer.concat(buffers).toString());
            const { prompt } = body;

            if (!prompt) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Prompt required' }));
              return;
            }

            console.log(`🍌 Nano Banana: Received prompt "${prompt}"`);
            console.log(`🍌 Nano Banana: Received prompt "${prompt}"`);
            const apiKey = process.env.GEMINI_API_KEY;

            // 2. Call Gemini
            if (!apiKey) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Missing GEMINI_API_KEY in .env' }));
              return;
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            // Using a model seen in the available list
            const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

            const geminiPrompt = `
              You are a pixel art generator. Generate 4 SVG images for a character described as: "${prompt}".
              The style should be 8-bit pixel art, cute, simple, similar to retro game sprites (approx 32x32 viewbox), but detailed enough.
              
              Return ONLY a valid JSON object (no markdown formatting) with exactly these 4 keys: "front", "back", "left", "right".
              The value of each key must be the raw SVG string (starting with <svg...).
              
              Example format:
              {
                "front": "<svg ...>...</svg>",
                "back": "<svg ...>...</svg>",
                "left": "<svg ...>...</svg>",
                "right": "<svg ...>...</svg>"
              }
            `;

            const result = await model.generateContent(geminiPrompt);
            const response = await result.response;
            const textFn = response.text();
            
            // Clean markdown code blocks if present
            const jsonStr = textFn.replace(/```json/g, '').replace(/```/g, '').trim();
            const svgs = JSON.parse(jsonStr);

            // 3. Save Files
            // Create unique ID for this generation
            const id = Date.now().toString();
            const assetsDir = path.resolve(__dirname, 'src/assets/generated', id);
            
            if (!fs.existsSync(assetsDir)){
                fs.mkdirSync(assetsDir, { recursive: true });
            }

            const paths: Record<string, string> = {};
            for (const [key, svgContent] of Object.entries(svgs)) {
              if (typeof svgContent === 'string') {
                const filename = `${key}.svg`;
                fs.writeFileSync(path.join(assetsDir, filename), svgContent);
                // Return relative path for frontend to use
                paths[key] = `/src/assets/generated/${id}/${filename}`;
              }
            }

            console.log(`🍌 Nano Banana: Saved sprites to ${assetsDir}`);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              success: true, 
              paths: paths
            }));

          } catch (error) {
            console.error('🍌 Nano Banana Error:', error);
            res.statusCode = 500;
            const message = error instanceof Error ? error.message : String(error);
            res.end(JSON.stringify({ error: message }));
          }
        });
      }
    }
  ],
})
