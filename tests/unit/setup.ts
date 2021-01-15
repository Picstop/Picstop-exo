import mongoose from 'mongoose';
import initLogger from '~/core/logger';

const logger = loggerInit()

describe('set up', () => {
    before(async () => {
        await mongoose.connect('mongodb://localhost/test');
        logger.info("Mongoose connection established");
    });
});
