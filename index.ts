import './src/config/passport';

import * as dotenv from 'dotenv';
import bodyParser from 'body-parser';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import locationRoutes from './src/routes/locations';
import commentRoutes from './src/routes/comments';
import postRoutes from './src/routes/posts';
import reportRoutes from './src/routes/reports';
import initLogger from './src/core/logger';
import db from './src/database/database';
import userRoutes from './src/routes/users';

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

db.then(async () => {
    logger.info('Successfully Connected to MongoDB');
}).catch((err) => logger.error(`Cannot connect to MongoDB: ${err}`));

app.listen(port, () => {
    logger.info(`Ready on port ${port}`);
});
