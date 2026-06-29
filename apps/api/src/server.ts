import Fastify from 'fastify';
import { loadConfig, logger } from '@ubos/config';
import { registerRoutes } from './routes/index.js';

const config = loadConfig();
const app = Fastify({ logger: false });
await registerRoutes(app);
await app.listen({ port: config.apiPort, host: '0.0.0.0' });
logger.info(`UBOS API listening on ${config.apiPort}`);
