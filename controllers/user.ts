import { NextFunction, Request, Response } from 'express';
import { IVerifyOptions } from 'passport-local';
import passport from 'passport';

import { IUser } from '../types/types';
import User from '../models/user';
import initLogger from '../core/logger';

const logger = initLogger('ControllerUser');

export const postSignup = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const user = new User({
        email: req.body.email,
        password: req.body.password,
        username: req.body.username,
        name: req.body.name,
    });

    User.findOne({ email: req.body.email }, (err: any, existingUser: IUser) => {
        if (err) {
            logger.error(`Error when finding a user: ${err}`);
            res.status(401).json({ success: false, message: err });
        }
        if (existingUser) {
            logger.info(`User already exists: ${err}`);
            return res.status(403).json({ success: false, message: err });
        }
        user.save((err) => {
            if (err) {
                logger.error(`Error when saving a user: ${err}`);
                return res.status(403).json({ success: false, message: err });
            }
            req.logIn(user, (err) => {
                if (err) {
                    logger.error(`Error when logging a user in: ${err}`);
                    return res
                        .status(401)
                        .json({ success: false, message: err });
                }
                passport.authenticate('local');
                return res
                    .status(200)
                    .json({ success: true, message: 'user created' });
            });
        });

        passport.authenticate('local');
    });
};

export const postLogin = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    passport.authenticate(
        'local',
        (err: Error, user: IUser, info: IVerifyOptions) => {
            if (err) {
                logger.error(`Error when authenticating: ${err}`);
                return next(err);
            }
            if (!user) {
                logger.error(`User doesn't exist: ${err}`);
                return res
                    .status(401)
                    .json({ success: false, message: 'user doesn\'t exist' });
            }
            req.logIn(user, (err) => {
                if (err) {
                    logger.error(`Error when logging a user in: ${err}`);
                    return res
                        .status(403)
                        .json({ success: false, message: 'login error' });
                }
                return res
                    .status(200)
                    .json({ success: true, message: 'logged in' });
            });
        },
    )(req, res, next);
};

export const logout = (req: Request, res: Response) => {
    req.logout();
    return res.status(200).json({ success: true, message: 'logged out' });
};
