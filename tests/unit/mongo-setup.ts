import mongoose from 'mongoose';
import { before, after } from 'mocha';
import { MongoMemoryServer } from 'mongodb-memory-server';

import initLogger from '$/core/logger';

const logger = initLogger('test', 'test');

let mongoServer;

before(async () => {
    mongoServer = new MongoMemoryServer();
    const mongoUri = await mongoServer.getUri();

    await mongoose.connect(mongoUri);
    logger.info('Mongoose connection established successfully!');
});

after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});
