import './config/passport'

import * as dotenv from 'dotenv';

import { Strategy as LocalStrategy } from 'passport-local';
import Location from './models/location';
import bcrypt from 'bcrypt';
import bodyParser from 'body-parser';
import db from './database/database';
import express from 'express';
import initLogger from './core/logger';
import locationRoutes from './routes/locations';
import morgan from 'morgan';
import passport from 'passport';
import session from 'express-session'
import userRoutes from './routes/users'
import { RedisStore, client } from './core/redis';

dotenv.config();



const app = express();
const port = process.env.PORT || 3000;

const logger = initLogger('index');



app.use(session({
    store: new RedisStore({
        client,
        name: process.env.REDIS_NAME,
        cookie: {
            maxAge: Number(process.env.REDIS_AGE),
            secure: process.env.NODE_ENV === 'production',
            sameSite: true

        },
    }),
    saveUninitialized: false,
    secret: process.env.REDIS_SECRET,
    resave: false,

}))

app.use(passport.initialize());
app.use(passport.session());

app.use(morgan('dev')); // TODO: add support for different environments

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    logger.debug('Base endpoint works.');
    res.send('Hello world!');
});
app.use('/locations', locationRoutes);
app.use('/user', userRoutes);
db.then(async () => {
    logger.info('Successfully Connected to MongoDB');
}).catch((err) => logger.error(`Cannot connect to MongoDB: ${err}`));

app.listen(port, () => {
    logger.info(`Ready on port ${port}`);
});
