/* eslint-disable consistent-return */
/* eslint-disable import/prefer-default-export */
// import { Strategy as LocalStrategy } from 'passport-local';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import { IUser } from '../types/types';

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        jwt.verify(authHeader, process.env.JWT_SECRET || '$$2d##dS#', (err, out) => {
            if (err)res.status(400).json({ success: false, message: err.message });
            User.findById(out._id)
                .then((ex: IUser) => {
                    if (ex) {
                        req.user = out;
                        return next();
                    } return res.status(401).json({ success: false, message: 'Unauthenticated' });
                })
                .catch((e) => next(e));
        });
    } else {
        return res.status(401).json({ success: false, message: 'Missing token' });
    }
};
