import { NextFunction, Request, Response } from 'express'

import User from '../models/user';
import initLogger from '../core/logger';

const logger = initLogger('MiddlewareUser');
const UsernameRegex=/^([^\s]+[A-Z]|[a-z]|[0-9]|[_]|[.]){3,20}$/;
const PasswordRegex=/^([^\s]){6,20}$/;
const EmailRegex=/^[^\s@]+@([^\s@.,]+.)+[^\s@.,]{2,}$/;



export default class UserMiddleware {

    function validUser(req: Request, res: Response, next: NextFunction){
        const {password, password2, username, email} = req.body;
        Promise.allSettled([
            checkPasswordMatch(password, password2),
            checkExistingUsername(username),
            checkExistingEmail(email)
        ]).then((results) => results.filter(x=>x!=true))
        .then((out)=>{
            if(out===[]) return next();
            else return res.status(400).json(out);//would an array be valid json?
        });
    }
    
        const checkPasswordMatch = async (password:string, password2:string): Promise<any> => {
            if(password === password2){
            if(password.match(PasswordRegex))
                resolve(true);
            else 
                reject({ success: false, message: 'Passwords contain spaces or are too long/too short(6-20 chars)'});
            } else reject({ success: false, message: 'Passwords do not match'});
        };
    
    const checkExistingUsername = async (username:string): Promise<any> =>
        User.findOne({ username })
        .then((existingUser) => {
            if (existingUser) {
                return reject({ success: false, message: 'Username already exists' });
            } else {
                if(existingUser.username.match(UsernameRegex))
                return resolve(true);
                else return reject({ success: false, message: 'Username does not fit constraints'});
            }
        }).catch(err=>{
            logger.error(`Error finding existing user with username ${username} with error ${err}`)
            return res.status(400).json({ success: false, message: err });
        });

        const checkExistingEmail = async (email:string): Promise<any> =>
        User.findOne({ email })
        .then((existingUser) => {
            if (existingUser){
                res.status(200).json({ success: false, message: 'Email already exists' });
            } else {
                if(existingUser.username.match(EmailRegex))
                return resolve(true);
                else return reject({ success: false, message: 'Email is invalid'});
            }
        }).catch(err=>{
            logger.error(`Error finding existing user with email ${email} with error ${err}`)
            return res.status(400).json({ success: false, message: err });
        })
    
//     checkPasswordMatch(req: Request, res: Response, next: NextFunction){
//         const { password, password2 } = req.body;
//         if(password === password2 && password.match(PasswordRegex)){
//                 next()
//         } else if (!password.match(PasswordRegex)){
//             return res.status(400).json({ success: false, message: 'Passwords contain spaces or are too long/too short(6-20 chars)'});
//         } else if (password !== password2){
//             return res.status(400).json({ success: false, message: 'Passwords do not match' })
//         }
//     }

//     checkExistingUsername(req: Request, res: Response, next: NextFunction){
//         const { username } = req.body;

//         User.findOne({ username }, (err, existingUser) => {
//             if (err) {
//                 logger.error(`Error finding existing user with username ${username} with error ${err}`)
//                 return res.status(400).json({ success: false, message: err });
//             }
//             if (existingUser) {
//                 return res.status(400).json({ success: false, message: 'Username already exists' });
//             } else {
//                 if(existingUser.username.match(UsernameRegex))
//                     next();
//                 else
//                     return res.status(400).json({ success: false, message: 'Username does not fit constraints' });
//             }
//         })
//     }

//     checkExistingEmail(req: Request, res: Response, next: NextFunction){
//         const { email } = req.body;

//         User.findOne({ email }, (err, existingUser) => {
//             if (err) {
//                 logger.error(`Error finding existing user with email ${email} with error ${err}`)
//                 res.status(400).json({ success: false, message: err });
//             }
//             if (existingUser){
//                 res.status(200).json({ success: false, message: 'Email already exists' });
//             } else {
//                 if (existingUser.username.match(EmailRegex)) { 
//                     next()
//                 } else {
//                     return res.status(400).json({ success: false, message: 'Email is invalid'});
//                 }
                
                
//             }
//         })
//     }
    
}
