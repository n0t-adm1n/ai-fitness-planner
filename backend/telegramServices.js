import dotenv from 'dotenv';
dotenv.config();

export const sendPlanTelegram = async (markdownPlan) => {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    // The official Telegram API endpoint for sending text messages
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    // 1. Send the HTTP POST request to Telegram's servers
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        // 2. We combine a title with the raw Gemini markdown plan
        text: `💪 **Your Daily AI Fitness Plan**\n\n${markdownPlan}`,
      }),
    });

    const data = await response.json();

    // 3. Check if Telegram rejected the message
    if (!data.ok) {
      console.error('Telegram API Error:', data.description);
      return false;
    }

    console.log('✅ Plan successfully sent to Telegram!');
    return true;

  } catch (error) {
    console.error('Unexpected error in Telegram service:', error);
    return false;
  }
};