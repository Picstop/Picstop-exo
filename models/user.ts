import mongoose, { Schema, Document } from 'mongoose';
import express from 'express';
import passportLocalMongoose from 'passport-local-mongoose';
import bcrypt from 'bcrypt';
import { IUser, comparePasswordFunction } from '../types/types';

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
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
        if (err) { return next(err); }
        bcrypt.hash(user.password, salt, (err: mongoose.Error, hash) => {
            if (err) { return next(err); }
            user.password = hash;
            next();
        });
    });
});

const comparePassword: comparePasswordFunction = function (p1, p2, cb) {
    bcrypt.compare(p1, p2, (err: mongoose.Error, isMatch: boolean) => {
        cb(err, isMatch);
    });
};

UserSchema.methods.comparePassword = comparePassword;

UserSchema.plugin(passportLocalMongoose);

export default mongoose.model<IUser>('User', UserSchema);
