import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, token: customToken, chatId: customChatId } = req.body;
    const token = customToken || process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = customChatId || process.env.VITE_TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return res.status(500).json({ error: "Telegram config missing" });
    }

    const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    }, { timeout: 25000 });

    return res.json({ ok: true });
  } catch (error: any) {
    console.error("Telegram Message Error:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
}
