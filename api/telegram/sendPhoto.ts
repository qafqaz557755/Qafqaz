import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import FormData from 'form-data';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { photo: base64Photo, caption, token: customToken, chatId: customChatId } = req.body;
    const token = customToken || process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = customChatId || process.env.VITE_TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId || !base64Photo) {
      return res.status(400).json({ error: "Missing required fields" });
    }

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
      timeout: 45000 
    });

    return res.json({ ok: true });
  } catch (error: any) {
    console.error("Telegram Photo Error:", error.response?.data || error.message);
    return res.status(error.status || error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
}
