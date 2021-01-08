import { NextFunction, Request, Response } from 'express';
import { IVerifyOptions } from 'passport-local';
import passport from 'passport';

import { IUser } from '../types/types';
import User from '../models/user';
import initLogger from '../core/logger';
import { MongoError } from 'mongodb';

const logger = initLogger('ControllerUser');

export default class UserController {
    async postSignup (req: Request, res: Response){
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
               return res.status(201).json({ success: true, message: 'Successfully signed up.' })
            });
    
            passport.authenticate('local');
        
    };
    
    async postLogin (req: Request, res: Response, next: NextFunction) {
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
                req.logIn(user, (err) => {
                    if (err) {
                        logger.error(`Error when logging a user in: ${err}`);
                        return res.status(500).json({ success: false, message: 'Login error' });
                    }
                    return res.status(200).json({ success: true, message: 'Logged in' });
                });
            },
        )(req, res, next);
    };
    
    logout(req: Request, res: Response){
        req.logout();
        return res.status(200).json({ success: true, message: 'logged out' });
    };

    async getUser(req: Request, res: Response){
        const { id } = req.params;
        User.findById(id).exec()
        .then((user: IUser) =>{
            return res.status(200).json({ success: true, message: user })
        }).catch((err: Error) => {
            logger.error(`Error getting user by id: ${id} with error: ${err}`)
            return res.status(500).json({ success: false, message: err.message })
        })
    }



    async followUser(req: Request, res: Response){
        const id = req.body.id 
        try {
            
            const isPrivate = await this.isPrivate(id)
            if(isPrivate == null){
                logger.error(`Error getting user ${id} 's privacy setting`)
                return res.status(500).json({ success: false, message: 'Error getting user\'s privacy setting' })
            } else if (isPrivate) {
                await User.findByIdAndUpdate(id, { $push: {followerRequests: req.user['_id']} }).exec()
                return res.status(200).json({ success: true, message: 'Successfully requested to follow user'});
                
            } else if(!isPrivate){
                await  User.findByIdAndUpdate(id, {$push: {followers: req.user['_id']} }).exec()
                await User.findByIdAndUpdate(req.user['_id'], {$push: {following: id }}).exec()
                return res.status(200).json({ success: true, message: 'Successfully followed user'})
            }

        } catch (error) {
            logger.error(`Error following / requesting ${id} by ${req.user['_id']} with error: ${error}`)
            return res.status(500).json({success: false, message: error})
        }
    }


    async isPrivate(id: IUser['id']){
        const user = await User.findById(id).exec()
        return user.private
    }

    async blockUser(req: Request, res: Response){
        const { id } = req.body
        try {
            await User.findByIdAndUpdate(req.user['_id'], {$push: {blocked: id }, $pull: { following: id, followers: id} }).exec()
            await User.findByIdAndUpdate(id, {$pull: {following: req.user['_id'], followers: req.user['_id']}}).exec()
            return res.status(200).json({ success: true, message: `Successfully blocked user ${id}` })
        } catch (error) {
            logger.error(`Error blocking user ${id} by ${req.user['_id']}`)
            return res.status(500).json({ success: false, message: error })
        }
       
       
    }

    // unblock
    // check if blocked
    async unblockUser(req: Request, res: Response){
        const id = req.body.id
        User.findByIdAndUpdate(req.user['_id'], {$pull: {blocked: id }}).exec()
        .then(() =>{
            return res.status(200).json({ success: true, message: `Successfully unblocked ${id}`})
        }).catch(error =>{
            logger.error(`Error unblocking ${id} by ${req.user['_id']} with error: ${error}`)
            return res.status(500).json({ success: false, message: error })
        })
    }
   
    //unfollow
    // check if already unfollowed
    async unfollowUser(req: Request, res: Response){
        const id = req.body.id;
        User.findByIdAndUpdate(req.user['_id'], {$pull: {following: id }}).exec()
        .then(() =>{
            return res.status(200).json({ success: true, message: `Successfully unfollowed ${id}`})
        }).catch(error =>{
            logger.error(`Error unfollowing ${id} by ${req.user['_id']} with error: ${error}`)
            return res.status(500).json({ success: false, message: error })
        })


    }

    // accept follow request
    //check if request exists
    async acceptFollowRequest(req: Request, res: Response){
        const id = req.body.id;
        try {
            await User.findByIdAndUpdate(req.user['_id'], {$pull: {followerRequests: id}, $push: {followers: id}}).exec()
            await User.findByIdAndUpdate(id, { $push: {following: req.user['_id']}}).exec()
            return res.status(200).json({ success: true, message: 'Successfully accepted follow request'})
        } catch (error) {
            logger.error(`Error accepting ${id} 's follow request for ${req.user['_id']} with error: ${error}`)
            return res.status(500).json({ success: false, message: error })
        }

    }

    async removeFollowRequest(req: Request, res: Response){
        const id = req.body.id;
        User.findByIdAndUpdate(id, {$pull: {followerRequests: req.user['_id'] }}).exec()
        .then(() =>{
            return res.status(200).json({ success: true, message: `Successfully removed follow request to ${id}`})
        }).catch(error =>{
            logger.error(`Error removing follow request to ${id} by ${req.user['_id']} with error: ${error}`)
            return res.status(500).json({ success: false, message: error })
        })
        
    }

    async updateUsername(req: Request, res: Response){
        const username = req.body.username.trim().toLowerCase();
        if (username == req.user['username']) return res.status(400).json({ success: true, message: 'Username is the same as requested' })
        User.findByIdAndUpdate(req.user['_id'], {username: username}, {runValidators: true}).exec()
        .then(() =>{
            return res.status(200).json({ success: true, message: 'Successfully updated username'})
        }).catch((error) => {
            if (error.codeName === 'DuplicateKey') return res.status(400).json({ success: false, message: 'Username already exists' })
            if (error.message.includes('Validation')) return res.status(400).json({ success: false, message: error.message})
            logger.error(`Error updating username to ${username} for user ${req.user['_id']} with error ${error}`)
            return res.status(500).json({ success: false, message: error})
        })


    }
    
    async updatePrivacy(req: Request, res: Response){
        const privacy = req.body.privacy;
        if (privacy == false){
            try {
                await User.update({ _id: {$in: req.user['followerRequests']}}, {$push: {following: req.user['_id']}}).exec()
                await User.findByIdAndUpdate(req.user['_id'], { private: privacy, $push: {followers: req.user['followerRequests'] }, $set: {followerRequests: [] }}).exec()
                return res.status(200).json({ success: true, message: 'Succesfully updated privacy setting and added all follower requests as followers'})
            } catch (error) {
                logger.error(`Error updating privacy to ${privacy} and adding all follow requests as followers for user ${req.user['_id']} with error: ${error}`)
                return res.status(500).json({ success: false, message: error })
            }
 
        } else {
            User.findByIdAndUpdate(req.user['_id'], { private: privacy }).exec()
            .then(() => {
                return res.status(200).json({ success: true, message: 'Successfully updated privacy setting' })
            }).catch((error: Error) => {
                logger.error(`Error updating privacy to ${privacy} for user ${req.user['_id']} with error: ${error}`)
                return res.status(500).json({ success: false, message: error })
            })
        }
        
    }

    async updateProfile(req: Request, res: Response){
        const { name, bio } = req.body;

        User.findByIdAndUpdate(req.user['_id'], {name: name, bio: bio}, {runValidators: true}).exec()
        .then(() => {
            return res.status(200).json({ success: true, message: 'Successfully updated name and bio. '})
        }).catch((error: Error) => {
            if (error.message.includes('Validation')) return res.status(400).json({ success: false, message: error.message})
            logger.error(`Error updating profile for user ${req.user['_id']}`)
            return res.status(500).json({ success: false, message: error})
        })
    }
    

}

