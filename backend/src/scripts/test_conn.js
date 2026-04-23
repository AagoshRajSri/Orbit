import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const uri = process.env.MONGODB_URI;

console.log('Connecting to:', uri.split('@')[1]); // Log host only for safety

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log('✓ Connected successfully');
  await mongoose.disconnect();
} catch (err) {
  console.error('✗ Connection failed:', err.message);
  process.exit(1);
}
