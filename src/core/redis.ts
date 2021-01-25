import Redis from 'ioredis';
import connectRedis from 'connect-redis';
import session from 'express-session';
import * as dotenv from 'dotenv';
import initLogger from './logger';

const logger = initLogger('redis');
dotenv.config();
export const RedisStore = connectRedis(session);

export const client = new Redis({
    port: Number(process.env.REDIS_PORT),
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
});

client.on('connect', () => logger.info('Connected to Redis'));
client.on('error', (err) => {
    logger.error(`Redis Error: ${err}`);
});
