import { describe, it } from 'mocha';
import { expect } from 'chai';
import mongoose from 'mongoose';

import initLogger from '$/core/logger';
import UserModel from '$/models/user';

const logger = initLogger('test', 'test');

describe('user model test', async () => {
    it('create and save a valid user', async () => {
        // TODO: add more valid fields here
        const validUserModel = new UserModel({
            email: 'albus@dumbledore.me',
            username: 'albusd',
            name: 'Albus Dumbledore',
            password: 'LemonSherbet1',
        });

        const savedUser = await validUserModel.save();

        expect(savedUser._id).to.be.a('mongoose.Types.ObjectId');
    });

    it('user missing required fields', async () => {
        // TODO: add more valid fields here
        const validUserModel = new UserModel({
            email: 'albus@dumbledore.me',
            username: 'albusd',
            name: 'Albus Dumbledore'
        });

        try {
            const savedUser = await validUserModel.save();
        } catch (e) {
            expect(e).to.be.a('mongoose.error.ValidationError');
        }
    });
});
