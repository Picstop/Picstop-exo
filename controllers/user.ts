import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import { IVerifyOptions } from 'passport-local';
import User from '../models/user';
import { IUser } from '../types/types';

export const postSignup = async (req: Request, res: Response, next: NextFunction) => {
    const user = new User({
        email: req.body.email,
        password: req.body.password,
        username: req.body.username,
        name: req.body.name,
    });

    User.findOne({ email: req.body.email }, (err: any, existingUser: IUser) => {
        if (err) { res.status(401).json({ success: false, message: err }); }
        if (existingUser) {
            return res.status(403).json({ success: false, message: err });
        }
        user.save((err) => {
            if (err) { return res.status(403).json({ success: false, message: err }); }
            req.logIn(user, (err) => {
                if (err) {
                    return res.status(401).json({ success: false, message: err });
                }
                passport.authenticate('local');
                return res.status(200).json({ success: true, message: 'user created' });
            });
        });

        passport.authenticate('local');
    });
};

export const postLogin = async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', (err: Error, user: IUser, info: IVerifyOptions) => {
        if (err) { return next(err); }
        if (!user) {
            return res.status(401).json({ success: false, message: "user doesn't exist" });
        }
        req.logIn(user, (err) => {
            if (err) { return res.status(403).json({ success: false, message: 'login error' }); }
            return res.status(200).json({ success: true, message: 'logged in' });
        });
    })(req, res, next);
};

export const logout = (req: Request, res: Response) => {
    req.logout();
    return res.status(200).json({ success: true, message: 'logged out' });
};
