import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config, configuredProviders } from './config.js';
import { db } from './db/client.js';
import { startScheduler } from './scheduler/tick.js';
import { projectRoutes } from './routes/projects.js';
import { postRoutes } from './routes/posts.js';
import { configRoutes } from './routes/config.js';
import { linkedinRoutes } from './routes/linkedin.js';
import { aiRoutes } from './routes/ai.js';

async function main(): Promise<void> {
  db(); // create tables on boot

  const app = Fastify({ logger: true });
  await app.register(cors, {
    origin: [config.frontendOrigin, 'http://127.0.0.1:5173'],
    credentials: true,
  });

  app.get('/api/health', async () => ({
    ok: true,
    service: 'postforge-api',
    dryRun: config.dryRun,
    providers: configuredProviders(),
  }));

  await app.register(projectRoutes, { prefix: '/api' });
  await app.register(postRoutes, { prefix: '/api' });
  await app.register(configRoutes, { prefix: '/api' });
  await app.register(linkedinRoutes, { prefix: '/api' });
  await app.register(aiRoutes, { prefix: '/api' });

  startScheduler();

  await app.listen({ host: '0.0.0.0', port: config.port });
  const mode = config.dryRun ? 'DRY RUN (simulated dispatch)' : 'LIVE dispatch';
  app.log.info(`PostForge API listening on :${config.port} — ${mode}`);
}

main().catch((err) => {
  console.error('fatal:', err);
  process.exit(1);
});
