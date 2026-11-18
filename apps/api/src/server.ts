import { createApp } from './app.js';
import { disconnectPrisma } from './common/prisma.js';
import { getEnv } from './config/env.js';

const env = getEnv();
const app = createApp({ env });

const server = app.listen(env.API_PORT, () => {
  console.log(`[Nexora API] Listening on ${env.SERVER_URL} (${env.NODE_ENV})`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`[Nexora API] Received ${signal}, shutting down cleanly...`);
  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
