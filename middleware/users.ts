import { NextFunction, Response } from 'express';

import User from '../models/user';
import initLogger from '../core/logger';
import { NewRequest as Request } from '../types/types';
import Location from '../models/location';

export default class UserMiddleware {
    checkFields(req: Request, res: Response, next: NextFunction) {
        if (!req.body.username || !req.body.email || !req.body.password || !req.body.password2) {
            return res.status(400).json({ success: false, message: 'Missing parameters' });
        }
        return next();
    }

    checkPasswordMatch(req: Request, res: Response, next: NextFunction) {
        const { password, password2 } = req.body;
        if (password === password2) { return next(); }
        return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    async allowedToViewProfile(req: Request, res: Response, next: NextFunction) {
        const { username } = req.params;
        try {
            const user = await User.findOne({ username })
                .orFail(new Error('User not found!'))
                .exec();
            const requestedUser = await User.findById(req.user._id).orFail(new Error('Request user not found!')).exec();
            const follows = user.followers.some((follower) => `${follower}` == (req.user._id));
            const incomingBlocks = await user.blocked.some((usr) => `${usr}` == (req.user._id));
            const outgoingBlocks = await requestedUser.blocked.some((users) => `${users}` == user._id);
            if (incomingBlocks === true || outgoingBlocks === true) {
                return res.status(401).json({ success: false, message: 'User either blocked you or you blocked user' });
            }
            if (!user.private) { return next(); }

            if (!follows) {
                const locations = await Location.find({ author: user._id });
                return res.status(200).json({
                    success: true,
                    private: true,
                    message: {
                        user: {
                            _id: user._id,
                            followers: user.followers.length,
                            following: user.following.length,
                            name: user.name,
                            bio: user.bio,
                        },
                        locations: locations.length,

                    },
                });
            }
            return next();
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // isBlocked
    async isBlocked(req: Request, res: Response, next: NextFunction) {
        const { id } = req.body;
        try {
            const user = await User.findById(id)
                .orFail(new Error('User not found!'))
                .exec();
            const requestedUser = await User.findById(req.user._id).orFail(new Error('Requested user not found!')).exec();
            const incomingBlocks = await user.blocked.some((usr) => `${usr}` == (req.user._id));
            const outgoingBlocks = await requestedUser.blocked.some((users) => `${users}` == user._id);
            if (incomingBlocks === true || outgoingBlocks === true) {
                return res.status(401).json({ success: false, message: 'User either blocked you or you blocked user' });
            }
            return next();
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async alreadyBlocked(req: Request, res: Response, next: NextFunction) {
        const { id } = req.body;
        try {
            const user = await User.findById(id)
                .orFail(new Error('User not found!'))
                .exec();
            const requestedUser = await User.findById(req.user._id).orFail(new Error('Requested user not found!')).exec();
            const outgoingBlocks = await requestedUser.blocked.some((users) => `${users}` == user._id);
            if (outgoingBlocks === true) {
                return res.status(401).json({ success: false, message: 'User already blocked' });
            }
            return next();
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async alreadyFollowedOrRequested(req: Request, res: Response, next: NextFunction) {
        const { id } = req.body;
        try {
            const user = await User.findById(id)
                .orFail(new Error('User not found!'))
                .exec();
            const follows = user.followers.some((follower) => `${follower}` == (req.user._id));
            const requested = user.followerRequests.some((follower) => `${follower}` == (req.user._id));
            if (follows === true || requested === true) {
                return res.status(401).json({ success: false, message: 'User already requested or follows user' });
            }
            return next();
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // check if already unblocked
    async alreadyUnblocked(req: Request, res: Response, next: NextFunction) {
        const { id } = req.body;

        try {
            const user = await User.findById(id)
                .orFail(new Error('User not found!'))
                .exec();
            const requestedUser = await User.findById(req.user._id).orFail(new Error('Requested user not found!')).exec();
            const blocked = requestedUser.blocked.some((users) => `${users}` == user._id);

            if (!blocked) {
                return res.status(400).json({ success: false, message: 'User is already unblocked' });
            }
            return next();
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // check if already unfollowed
    async alreadyUnfollowed(req: Request, res: Response, next: NextFunction) {
        const { id } = req.body;
        try {
            const user = await User.findById(id)
                .orFail(new Error('User not found!'))
                .exec();

            const follows = user.followers.some((follower) => `${follower}` == (req.user._id));
            if (!follows) {
                return res.status(400).json({ success: false, message: 'User is already unfollowed' });
            }
            return next();
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // check if follow request exists
    async alreadyRequestedToFollow(req: Request, res: Response, next: NextFunction) {
        const { id } = req.body;
        try {
            const user = await User.findById(id)
                .orFail(new Error('User not found!'))
                .exec();
            const requested = user.followerRequests.some((follower) => `${follower}` == (req.user._id));
            if (!requested) { return next(); }
            return res.status(400).json({ success: false, message: 'Already requested to follow' });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async didntRequestToFollow(req: Request, res: Response, next: NextFunction) {
        const { id } = req.body;
        try {
            const user = await User.findById(id)
                .orFail(new Error('User not found!'))
                .exec();
            const requested = user.followerRequests.some((follower) => `${follower}` == (req.user._id));
            if (!requested) {
                return res.status(400).json({ success: false, message: 'Follow request does not exist.' });
            }
            return next();
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async followRequestExists(req: Request, res: Response, next: NextFunction) {
        const { id } = req.body;
        try {
            const user = await User.findById(id)
                .orFail(new Error('User not found!'))
                .exec();
            const requestedUser = await User.findById(req.user._id).orFail(new Error('Requested user not found!')).exec();
            const requested = requestedUser.followerRequests.some((follower) => `${follower}` == (user.id));
            if (!requested) {
                return res.status(400).json({ success: false, message: 'Follow request does not exist.' });
            }
            return next();
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async notThemself(req: Request, res: Response, next: NextFunction) {
        const { id } = req.body;
        if (req.user._id.equals(id)) return res.status(400).json({ success: false, message: 'Cannot attempt user actions on yourself' });
        return next();
    }
}
