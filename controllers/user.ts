import { NextFunction, Response } from 'express';
import passport from 'passport';

import async from 'async';
import crypto from 'crypto';
import aws from 'aws-sdk';
import initLogger from '../core/logger';
import User from '../models/user';
import { IUser, NewRequest as Request } from '../types/types';
import Location from '../models/location';

const logger = initLogger('ControllerUser');
const SES = new aws.SES({
    region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS,
    secretAccessKey: process.env.AWS_SECRET,
});
export default class UserController {
    async postSignup(req: Request, res: Response) {
        const user = new User({
            email: req.body.email.trim(),
            password: req.body.password,
            username: req.body.username.trim().toLowerCase(),
        });

        user.save((err) => {
            if (err) {
                logger.error(`Error when saving a user: ${err}`);
                return res.status(400).json({ success: false, message: err.message });
            }
            return res.status(201).json({ success: true, message: 'Successfully signed up.' });
        });

        passport.authenticate('local');
    }

    async postLogin(req: Request, res: Response, next: NextFunction) {
        passport.authenticate(
            'local',
            (err: Error, user: IUser) => {
                if (err) {
                    logger.error(`Error when authenticating: ${err}`);
                    return res.status(500).json({ success: false, message: err.message });
                }
                if (!user) {
                    logger.error(`User doesn't exist: ${err}`);
                    return res.status(400).json({ success: false, message: 'User doesn\'t exist' });
                }
                return req.logIn(user, (error) => {
                    if (error) {
                        logger.error(`Error when logging a user in: ${error}`);
                        return res.status(500).json({ success: false, message: 'Login error' });
                    }
                    return res.status(200).json({ success: true, message: 'Logged in' });
                });
            },
        )(req, res, next);
    }

    logout(req: Request, res: Response) {
        req.logout();
        return res.status(200).json({ success: true, message: 'logged out' });
    }

