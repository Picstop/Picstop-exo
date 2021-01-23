import mongoose, { Schema, Document } from 'mongoose';
import express from 'express';
import bcrypt from 'bcrypt';

import initLogger from '../core/logger';
import { IUser, comparePasswordFunction } from '../types/types';

const logger = initLogger('UserModel');
const passwordRegex = /^(?=.[A-Za-z])(?=.\d)[A-Za-z\d]*$/;

const UserSchema = new Schema({
    email: {
        type: String,
        required: [true, 'No email provided'],
        unique: [true, 'The email you provided was not unique'],
        match: [
            /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/,
            'The email you provided was not correctly typed',
        ],
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: [true, 'Username already exists'],
        minlength: [3, 'Username must be at least  characters'],
        maxlength: [18, 'Username cannot be more than 18 characters'],
        match: [
            /^[a-zA-Z0-9_.]*$/,
            'Username is improperly formatted(must be only characters a-z,0-9,period and underscore)',
        ],
    },
    name: {
        type: String,
        maxlength: [40, 'Name has a maximum length of 40 characters'],
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password length must be at least 6 characters'],
        maxlength: [50, 'Password has a maximum length of 50 characters'],
        validate: {
            validator(v) {
                return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]*$/.test(v);
            },
            message: 'Password must contain at least one upper case character, one lower case character, and one number',
        },
        select: false,
        trim: true,
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    followerRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    private: {
        type: Boolean,
        default: false,
    },
    blocked: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    bio: {
        type: String,
        maxlength: [150, 'Bio cannot exceed 150 characters'],
    },
    profilePic: {
        type: String,
        // TODO: we should have a url for a default pfp and put it here
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    },
    savedLocations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
    }],

},
{
    timestamps: true,
});

UserSchema.pre('save', function save(next) {
    const user = this as IUser;
    if (!user.isModified('password')) { return next(); }
    return bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            logger.error(`Error while generating salt with bcrypt: ${err}`);
            return next(err);
        }
        return bcrypt.hash(user.password, salt, (err1: mongoose.Error, hash) => {
            if (err1) {
                logger.error(`Error while hashing a password with bcrypt: ${err1}`);
                return next(err1);
            }
            user.password = hash;
            return next();
        });
    });
});

export default mongoose.model<IUser>('User', UserSchema);
