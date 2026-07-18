import dotenv from 'dotenv';
dotenv.config();

// 1. Update the function to accept TWO parameters: chatId and markdownPlan
export const sendPlanTelegram = async (chatId, markdownPlan) => {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    
    // We completely removed pulling the Chat ID from process.env 
    // because we are now passing it directly from Firestore!
    
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId, // 2. Uses the ID passed from Firebase
        text: `💪 **Your Daily AI Fitness Plan**\n\n${markdownPlan}`, // 3. Uses the actual Gemini plan
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