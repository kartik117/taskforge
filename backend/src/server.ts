import { createApp } from './app';
import { connectDb } from './db';
import { env } from './config/env';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  await connectDb();
  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'TaskForge API listening');
  });
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start TaskForge API');
  process.exit(1);
});
