import { NextFunction, Request, Response } from 'express'

import User from '../models/user';
import initLogger from '../core/logger';

const logger = initLogger('MiddlewareUser');
export default class UserMiddleware {

    checkPasswordMatch(req: Request, res: Response, next: NextFunction){
        const { password, password2 } = req.body;
        if (password === password2) {
            next()
        } else {
            return res.status(400).json({ success: false, message: 'Passwords do not match'})
        }
    }

    checkExistingUsername(req: Request, res: Response, next: NextFunction){
        const { username } = req.body;

        User.findOne({ username }, (err, existingUser) => {
            if (err) {
                logger.error(`Error finding existing user with username ${username} with error ${err}`)
                res.status(400).json({ success: false, message: err });
            }
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Username already exists' });
            } else {
                next()
            }
        })
    }

    checkExistingEmail(req: Request, res: Response, next: NextFunction){
        const { email } = req.body;

        User.findOne({ email }, (err, existingUser) => {
            if (err) {
                logger.error(`Error finding existing user with email ${email} with error ${err}`)
                res.status(400).json({ success: false, message: err });
            }
            if (existingUser){
                res.status(200).json({ success: false, message: 'Email already exists' });
            } else {
                next()
            }
        })
    }
    
}