import { NextFunction, Request, Response } from 'express'

import User from '../models/user';
import initLogger from '../core/logger';

const logger = initLogger('MiddlewareUser');

/*
function validUser(req: Request, res: Response, next: NextFunction){
    Promise.allSettled([
        ()=>{
            if(password === password2) resolve(true);
            else reject({ success: false, message: 'Passwords do not match'});
        },
        ()=>User.findOne({ req.body.username })//we could do 2 birds one stone with: https://stackoverflow.com/questions/7382207/mongooses-find-method-with-or-condition-does-not-work-properly
        .then((existingUser) => {
            if (existingUser) {
                return reject({ success: false, message: 'Username already exists' });
            } else {
                return resolve(true);
            }
        }).catch(err=>{
            logger.error(`Error finding existing user with username ${username} with error ${err}`)
            return res.status(400).json({ success: false, message: err });
        }),
        ()=>User.findOne({ req.body.email })
        .then((existingUser) => {
            if (existingUser){
                res.status(200).json({ success: false, message: 'Email already exists' });
            } else {
                next()
            }
        }).catch(err=>{
            logger.error(`Error finding existing user with email ${email} with error ${err}`)
            return res.status(400).json({ success: false, message: err });
        })
    ]).then((results) => results.filter(x=>x!=true))
    .then((out)=>{
        if(out===[]) return next();
        else return res.status(400).json(out);//would an array be valid json?
    });
}*/

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
