import mongoose from 'mongoose';
import dotenv from 'dotenv';
import StarWeaveProfile from './src/models/starweave.model.js';

dotenv.config();

const uri = process.env.MONGODB_URI || process.env.DB_URI || "mongodb://localhost:27017/chatapp";

async function purge() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');
    
    const result = await StarWeaveProfile.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} StarWeave profiles.`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

purge();
