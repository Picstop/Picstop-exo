import mongoose, { Schema, Document } from 'mongoose';
import express from 'express';
import passportLocalMongoose from 'passport-local-mongoose';
import bcrypt from 'bcrypt';

import initLogger from '../core/logger';
import { IUser, comparePasswordFunction } from '../types/types';

const logger = initLogger('UserModel');

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        required: [true, "No email provided"],
        unique: [true, "The email you provided was not unique"],
        match: [
          /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/,
          "The email you provided was not correctly typed",
        ],
    },
    username: {
        type: String,
        required: true,
        required: [true, "No name provided"],
        unique: [true, "The name you provided was not unique"],
        minlength: [6, "name must be at least 6 characters"],
        maxlength: [40, "name must be less than 40 characters"],
        match:[
            /^[a-zA-Z0-9_.]*$/,
            "username is improperly formatted(must be only characters a-z,0-9,period and underscore)"
        ]
    },
    name: {
        type: String,
        required: true,
        minlength: [1, "name must be at least 6 characters"],
        maxlength: [40, "name must be less than 40 characters"]
    },
    password: {
        type: String,
        required: true,
    },

},
{
    timestamps: true,
});

UserSchema.pre('save', function save(next) {
    const user = this as IUser;
    if (!user.isModified('password')) { return next(); }
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            logger.error(`Error while generating salt with bcrypt: ${err}`);
            return next(err);
        }
        bcrypt.hash(user.password, salt, (err: mongoose.Error, hash) => {
            if (err) {
                logger.error(`Error while hashing a password with bcrypt: ${err}`);
                return next(err);
            }
            user.password = hash;
            next();
        });
    });
});

const comparePassword: comparePasswordFunction = ((p1, p2, cb) => {
    bcrypt.compare(p1, p2, (err: mongoose.Error, isMatch: boolean) => {
        cb(err, isMatch);
    });
});

UserSchema.methods.comparePassword = comparePassword;

UserSchema.plugin(passportLocalMongoose);

export default mongoose.model<IUser>('User', UserSchema);
