import './config/passport';

import * as dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import bodyParser from 'body-parser';
import express from 'express';
import morgan from 'morgan';
import session from 'express-session';
import helmet from 'helmet';
import locationRoutes from './routes/locations';
import commentRoutes from './routes/comments';
import postRoutes from './routes/posts';
import reportRoutes from './routes/reports';
import initLogger from './core/logger';
import db from './database/database';
import Location from './models/location';
import userRoutes from './routes/users';
import albumRoutes from './routes/albums';

import { RedisStore, client } from './core/redis';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());

const logger = initLogger('index');

app.use(morgan('dev')); // TODO: add support for different environments

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    logger.debug('Base endpoint works.');
    res.send('Hello world!');
});
app.use('/locations', locationRoutes);
app.use('/user', userRoutes);
app.use('/comments', commentRoutes);
app.use('/posts', postRoutes);
app.use('/report', reportRoutes);
app.use('/albums', albumRoutes);

db.then(async () => {
    logger.info('Successfully Connected to MongoDB');
}).catch((err) => logger.error(`Cannot connect to MongoDB: ${err}`));

app.listen(port, () => {
    logger.info(`Ready on port ${port}`);
});
