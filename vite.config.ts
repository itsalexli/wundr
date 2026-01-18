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
            const { prompt, image } = body;

            if (!prompt) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Prompt required' }));
              return;
            }

            console.log(`🍌 Nano Banana: Received prompt "${prompt}"`);
            if (image) console.log(`🍌 Nano Banana: Received image data (length: ${image.length})`);

            const apiKey = process.env.GEMINI_API_KEY;

            if (!apiKey) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Missing GEMINI_API_KEY in .env' }));
              return;
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            // using the requested specialized model
            const model = genAI.getGenerativeModel({ model: "nano-banana-pro-preview" });

            const basePrompt = `
              You are an expert pixel art generator. Generate 4 SVG images for a character described as: "${prompt}".
              
              STYLE RULES:
              - STRICT 8-bit pixel art style (approx 32x32 pixel grid).
              - Use solid colors ONLY. NO gradients, NO blurring, NO anti-aliasing.
              - Distinct, readable shapes with clear outlines (1px thick preferred).
              - Cute, simple, retro RPG aesthetics (Earthbound/Pokemon style).
              
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

            let geminiPrompt: any = basePrompt;
            
            if (image) {
                const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
                // For vision, we pass an array with text + image
                geminiPrompt = [
                    basePrompt + "\n\nUse the attached sketch as a visual reference.",
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: "image/png",
                        },
                    }
                ];
            }

            console.log('🍌 Nano Banana: Sending request to Gemini...');
            const result = await model.generateContent(geminiPrompt);
            const response = await result.response;
            const textFn = response.text();
            console.log('🍌 Nano Banana: Received response from Gemini');
            
            // Clean markdown code blocks if present
            const jsonStr = textFn.replace(/```json/g, '').replace(/```/g, '').trim();
            const svgs = JSON.parse(jsonStr);

            // 3. Save Files
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
                paths[key] = `/src/assets/generated/${id}/${filename}`;
              }
            }

            console.log(`🍌 Nano Banana: Saved sprites to ${assetsDir}`);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              success: true, 
              paths: paths
            }));

          } catch (error: any) {
            console.error('🍌 Nano Banana Error Details:', error);
            if (error.response) {
                console.error('API Response Error:', await error.response.text());
            }
            res.statusCode = 500;
            const message = error instanceof Error ? error.message : String(error);
            res.end(JSON.stringify({ error: message }));
          }
        });
      }
    }
  ],
})
