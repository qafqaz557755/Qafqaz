import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import FormData from "form-data";
import axios from "axios";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase limit for base64 images
  app.use(express.json({ limit: '10mb' }));

  // Telegram - Send Text Message
  app.post("/api/telegram/sendMessage", async (req, res) => {
    const startTime = Date.now();
    try {
      const { message, token: customToken, chatId: customChatId } = req.body;
      const token = customToken || process.env.TELEGRAM_BOT_TOKEN || '8673904341:AAEapa7zbc91pB6IZa1qvsgn_MTHu1BaqBg';
      const chatId = customChatId || process.env.TELEGRAM_CHAT_ID || '6729560415';

      if (!token || !chatId) {
        return res.status(500).json({ error: "Telegram config missing" });
      }

      console.log(`[${new Date().toISOString()}] Sending text to ${chatId}...`);

      const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      }, { timeout: 25000 });

      const duration = Date.now() - startTime;
      console.log(`Text sent successfully in ${duration}ms`);
      return res.json({ ok: true });
    } catch (error: any) {
      console.error("Telegram Message Error:", error.response?.data || error.message);
      return res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
    }
  });

  // Telegram - Send Photo (Direct upload)
  app.post("/api/telegram/sendPhoto", async (req, res) => {
    const startTime = Date.now();
    try {
      const { photo: base64Photo, caption, token: customToken, chatId: customChatId } = req.body;
      const token = customToken || process.env.TELEGRAM_BOT_TOKEN || '8673904341:AAEapa7zbc91pB6IZa1qvsgn_MTHu1BaqBg';
      const chatId = customChatId || process.env.TELEGRAM_CHAT_ID || '6729560415';

      if (!token || !chatId || !base64Photo) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      console.log(`[${new Date().toISOString()}] Processing photo for ${chatId}...`);

      const base64Data = base64Photo.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');

      const form = new FormData();
      form.append('chat_id', chatId);
      form.append('photo', buffer, { filename: 'photo.jpg', contentType: 'image/jpeg' });
      if (caption) {
        form.append('caption', caption);
        form.append('parse_mode', 'HTML');
      }

      const response = await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, form, {
        headers: form.getHeaders(),
        timeout: 45000 // Longer timeout for photos
      });

      const duration = Date.now() - startTime;
      console.log(`Photo sent successfully to Telegram in ${duration}ms`);
      return res.json({ ok: true });
    } catch (error: any) {
      console.error("Telegram Photo Error:", error.response?.data || error.message);
      return res.status(error.status || error.response?.status || 500).json(error.response?.data || { error: error.message });
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
