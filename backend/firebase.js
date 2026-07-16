// backend/firebase.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Read the JSON file securely (since we are using ES Modules)
const serviceAccount = JSON.parse(
  readFileSync(new URL('./serviceAccountKey.json', import.meta.url))
);

// Initialize Firebase using the modular methods
initializeApp({
  credential: cert(serviceAccount)
});

// Initialize the Firestore database
const db = getFirestore();

export { db };