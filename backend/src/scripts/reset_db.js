/**
 * reset_starweave.js
 * Wipes users, starweave profiles, and sessions so you can enroll fresh.
 * Run: node scratch/reset_starweave.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

await mongoose.connect(process.env.MONGODB_URI);
console.log('✓ Connected to MongoDB');

const db = mongoose.connection.db;

const COLLECTIONS = ['users', 'starweaveprofiles', 'sessions', 'constellationprofiles', 'nexuses', 'messages', 'nexusmessages'];

for (const col of COLLECTIONS) {
  const result = await db.collection(col).deleteMany({});
  console.log(`  ${col}: deleted ${result.deletedCount} documents`);
}

await mongoose.disconnect();
console.log('✓ Done — database is clean. You can enroll fresh.');
