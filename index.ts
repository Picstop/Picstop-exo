import * as dotenv from 'dotenv';
import morgan from 'morgan';
import passport from 'passport';
import express from 'express';
import bodyParser from 'body-parser';

import * as userController from './controllers/user';
import db from './database/database';
import initLogger from './core/logger';
import locationRoutes from './routes/locations';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

const logger = initLogger('index');

app.use(passport.initialize());
app.use(passport.session());

app.use(morgan('dev')); // TODO: add support for different environments

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/signup', userController.postSignup);
app.post('/login', userController.postLogin);
app.post('/logout', userController.logout);

app.get('/', (req, res) => {
    logger.debug('Base endpoint works.');
    res.send('Hello world!');
});

app.use('/locations', locationRoutes);

db.then(async () => {
    logger.info('Successfully Connected to MongoDB');

    /* const location = await Location.find({}).exec();
    const quadrant = await Quadrant.findById('1').exec();
    location.forEach((e) => {
        quadrant!.locations.push(e._id);
    });
    await quadrant!.save();
    console.log('Saved'); */
}).catch((err) => logger.error(`Cannot connect to MongoDB: ${err}`));

app.listen(port, () => {
    logger.info(`Ready on port ${port}`);
});
