import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Smart Fetch
  app.post("/api/smart-fetch", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview", // Note: Flash does not require googleSearch tool scope for standard prompts
        contents: `Extract application metadata from this URL: ${url}. 
        Return a JSON object with the following fields: 
        - name: string (the app name)
        - description: string (a short description)
        - category: string (one of: 教會, 職場, 工具, 創意, 數據, 遊戲, 其他)
        - icon: string (one of: Chat, Image, Music, Video, Brain, Zap, Church, Briefcase, BarChart, Heart)
        - aspectRatio: string (one of: 16:9, 4:3, 1:1, auto)
        
        If you cannot find specific info, make a best guess based on the content or URL string itself.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              icon: { type: Type.STRING },
              aspectRatio: { type: Type.STRING },
            },
            required: ["name", "description", "category", "icon", "aspectRatio"]
          }
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response text returned");
      }
      
      const result = JSON.parse(text);
      res.json(result);
    } catch (error: any) {
      console.error("Smart Fetch Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch data" });
    }
  });

  // API Route: Smart Search
  app.post("/api/smart-search", async (req, res) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview",
        contents: "List some examples of Google AI Studio application URLs or generic app names related to 'Jesse' or 'avt.jesse@gmail.com'. We do not have search capability, so generate a friendly message.",
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Smart Search Error:", error);
      res.status(500).json({ error: error.message || "Failed to search apps" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
