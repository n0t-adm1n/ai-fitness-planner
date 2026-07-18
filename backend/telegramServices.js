import dotenv from 'dotenv';
dotenv.config();

export const sendPlanTelegram = async (chatId, markdownPlan) => {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    // 1. Clean up the Markdown for Telegram!
    // Convert headers (### Heading) into Telegram bold text (*Heading*)
    let telegramFriendlyText = markdownPlan.replace(/#{1,3}\s?(.*)/g, '*$1*');
    
    // Convert Gemini's double asterisks (**) into Telegram's single asterisks (*)
    telegramFriendlyText = telegramFriendlyText.replace(/\*\*/g, '*');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        // Notice we changed the title's asterisks to single ones too!
        text: `💪 *Your Daily AI Fitness Plan*\n\n${telegramFriendlyText}`,
        parse_mode: 'Markdown', // 2. Tell Telegram to render the formatting!
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