/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */

import { Response } from 'express';

import async from 'async';

import crypto from 'crypto';
import aws from 'aws-sdk';
import * as apn from 'apn';
import * as AWS from 'aws-sdk';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Error } from 'mongoose';
import initLogger from '../core/logger';
import Location from '../models/location';
// import s3 from '../core/s3';
import User from '../models/user';
import { IUser, NewRequest as Request } from '../types/types';
import Post from '../models/post';
import Album from '../models/album';
import Notification from '../models/notification';
import { apnProvider } from '../config/notifs';

const logger = initLogger('ControllerUser');
const SES = new aws.SES({
    region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS,
    secretAccessKey: process.env.AWS_SECRET,
});

const credentials = {
    accessKeyId: process.env.AWS_ACCESS,
    secretAccessKey: process.env.AWS_SECRET,
};
AWS.config.update({ credentials, region: 'us-east-1' });
const s3 = new AWS.S3();
const s3Bucket = process.env.BUCKET_NAME;
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
    }

    async postLogin(req: Request, res: Response) {
        const { username, password } = req.body;

        User.findOne({
            username,
        }).select('+password')
            .orFail(new Error('User not found!'))
            .then((user) => bcrypt.compare(password, user.password)
                .then((match) => {
                    if (match) {
                        const {
                            email, _id,
                        } = user;
                        return jwt.sign({
                            username,
                            email,
                            _id,
                        }, process.env.JWT_SECRET || '$$2d##dS#', {
                        }, (err, tk: String) => {
                            if (err)res.status(400).json({ success: false, message: err.message });
                            res.status(200).json({ success: true, message: tk });
                        });
                    } return res.status(400).json({ success: false, message: 'Incorrect password' });
                })
                .catch((err) => res.status(500).json({ success: false, message: err.message })))
            .catch((e) => res.status(500).json({ success: false, message: e.message }));
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
                .exec()
                .then(async (usr) => {
                    const url = await s3.getSignedUrl('getObject', {
                        Bucket: s3Bucket,
                        Key: `${usr._id}/pfp.jpg`,
                    });
                    return { ...JSON.parse(JSON.stringify(usr)), profilePic: url };
                });

            const locations = await Post.find({ authorId: user._id }).populate([{ path: 'likes', model: 'User' }, { path: 'comments', model: 'Comment' }]).exec()
                .then((posts) => {
                    const reMakePost = posts.map((z) => {
                        const imagePromises = z.images.map((i) => s3.getSignedUrl('getObject', {
                            Bucket: s3Bucket,
                            Key: i,
                        }));
                        return Promise.all(imagePromises).then((urls) => ({ ...JSON.parse(JSON.stringify(z)), images: urls }));
                    });
                    return Promise.all(reMakePost);
                });
            const albums = await Album.find({ author: user._id }).populate([{ path: 'posts', model: 'Post' }]).exec()
                .then(async (albs) => {
                    // console.log(albs);
                    albs.map(async (album) => {
                        const post = await Post.findById(album.posts[0]).orFail(new Error('Error finding post in album')).exec();
                        const download = await s3.getSignedUrl('getObject', {
                            Bucket: s3Bucket,
                            Key: post.images[0],
                        });

                        album.coverImage = download;
                        return album;
                    });
                    return albs;
                });
            const userLocationSet = new Set(locations);
            const userLocations = [...userLocationSet];
            return res.status(200).json({ success: true, message: { user, userLocations, albums } });
        } catch (error) {
            logger.error(`Error getting user by username: ${username} with error: ${error}`);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async getUsersByArray(req: Request, res: Response) {
        const { users } = req.body;
        User.find({ _id: { $in: users } }).exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((error) => {
                logger.error(`Error getting users by array of ids ${users} with error ${error}`);
                res.status(500).json({ success: false, message: error.message });
            });
    }

    async getUserById(req: Request, res: Response) {
        const { id } = req.params;
        console.log(id);
        try {
            const user = await User.findById(id)
                .orFail(new Error('User not found!'))
                .exec()
                .then(async (usr) => {
                    const url = await s3.getSignedUrl('getObject', {
                        Bucket: s3Bucket,
                        Key: `${id}/pfp.jpg`,
                    });
                    return { ...JSON.parse(JSON.stringify(usr)), profilePic: url };
                });

            const locations = await Post.find({ authorId: user._id }).populate([{ path: 'likes', model: 'User' }, { path: 'comments', model: 'Comment' }]).exec()
                .then((posts) => {
                    const reMakePost = posts.map((z) => {
                        const imagePromises = z.images.map((i) => s3.getSignedUrl('getObject', {
                            Bucket: s3Bucket,
                            Key: i,
                        }));
                        return Promise.all(imagePromises).then((urls) => ({ ...JSON.parse(JSON.stringify(z)), images: urls }));
                    });
                    return Promise.all(reMakePost);
                });
            const userLocationSet = new Set(locations);
            const userLocations = [...userLocationSet];
            return res.status(200).json({ success: true, message: { user, userLocations } });
        } catch (error) {
            logger.error(`Error getting user by id: ${id} with error: ${error}`);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async followUser(req: Request, res: Response) {
        const { id } = req.body;
        try {
            const isPrivate = await this.isPrivate(id);
            if (isPrivate === null) {
                logger.error(`Error getting user ${id} 's privacy setting`);
                return res.status(500).json({ success: false, message: 'Error getting user\'s privacy setting' });
            } if (isPrivate) {
                await User.findByIdAndUpdate(id, { $push: { followerRequests: req.user._id }, $inc: { notifications: 1 } })
                    .orFail(new Error('User not found!'))
                    .exec()
                    .then(async (user) => {
                        const newNotif = await new Notification({
                            userId: user._id,
                            relatedUserId: req.user.id,
                            notificationType: 'FOLLOW_REQUEST',
                        }).save();
                        const notif = new apn.Notification({
                            id: newNotif._id,
                            category: 'FOLLOW_REQUEST',
                            title: 'New follow request',
                            topic: process.env.APP_BUNDLE_ID,
                            body: `${req.user.username} has requested to follow you`,
                            expiry: Math.floor(Date.now() / 1000) + 600,
                            sound: 'default',
                            pushType: 'alert',
                            badge: user.notifications,
                            payload: {
                                userId: user._id,
                            },
                        });
                        apnProvider.send(notif, user.identifiers);
                        return user;
                    });
                return res.status(200).json({ success: true, message: 'Successfully requested to follow user' });
            }
            await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } })
                .orFail(new Error('User not found!'))
                .exec()
                .then(async (user) => {
                    const newNotif = await new Notification({
                        userId: user._id,
                        relatedUserId: req.user.id,
                        notificationType: 'FOLLOWED',
                    }).save();
                    const notif = new apn.Notification({
                        id: newNotif._id,
                        category: 'FOLLOWED',
                        title: 'New follower',
                        topic: process.env.APP_BUNDLE_ID,
                        body: `${req.user.username} is now following you`,
                        expiry: Math.floor(Date.now() / 1000) + 600,
                        sound: 'default',
                        pushType: 'alert',
                        badge: user.notifications,
                        payload: {
                            userId: user._id,
                        },
                    });
                    apnProvider.send(notif, user.identifiers);
                    return user;
                });
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
            await User.findByIdAndUpdate(id, { $push: { following: req.user._id }, $inc: { notifications: 1 } })
                .orFail(new Error('User not found!'))
                .exec()
                .then(async (user) => {
                    const newNotif = await new Notification({
                        userId: user._id,
                        relatedUserId: req.user._id,
                        notificationType: 'REQUEST_ACCEPTED',
                    }).save();
                    const notif = new apn.Notification({
                        id: newNotif._id,
                        category: 'REQUEST_ACCEPTED',
                        title: 'Follow request accepted',
                        topic: process.env.APP_BUNDLE_ID,
                        body: `${req.user.username} has accepted your follow request`,
                        expiry: Math.floor(Date.now() / 1000) + 600,
                        sound: 'default',
                        pushType: 'alert',
                        badge: user.notifications,
                        payload: {
                            userId: user._id,
                        },
                    });
                    return apnProvider.send(notif, user.identifiers);
                });
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
            .then(async (user) => {
                await Notification.findOneAndDelete({ relatedUserId: req.user._id, userId: user._id, notificationType: 'FOLLOW_REQUEST' })
                    .orFail(new Error('Could not delete notification'))
                    .exec()
                    .then(() => console.log('deleted'))
                    .catch((err) => logger.error(`Error while removing follow request notification ${id}: ${err}`));
                return user;
            })
            .then(() => res.status(200).json({ success: true, message: `Successfully removed follow request to ${id}` }))
            .catch((error) => {
                logger.error(`Error removing follow request to ${id} by ${req.user._id} with error: ${error}`);
                return res.status(500).json({ success: false, message: error });
            });
    }

    async updatePfp(req: Request, res: Response) {
        const { id } = req.body;
        try {
            const uploadUrl = await s3.getSignedUrl('putObject', {
                Bucket: s3Bucket,
                Key: `${id}/pfp.jpg`,
                Expires: 60,
                ContentType: 'image/jpeg',
                ACL: 'public-read',
            });
            const profilePic = await s3.getSignedUrl('getObject', { // is the put url the same as the get url?
                Bucket: s3Bucket,
                Key: `${id}/pfp.jpg`,
                Expires: 60,
            });

            return User.findByIdAndUpdate(id, { profilePic })
                .then((usr) => res.status(200).json({
                    user: usr,
                    uploadUrl,
                })).catch((error) => {
                    logger.error(`Error making pfp for user ${id} with error: ${error}`);
                    return res.status(500).json({ success: false, message: error.message });
                });
        } catch (err) {
            logger.error(`Error making pfp for user ${id} with error: ${err}`);
            return res.status(500).json({ success: false, message: err.message });
        }
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
                const user = await User.findById(req.user._id).orFail(new Error('Error finding user')).exec();
                await User.updateMany({ _id: { $in: user.followerRequests } }, { $push: { following: req.user._id } }).exec();
                await User.findByIdAndUpdate(req.user._id, { private: privacy, $push: { followers: { $each: user.followerRequests } }, $set: { followerRequests: [] } })
                    .orFail(new Error('User not found!'))
                    .exec();
                return res.status(200).json({ success: true, message: 'Succesfully updated privacy setting and added all follower requests as followers' });
            } catch (error) {
                logger.error(`Error updating privacy to ${privacy} and adding all follow requests as followers for user ${req.user._id} with error: ${error}`);
                return res.status(500).json({ success: false, message: error.message });
            }
        } else {
            return User.findByIdAndUpdate(req.user._id, { private: privacy })
                .orFail(new Error('User not found!'))
                .exec()
                .then(() => res.status(200).json({ success: true, message: 'Successfully updated privacy setting' }))
                .catch((error: Error) => {
                    logger.error(`Error updating privacy to ${privacy} for user ${req.user._id} with error: ${error}`);
                    return res.status(500).json({ success: false, message: error.message });
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
            (done) => {
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
            (user, done) => {
                // create the random token
                crypto.randomBytes(20, (err, buffer) => {
                    const token = buffer.toString('hex');
                    done(err, user, token);
                });
            },
            (user, token, done) => {
                User.findByIdAndUpdate({ _id: user._id }, { resetPasswordToken: token, resetPasswordExpires: Date.now() + 86400000 }, { new: true })
                    .orFail(new Error('User not found!'))
                    .exec((err, newUser) => {
                        done(err, token, newUser);
                    });
            },
            (token, user, done) => {
                SES.sendEmail({
                    Destination: {
                        ToAddresses: [user.email],
                    },
                    Message: {
                        Body: {
                            Html: {
                                Charset: 'UTF-8',
                                // eslint-disable-next-line max-len
                                Data: `You are receiving this because you (or someone else) have requested the reset of the password for your account.<br/><br/>Please click on the following link, or paste this into your browser to reset your password:<br/><br/> picstop://user/reset/${token}<br/><br/>If you did not request this, please ignore this email and your password will remain unchanged.<br/>`,
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
            (done) => {
                // eslint-disable-next-line consistent-return
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
            (user, done) => {
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

    async search(req: Request, res: Response) {
        try {
            const { query } = req.body;
            const users = await User.find({ username: { $regex: query, $options: 'i' } }).exec();
            const locations = await Location.find({ name: { $regex: query, $options: 'i' } }).exec();
            await users.forEach(async (usr) => {
                const url = await s3.getSignedUrl('getObject', {
                    Bucket: s3Bucket,
                    Key: `${usr._id}/pfp.jpg`,
                });
                usr.profilePic = url;
            });
            return res.status(200).json({ success: true, message: { users, locations } });
        } catch (error) {
            logger.error(`Error searching ${req.body.query} with error ${error}`);
            return res.status(500).json({ success: false, message: error });
        }
    }

    async getMe(req: Request, res: Response) {
        try {
            const user = await User.findById(req.user._id)
                .orFail(new Error('User not found!'))
                .exec()
                .then(async (usr) => {
                    const url = await s3.getSignedUrl('getObject', {
                        Bucket: s3Bucket,
                        Key: `${usr._id}/pfp.jpg`,
                    });
                    usr.profilePic = url;
                    return usr;
                });

            const locations = await Post.find({ authorId: user._id }).populate([{ path: 'likes', model: 'User' }, { path: 'comments', model: 'Comment' }]).exec()
                .then((posts) => {
                    const reMakePost = posts.map((z) => {
                        const imagePromises = z.images.map((i) => s3.getSignedUrl('getObject', {
                            Bucket: s3Bucket,
                            Key: i,
                        }));
                        return Promise.all(imagePromises).then((urls) => {
                            z.images = urls;
                            return z;
                        });
                    });
                    return Promise.all(reMakePost);
                });
            const albums = await Album.find({ author: user._id }).populate([{ path: 'posts', model: 'Post' }]).exec()
                .then(async (albs) => {
                    // console.log(albs);
                    albs.map(async (album) => {
                        const post = await Post.findById(album.posts[0]).orFail(new Error('Error finding post in album')).exec();
                        const download = await s3.getSignedUrl('getObject', {
                            Bucket: s3Bucket,
                            Key: post.images[0],
                        });

                        album.coverImage = download;
                        return album;
                    });
                    return albs;
                });
            const userLocationSet = new Set(locations);
            const userLocations = [...userLocationSet];
            return res.status(200).json({ success: true, message: { user, userLocations, albums } });
        } catch (error) {
            logger.error(`Error getting user ${req.user._id} with error: ${error}`);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // User.findByIdAndUpdate(req.user._id, { name, bio }, { runValidators: true })
    // .orFail(new Error('User not found!'))
    // .exec()
    // .then(() => res.status(200).json({ success: true, message: 'Successfully updated name and bio. ' }))
    // .catch((error: Error) => {
    //     if (error.message.includes('Validation')) return res.status(400).json({ success: false, message: error.message });
    //     logger.error(`Error updating profile for user ${req.user._id}`);
    //     return res.status(500).json({ success: false, message: error });
    // });

    async addDeviceIdentifier(req: Request, res: Response) {
        const { token } = req.body;
        const update = { $addToSet: { identifiers: token } };
        User.findByIdAndUpdate(req.user._id, update, { runValidators: true })
            .orFail(new Error('User not found!'))
            .exec()
            .then(() => res.status(200).json({ success: true, message: 'Device id successfully added' }))
            .catch((error: Error) => {
                if (error.message.includes('Validation')) return res.status(400).json({ success: false, message: error.message });
                logger.error(`Error updating profile for user ${req.user._id}`);
                return res.status(500).json({ success: false, message: error });
            });
    }

    async removeDeviceIdentifier(req: Request, res: Response) {
        const { token } = req.body;
        const update = { $pull: { identifiers: token } };
        await User.findByIdAndUpdate(req.user._id, update)
            .orFail(new Error('User not found!'))
            .exec()
            .then(() => res.status(200).json({ success: true, message: 'Device id successfully removed' }))
            .catch((error: Error) => {
                logger.error(`Error updating profile for user ${req.user._id}`);
                return res.status(500).json({ success: false, message: error });
            });
    }
}
