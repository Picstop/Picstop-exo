/* eslint-disable import/prefer-default-export */
// import { Strategy as LocalStrategy } from 'passport-local';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        jwt.verify(authHeader, process.env.JWT_SECRET || '$$2d##dS#', (err, out) => {
            console.log(out);
            if (err)res.status(400).json({ success: false, message: err.message });
            User.exists({
                _id: out._id,
            }).then((ex: Boolean) => {
                if (ex) {
                    req.user = out;
                    next();
                } else return res.status(401).json({ success: false, message: 'Unauthenticated' });
            })
                .catch((e) => next(e));
        });
    } else {
        return res.status(401).json({ success: false, message: 'Missing token' });
    }
};
