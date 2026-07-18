import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './firebase.js'; 
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { sendPlanTelegram } from './telegramServices.js';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize the Gemini Model via LangChain
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3.5-flash", 
  maxOutputTokens: 2048,
});

app.post('/api/test-db', async (req, res) => {
  try {
    const docRef = db.collection('users').doc('test-user-id');
    await docRef.set({
      email: 'test@example.com',
      telegramChatId: '123456789', // Added to the test mock
      fitnessGoal: 'Build muscle',
      equipment: 'Dumbbells',
      dietaryRestrictions: 'None',
      createdAt: new Date().toISOString()
    });
    res.json({ message: "Successfully wrote to Firestore!" });
  } catch (error) {
    console.error("Firebase error:", error);
    res.status(500).json({ error: "Failed to connect to Firebase." });
  }
});

// --- Test Telegram Route ---
app.post('/api/test-telegram', async (req, res) => {
  try {
    // Sends a test message using the ID from your .env file
    const success = await sendPlanTelegram(
      "Hello! This is a test transmission from your AI Agent."
    );

    if (success) {
      res.json({ message: "Test message sent successfully! Check Telegram." });
    } else {
      res.status(500).json({ error: "Failed to send message. Check terminal for errors." });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error during Telegram test." });
  }
});

// --- Manual Cron Trigger Route ---
// Note: You can keep this URL the same so you don't have to update cron-job.org
app.get('/api/trigger-emails', (req, res) => { 
  const { secret } = req.query;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 1. IMMEDIATELY send success back to cron-job.org so it hangs up happily
  res.status(200).json({ message: 'Job triggered! Processing notifications in the background.' });

  // 2. Fire off the heavy lifting function in the background (no 'await')
  processDailyNotifications().catch(error => console.error("Background task failed:", error));
});

// --- The Heavy Lifting Function ---
async function processDailyNotifications() {
  try {
    console.log("Wake up! Triggering daily AI fitness Telegram notifications...");
    
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('No users found in database.');
      return; 
    }

    for (const doc of usersSnapshot.docs) {
      const user = doc.data();

      // Skip this user if they haven't connected their Telegram yet
      if (!user.telegramChatId) {
        console.log(`Skipping ${user.email}: No Telegram Chat ID found.`);
        continue;
      }

      console.log(`Generating plan for: ${user.email} (Telegram ID: ${user.telegramChatId})`);

      const promptTemplate = PromptTemplate.fromTemplate(`
        You are an expert personal trainer and nutritionist. 
        Create a 1-day workout and meal plan for this user:
        - Goal: {fitnessGoal}
        - Equipment: {equipment}
        - Diet: {dietaryRestrictions}

        CRITICAL INSTRUCTION: You must be concise. Keep your entire response under 3,500 characters so it fits inside a single Telegram message limit. Use bullet points and avoid overly long paragraphs. Format nicely in Markdown.
      `);
      
      const chain = promptTemplate.pipe(llm);
      const response = await chain.invoke({
        fitnessGoal: user.fitnessGoal,
        equipment: user.equipment,
        dietaryRestrictions: user.dietaryRestrictions
      });

      // Pass the user's specific Telegram Chat ID from Firestore
      const success = await sendPlanTelegram(user.telegramChatId, response.content);

      if(success) {
        console.log(`✅ Plan successfully sent to Telegram for ${user.email}`);
      } else {
        console.error(`❌ Failed to send Telegram plan to ${user.email}`);
      }
      
      // The 4-second delay to prevent rate-limiting from Gemini/Telegram
      await delay(4000); 
    }
    
    console.log("🎉 All daily notifications finished!");

  } catch (error) {
    console.error('Error in background notification task:', error);
  }
}

app.get('/', (req, res) => {
  res.send('AI Fitness Planner Backend is running!');
});

// LangChain/Gemini Generation Route
app.post('/api/generate-plan', async (req, res) => {
  try {
    const { fitnessGoal, equipment, dietaryRestrictions } = req.body;
    console.log("Generating plan for goal:", fitnessGoal);

    const promptTemplate = PromptTemplate.fromTemplate(`
      You are an expert personal trainer and nutritionist. 
      Create a highly structured 1-day workout and meal plan for a user with the following profile:
      
      - Fitness Goal: {fitnessGoal}
      - Available Equipment: {equipment}
      - Dietary Restrictions: {dietaryRestrictions}

      Please format your response clearly using Markdown. Include a "Workout Plan" section and a "Meal Plan" section. Ensure the workout matches the available equipment and the meals respect the dietary restrictions.
    `);

    const chain = promptTemplate.pipe(llm);
    const response = await chain.invoke({
      fitnessGoal: fitnessGoal || "General fitness",
      equipment: equipment || "No equipment (Bodyweight)",
      dietaryRestrictions: dietaryRestrictions || "None"
    });

    res.json({ plan: response.content });

  } catch (error) {
    console.error("Error generating plan:", error);
    res.status(500).json({ error: "Failed to generate plan." });
  }
});

// --- User Registration Route ---
app.post('/api/users', async (req, res) => {
  try {
    // Added telegramChatId to the destructured body
    const { email, fitnessGoal, equipment, dietaryRestrictions, telegramChatId } = req.body;

    if (!email || !fitnessGoal || !equipment || !dietaryRestrictions) {
      return res.status(400).json({ error: 'All primary fields are required.' });
    }

    const userRef = db.collection('users').doc(email);
    
    // Merge handles updating existing documents without overwriting unprovided fields
    await userRef.set({
      email,
      fitnessGoal,
      equipment,
      dietaryRestrictions,
      ...(telegramChatId && { telegramChatId }), // Only add it if the user provided it
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log(`✅ New user registered/updated: ${email}`);
    res.status(200).json({ message: 'User preferences saved successfully!' });

  } catch (error) {
    console.error('Error saving user to Firebase:', error);
    res.status(500).json({ error: 'Failed to save user data.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});