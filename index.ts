import * as dotenv from 'dotenv';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import bodyParser from 'body-parser';
import express from 'express';
import passport from 'passport';
import * as userController from './controllers/user';

import Location from './models/location';
import Quadrant from './models/quadrant';
import db from './database/database';
import locationRoutes from './routes/locations';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/signup', userController.postSignup);
app.post('/login', userController.postLogin);
app.post('/logout', userController.logout);

app.use('/locations', locationRoutes);

db.then(async () => {
    console.log('Successfully Connected to MongoDB');

    /* const location = await Location.find({}).exec();
    const quadrant = await Quadrant.findById('1').exec();
    location.forEach((e) => {
        quadrant!.locations.push(e._id);
    });
    await quadrant!.save();
    console.log('Saved'); */
})
    .catch((err) => console.log(err));

app.listen(port, () => {
    console.log(`Ready on port ${port}`);
});