    async getUser(req: Request, res: Response) {
        const { username } = req.params;
        try {
            const user = await User.findOne({ username })
                .orFail(new Error('User not found!'))
                .exec();

            const locations = await Location.find({ author: user._id }).exec();
            return res.status(200).json({ success: true, message: { user, locations } });
        } catch (error) {
            logger.error(`Error getting user by username: ${username} with error: ${error}`);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async followUser(req: Request, res: Response) {
        const { id } = req.body;
        try {
            const isPrivate = await this.isPrivate(id);
            if (isPrivate == null) {
                logger.error(`Error getting user ${id} 's privacy setting`);
                return res.status(500).json({ success: false, message: 'Error getting user\'s privacy setting' });
            } if (isPrivate) {
                await User.findByIdAndUpdate(id, { $push: { followerRequests: req.user._id } })
                    .orFail(new Error('User not found!'))
                    .exec();
                return res.status(200).json({ success: true, message: 'Successfully requested to follow user' });
            }
            await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } })
                .orFail(new Error('User not found!'))
                .exec();
            await User.findByIdAndUpdate(req.user._id, { $push: { following: id } })
                .orFail(new Error('User not found!'))
                .exec();
            return res.status(200).json({ success: true, message: 'Successfully followed user' });
        } catch (error) {
            logger.error(`Error following / requesting ${id} by ${req.user._id} with error: ${error}`);
            return res.status(500).json({ success: false, message: error });
        }
    }

    async isPrivate(id: IUser['id']) {
        const user = await User.findById(id)
            .orFail(new Error('User not found!'))
            .exec();
        return user.private;
    }

    async blockUser(req: Request, res: Response) {
        const { id } = req.body;
        try {
            await User.findByIdAndUpdate(req.user._id, { $push: { blocked: id }, $pull: { following: id, followers: id } })
                .orFail(new Error('User not found!'))
                .exec();
            await User.findByIdAndUpdate(id, { $pull: { following: req.user._id, followers: req.user._id } })
                .orFail(new Error('User not found!'))
                .exec();
            return res.status(200).json({ success: true, message: `Successfully blocked user ${id}` });
        } catch (error) {
            logger.error(`Error blocking user ${id} by ${req.user._id}`);
            return res.status(500).json({ success: false, message: error });
        }
    }

    // unblock
    // check if blocked
    async unblockUser(req: Request, res: Response) {
        const { id } = req.body;
        User.findByIdAndUpdate(req.user._id, { $pull: { blocked: id } })
            .orFail(new Error('User not found!'))
            .exec()
            .then(() => res.status(200).json({ success: true, message: `Successfully unblocked ${id}` }))
            .catch((error) => {
                logger.error(`Error unblocking ${id} by ${req.user._id} with error: ${error}`);
                return res.status(500).json({ success: false, message: error });
            });
    }

    // unfollow
    // check if already unfollowed
    async unfollowUser(req: Request, res: Response) {
        const { id } = req.body;
        User.findByIdAndUpdate(req.user._id, { $pull: { following: id } })
            .orFail(new Error('User not found!'))
            .exec()
            .then(() => res.status(200).json({ success: true, message: `Successfully unfollowed ${id}` }))
            .catch((error) => {
                logger.error(`Error unfollowing ${id} by ${req.user._id} with error: ${error}`);
                return res.status(500).json({ success: false, message: error });
            });
    }

    // accept follow request
    // check if request exists
    async acceptFollowRequest(req: Request, res: Response) {
        const { id } = req.body;
        try {
            await User.findByIdAndUpdate(req.user._id, { $pull: { followerRequests: id }, $push: { followers: id } })
                .orFail(new Error('User not found!'))
                .exec();
            await User.findByIdAndUpdate(id, { $push: { following: req.user._id } })
                .orFail(new Error('User not found!'))
                .exec();
            return res.status(200).json({ success: true, message: 'Successfully accepted follow request' });
        } catch (error) {
            logger.error(`Error accepting ${id} 's follow request for ${req.user._id} with error: ${error}`);
            return res.status(500).json({ success: false, message: error });
        }
    }

    async removeFollowRequest(req: Request, res: Response) {
        const { id } = req.body;
        User.findByIdAndUpdate(id, { $pull: { followerRequests: req.user._id } })
            .orFail(new Error('User not found!'))
            .exec()
            .then(() => res.status(200).json({ success: true, message: `Successfully removed follow request to ${id}` }))
            .catch((error) => {
                logger.error(`Error removing follow request to ${id} by ${req.user._id} with error: ${error}`);
                return res.status(500).json({ success: false, message: error });
            });
    }

    async updateUsername(req: Request, res: Response) {
        const username = req.body.username.trim().toLowerCase();
        if (username === req.user.username) return res.status(400).json({ success: true, message: 'Username is the same as requested' });
        return User.findByIdAndUpdate(req.user._id, { username }, { runValidators: true })
            .orFail(new Error('User not found!'))
            .exec()
            .then(() => res.status(200).json({ success: true, message: 'Successfully updated username' }))
            .catch((error) => {
                if (error.codeName === 'DuplicateKey') return res.status(400).json({ success: false, message: 'Username already exists' });
                if (error.message.includes('Validation')) return res.status(400).json({ success: false, message: error.message });
                logger.error(`Error updating username to ${username} for user ${req.user._id} with error ${error}`);
                return res.status(500).json({ success: false, message: error });
            });
    }

    async updatePrivacy(req: Request, res: Response) {
        const { privacy } = req.body;
        if (privacy === false) {
            try {
                await User.updateMany({ _id: { $in: req.user.followerRequests } }, { $push: { following: req.user._id } })
                    .orFail(new Error('User not found!'))
                    .exec();
                await User.findByIdAndUpdate(req.user._id, { private: privacy, $push: { followers: { $each: req.user.followerRequests } }, $set: { followerRequests: [] } })
                    .orFail(new Error('User not found!'))
                    .exec();
                return res.status(200).json({ success: true, message: 'Succesfully updated privacy setting and added all follower requests as followers' });
            } catch (error) {
                logger.error(`Error updating privacy to ${privacy} and adding all follow requests as followers for user ${req.user._id} with error: ${error}`);
                return res.status(500).json({ success: false, message: error });
            }
        } else {
            return User.findByIdAndUpdate(req.user._id, { private: privacy })
                .orFail(new Error('User not found!'))
                .exec()
                .then(() => res.status(200).json({ success: true, message: 'Successfully updated privacy setting' }))
                .catch((error: Error) => {
                    logger.error(`Error updating privacy to ${privacy} for user ${req.user._id} with error: ${error}`);
                    return res.status(500).json({ success: false, message: error });
                });
        }
    }

    async updateProfile(req: Request, res: Response) {
        const { name, bio } = req.body;

        User.findByIdAndUpdate(req.user._id, { name, bio }, { runValidators: true })
            .orFail(new Error('User not found!'))
            .exec()
            .then(() => res.status(200).json({ success: true, message: 'Successfully updated name and bio. ' }))
            .catch((error: Error) => {
                if (error.message.includes('Validation')) return res.status(400).json({ success: false, message: error.message });
                logger.error(`Error updating profile for user ${req.user._id}`);
                return res.status(500).json({ success: false, message: error });
            });
    }

    async postResetPassword(req: Request, res: Response) {
        async.waterfall([
            function (done) {
                User.findOne({
                    email: req.body.email,
                })
                    .orFail(new Error('User not found!'))
                    .exec((err, user) => {
                        if (user) {
                            done(err, user);
                        } else {
                            done('User not found.');
                        }
                    });
            },
            function (user, done) {
                // create the random token
                crypto.randomBytes(20, (err, buffer) => {
                    const token = buffer.toString('hex');
                    done(err, user, token);
                });
            },
            function (user, token, done) {
                User.findByIdAndUpdate({ _id: user._id }, { resetPasswordToken: token, resetPasswordExpires: Date.now() + 86400000 }, { new: true })
                    .orFail(new Error('User not found!'))
                    .exec((err, newUser) => {
                        done(err, token, newUser);
                    });
            },
            function (token, user, done) {
                SES.sendEmail({
                    Destination: {
                        ToAddresses: [user.email],
                    },
                    Message: {
                        Body: {
                            Html: {
                                Charset: 'UTF-8',
                                Data: `You are receiving this because you (or someone else) have requested the reset of the password for your account.<br/><br/>Please click on the following link, or paste this into your browser to reset your password:<br/><br/> https://${req.headers.host}/user/reset/${token}<br/><br/>If you did not request this, please ignore this email and your password will remain unchanged.<br/>`,
                            },
                        },
                        Subject: {
                            Charset: 'UTF-8',
                            Data: 'Password Reset',
                        },
                    },
                    Source: `Picstop <${process.env.LOGIN_USER}>`,
                }).promise()
                    .then(() => res.status(200).json({ success: true, message: 'Sent password reset email' })).catch((err) => done(err));
            },
        ], (err) => res.status(500).json({ success: false, message: err }));
    }

    async checkToken(req: Request, res: Response) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } })
            .orFail(new Error('User not found!'))
            .exec()
            .then(() => res.status(200).json({ success: true, message: 'Valid reset token', token: req.params.token }))
            .catch(() => res.status(400).json({ success: false, message: 'Password reset token is invalid or has expired.' }));
    }

    async postPasswordReset(req: Request, res: Response) {
        async.waterfall([
            function (done) {
                User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, async (err, user) => {
                    if (err) return res.status(400).json({ success: false, message: 'Error finding user' });
                    if (!user) {
                        return res.status(400).json({ success: false, message: 'Password reset token is invalid or has expired.' });
                    }

                    user.password = req.body.password;
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;

                    await user.save((err1) => {
                        done(err1, user);
                    });
                }).orFail(new Error('User not found!'));
            },
            function (user, done) {
                SES.sendEmail({
                    Destination: {
                        ToAddresses: [user.email],
                    },
                    Message: {
                        Body: {
                            Html: {
                                Charset: 'UTF-8',
                                Data: 'You are receiving this because you (or someone else) have successfully reset your password.<br/>',
                            },
                        },
                        Subject: {
                            Charset: 'UTF-8',
                            Data: 'Password Successfully Reset',
                        },
                    },
                    Source: `Picstop <${process.env.LOGIN_USER}>`,
                }).promise();
                done();
            },
        ], (err) => {
            if (err) {
                if (err.name.includes('ValidationError')) return res.status(400).json({ success: false, message: err.message });
                logger.error(`Error resetting password with error ${err} `);
                return res.status(500).json({ success: false, message: err });
            }
            return res.status(200).json({ success: true, message: 'Password successfully reset' });
        });
    }
}
