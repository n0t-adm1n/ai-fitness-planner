import dotenv from 'dotenv';
dotenv.config();

export const sendPlanTelegram = async (chatId, markdownPlan) => {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    // 1. Safely convert Gemini's Markdown to explicit HTML
    let safeHTML = markdownPlan
      // Convert Markdown headers (###) into HTML bold
      .replace(/#{1,6}\s?(.*)/g, '<b>$1</b>')
      // Convert Markdown bold (**) into HTML bold
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      // Convert asterisk or dash bullet points into a clean Unicode dot
      .replace(/^\s*[\*\-]\s/gm, '• ')
      // Strip out any remaining rogue asterisks so they print cleanly
      .replace(/\*/g, '');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        // Wrap the title in HTML bold tags
        text: `💪 <b>Your Daily AI Fitness Plan</b>\n\n${safeHTML}`,
        parse_mode: 'HTML', // 2. Tell Telegram to use the much safer HTML parser!
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Telegram API Error:', data.description);
      return false;
    }

    return true;

  } catch (error) {
    console.error('Unexpected error in Telegram service:', error);
    return false;
  }
};