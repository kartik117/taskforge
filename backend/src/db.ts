import mongoose from 'mongoose';
import { env } from './config/env';
import { logger } from './utils/logger';

export async function connectDb(): Promise<void> {
  await mongoose.connect(env.MONGO_URI);
  logger.info({ uri: env.MONGO_URI.replace(/\/\/.*@/, '//***@') }, 'Connected to MongoDB');
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
