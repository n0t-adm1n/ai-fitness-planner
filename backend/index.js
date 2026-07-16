import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import {db} from './firebase.js'; // Import the Firestore database instance
import { sendPlanEmail } from './emailServices.js'; 
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize the Gemini Model via LangChain
// It automatically looks for the GOOGLE_API_KEY in your .env file
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3.5-flash", // You can also use gemini-1.5-flash for faster, lighter responses
  maxOutputTokens: 2048,
});

app.post('/api/test-db', async (req, res) => {
  try {
    const docRef = db.collection('users').doc('test-user-id');
    await docRef.set({
      email: 'test@example.com',
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

// --- Test Email Route ---
app.post('/api/test-email', async (req, res) => {
  try {
    // We will send the test email directly back to your own email address
    const success = await sendPlanEmail(
      process.env.EMAIL_USER, 
      "Hello! This is a test transmission from your AI Agent."
    );

    if (success) {
      res.json({ message: "Test email sent successfully! Check your inbox." });
    } else {
      res.status(500).json({ error: "Failed to send email. Check terminal for errors." });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error during email test." });
  }
});

// --- The Autonomous Agent Cron Job ---
// For testing purposes, '* * * * *' runs the job every single minute.
// Once in production, you would change this to '0 6 * * *' to run at 6:00 AM daily.
cron.schedule('0 6 * * *', async () => {
  console.log('🤖 AI Agent waking up to generate daily plans...');

  try {
    // 1. Fetch all users from Firestore
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('No users found in database.');
      return;
    }

    // 2. Loop through each user and generate their custom plan
    for (const doc of usersSnapshot.docs) {
      const user = doc.data();
      console.log(`Generating plan for: ${user.email}`);

      // Create the prompt dynamically based on the user's database entry
      const promptTemplate = PromptTemplate.fromTemplate(`
        You are an expert personal trainer and nutritionist. 
        Create a 1-day workout and meal plan for this user:
        - Goal: {fitnessGoal}
        - Equipment: {equipment}
        - Diet: {dietaryRestrictions}
        Format nicely in Markdown.
      `);
      
      const chain = promptTemplate.pipe(llm);
      const response = await chain.invoke({
        fitnessGoal: user.fitnessGoal,
        equipment: user.equipment,
        dietaryRestrictions: user.dietaryRestrictions
      });

      // 3. Email the generated plan to the user
      await sendPlanEmail(user.email, response.content);
      console.log(`✅ Plan successfully sent to ${user.email}`);
    }

  } catch (error) {
    console.error('Error during autonomous agent execution:', error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

// --- Manual Cron Trigger Route ---
app.get('/api/trigger-emails', async (req, res) => {
  // 1. Add a simple secret key to prevent random people from triggering your emails
  const { secret } = req.query;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log("Wake up! Triggering daily AI fitness emails...");
    
    // 2. Paste your exact Firebase fetching and Nodemailer logic here!
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('No users found in database.');
      return;
    }

    // 2. Loop through each user and generate their custom plan
    for (const doc of usersSnapshot.docs) {
      const user = doc.data();
      console.log(`Generating plan for: ${user.email}`);

      // Create the prompt dynamically based on the user's database entry
      const promptTemplate = PromptTemplate.fromTemplate(`
        You are an expert personal trainer and nutritionist. 
        Create a 1-day workout and meal plan for this user:
        - Goal: {fitnessGoal}
        - Equipment: {equipment}
        - Diet: {dietaryRestrictions}
        Format nicely in Markdown.
      `);
      
      const chain = promptTemplate.pipe(llm);
      const response = await chain.invoke({
        fitnessGoal: user.fitnessGoal,
        equipment: user.equipment,
        dietaryRestrictions: user.dietaryRestrictions
      });

      // 3. Email the generated plan to the user
      await sendPlanEmail(user.email, response.content);
      console.log(`✅ Plan successfully sent to ${user.email}`);
    }
    
    res.status(200).json({ message: 'Emails triggered successfully.' });
  } catch (error) {
    console.error('Error triggering emails:', error);
    res.status(500).json({ error: 'Failed to send emails.' });
  }
});

app.get('/', (req, res) => {
  res.send('AI Fitness Planner Backend is running!');
});

// LangChain/Gemini Generation Route
app.post('/api/generate-plan', async (req, res) => {
  try {
    // 1. Extract user inputs from the incoming React request
    const { fitnessGoal, equipment, dietaryRestrictions } = req.body;
    console.log("Generating plan for goal:", fitnessGoal);

    // 2. Create a dynamic prompt template
    const promptTemplate = PromptTemplate.fromTemplate(`
      You are an expert personal trainer and nutritionist. 
      Create a highly structured 1-day workout and meal plan for a user with the following profile:
      
      - Fitness Goal: {fitnessGoal}
      - Available Equipment: {equipment}
      - Dietary Restrictions: {dietaryRestrictions}

      Please format your response clearly using Markdown. Include a "Workout Plan" section and a "Meal Plan" section. Ensure the workout matches the available equipment and the meals respect the dietary restrictions.
    `);

    // 3. Chain the prompt and the model together
    const chain = promptTemplate.pipe(llm);

    // 4. Invoke the chain with the user's data
    const response = await chain.invoke({
      fitnessGoal: fitnessGoal || "General fitness",
      equipment: equipment || "No equipment (Bodyweight)",
      dietaryRestrictions: dietaryRestrictions || "None"
    });

    // 5. Send the AI-generated plan back to the frontend
    res.json({ plan: response.content });

  } catch (error) {
    console.error("Error generating plan:", error);
    res.status(500).json({ error: "Failed to generate plan." });
  }
});

// --- User Registration Route ---
app.post('/api/users', async (req, res) => {
  try {
    const { email, fitnessGoal, equipment, dietaryRestrictions } = req.body;

    // Basic validation to ensure we got all the data
    if (!email || !fitnessGoal || !equipment || !dietaryRestrictions) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Save to Firestore
    // Using the user's email as the Document ID prevents duplicate sign-ups
    // and makes it easy to update their preferences later!
    const userRef = db.collection('users').doc(email);
    
    await userRef.set({
      email,
      fitnessGoal,
      equipment,
      dietaryRestrictions,
      updatedAt: new Date().toISOString()
    });

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