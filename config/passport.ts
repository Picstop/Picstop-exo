import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import User from "../models/user";
import { IUser } from "../types/types"

import { Request, Response, NextFunction } from "express";

passport.serializeUser((user: IUser, done) => {
    done(undefined, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err : Error, user : IUser) => {
        done(err, user);
    });
});


passport.use(
    new LocalStrategy({ usernameField: 'username' }, (username, password, done) => {

        User.findOne({ username: username }).select('+password').exec()
        .then((user: IUser) => {
            if (!user) {
                return done(null, false, { message: `Username ${username} not found.` });
            }

            user.comparePassword(password, user.password, (err: Error, isMatch: boolean) => {
                if (err) { return done(err); }
                if (isMatch) {
                    return done(undefined, user);
                }
                return done(undefined, false, { message: "Invalid username or password." });
            });

        }).catch((err: Error) => {
            return done(err);
        })

        /* User.findOne({ username: username }, async (err: Error, user: any) => {

            if (err) { return done(err); }

            if (!user) {
                return done(null, false, { message: `Username ${username} not found.` });
            }

            user.comparePassword(password, user.password, (err: Error, isMatch: boolean) => {
                if (err) { return done(err); }
                if (isMatch) {
                    return done(undefined, user);
                }
                return done(undefined, false, { message: "Invalid username or password." });
            });
        }); */
}));

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({message: "Not logged in"});
};
