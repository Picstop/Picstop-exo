import mongoose, { mongo } from 'mongoose';
import bcrypt from 'bcrypt';

import UserModel from '~/models/user';
import initLogger from '~/core/logger';

const logger = initLogger('TestUser', 'test-mongo');

// TODO: seems like there is no need for mongoose.disconnect() (tearDown) anymore?

describe('user model test', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useCreateIndex: true }, (err) => {
            if (err) {
                logger.error(`Error while setting up MongoDB: ${err}`);
                process.exit(1);
            }
        });
    });

    it('successfully creates & saves a user', async () => {
        expect.assertions(5);

        const validUser = {
            email: 'albus@dumbledore.me',
            username: 'albusd',
            name: 'Albus P. W. B. Dumbledore',
            password: 'sherbetlemon',
        };

        const savedUser = await new UserModel(validUser).save();

        expect(savedUser._id).toBeDefined();
        expect(savedUser.email).toBe(validUser.email);
        expect(savedUser.username).toBe(validUser.username);
        expect(savedUser.name).toBe(validUser.name);
        bcrypt.compare(savedUser.password, validUser.password, (err, isMatch) => {
            expect(isMatch).toBe(true);
        });
    });

    it('mongoose schema invalid fields test', async () => {
        // This should work if mongoose doesn't let add additional fields
        expect.assertions(2);

        const invalidUser = {
            email: 'albus@dumbledore.me',
            username: 'albusd',
            name: 'Albus P. W. B. Dumbledore',
            password: 'sherbetlemon',
            invalid: 'something',
        };

        const savedUser = await new UserModel(invalidUser).save();

        expect(savedUser._id).toBeDefined();
        expect(savedUser.invalid).toBeUndefined();
    });

    it('mongoose validation invalid types test', async () => {
        // This should work if mongoose doesn't let define values of incorrect types
        expect.assertions(1);

        const invalidUser = {
            email: 'albus@dumbledore.me',
            username: 'albusd',
            name: 'Albus P. W. B. Dumbledore',
            password: 12456, // invalid password type
        };

        let error;
        try {
            const savedUser = await new UserModel(invalidUser).save();
            error = savedUser;
        } catch (err) {
            error = err;
        }

        expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
    });

    it('mongoose validation missing required fields test', async () => {
        // This should work if mongoose doesn't save an object with missing required fields
        expect.assertions(1);

        const invalidUser = {
            email: 'albus@dumbledore.me',
            username: 'albusd',
            // Missing a couple of required fields
        };

        let error;
        try {
            const savedUser = await new UserModel(invalidUser).save();
            error = savedUser;
        } catch (err) {
            error = err;
        }

        expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
    });
});
