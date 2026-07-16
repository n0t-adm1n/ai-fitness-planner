import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import { createRequire } from 'module';

dotenv.config();

// Create a CommonJS require function to handle the JSON file dynamically
const require = createRequire(import.meta.url);

let serviceAccount;

// Render automatically injects the RENDER=true environment variable
if (process.env.RENDER) {
  // 1. In Production on Render: Parse the text variable we added in the dashboard
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // 2. In Local Development: Dynamically require the physical file
  serviceAccount = require('./serviceAccountKey.json');
}

initializeApp({
  credential: cert(serviceAccount)
});

export const db = getFirestore();