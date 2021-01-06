import { NextFunction, Request, Response } from 'express'

import User from '../models/user';
import initLogger from '../core/logger';





export default class UserMiddleware {

    checkFields(req: Request, res: Response, next: NextFunction){
        if (!req.body.username || !req.body.email || !req.body.password || !req.body.password2){ 
            return res.status(400).json({ success: false, message: 'Missing parameters' })
        } else {
            next()
        }
    }
    checkPasswordMatch(req: Request, res: Response, next: NextFunction){
        const { password, password2 } = req.body;
        if(password === password2 ){
                next()
        } else if (password !== password2){
            return res.status(400).json({ success: false, message: 'Passwords do not match' })
        }
    }

    async allowedToViewProfile(req: Request, res: Response, next: NextFunction){
        const id = req.params.id
        const user = await User.findById(id).exec()
        const follows = user.followers.some((follower) => {
            return `${follower}` === (req.user['_id'])
        })
        const incomingBlocks = await user.blocked.some((user) => {
            return `${user}` == (req.user['_id'])
        })
        const outgoingBlocks = await req.user['blocked'].some((users) => {
            return `${users}` == user._id
        })
        if (incomingBlocks == true || outgoingBlocks == true){
            return res.status(401).json({ success: false, message: 'User either blocked you or you blocked user'})
        } else {
            if(!user.private) {
                next()
            } else {
                
                if (!follows){
                    return res.status(200).json({ success: true, private: true, message: { _id: user._id,
                                                                            followers: user.followers.length,
                                                                            following: user.following.length,
                                                                            name: user.name,
                                                                            bio: user.bio}})
                } else if(follows) {
                    next()
                }
                
            }

        }
       
    }

    // isBlocked
    async isBlocked(req: Request, res: Response, next: NextFunction){
        const id = req.body.id
        const user = await User.findById(id).exec()
        const incomingBlocks = await user.blocked.some((user) => {
            return `${user}` == (req.user['_id'])
        })
        const outgoingBlocks = await req.user['blocked'].some((users) => {
            return `${users}` == user._id
        })
        if (incomingBlocks == true || outgoingBlocks == true){
            return res.status(401).json({ success: false, message: 'User either blocked you or you blocked user'})

        } else {
            next()
        }
   
    }
    async alreadyBlocked(req: Request, res: Response, next: NextFunction){
        const id = req.body.id
        const user = await User.findById(id).exec()
        const outgoingBlocks = await req.user['blocked'].some((users) => {
            return `${users}` == user._id
        })
        if (outgoingBlocks == true){
            return res.status(401).json({ success: false, message: 'User already blocked'})

        } else {
            next()
        }

    }
    async alreadyFollowedOrRequested(req: Request, res: Response, next: NextFunction){
        const id = req.body.id
        const user = await User.findById(id).exec()
        const follows = user.followers.some((follower) => {
            return `${follower}` == (req.user['_id'])
        })
        const requested = user.followerRequests.some((follower) => {
            return `${follower}` == (req.user['_id'])
        })
        if (follows == true || requested == true){
            return res.status(401).json({ success: false, message: 'User already requested or follows user'})
        } else {
            next()
        }
    }

    // check if already unblocked
    async alreadyUnblocked(req: Request, res: Response, next: NextFunction){
        const id = req.body.id
        const user = await User.findById(id).exec()
        const blocked = req.user['blocked'].some((user) => {
            
            return `${user}` == user._id
        })

        if(!blocked){
            return res.status(400).json({ success: false, message: 'User is already unblocked'})
        } else {
            next()
        }
    }
    // check if already unfollowed
    async alreadyUnfollowed(req: Request, res: Response, next: NextFunction){
        const id = req.body.id
        const user = await User.findById(id).exec()
        const follows = user.followers.some((follower) => {
            return `${follower}` == (req.user['_id'])
        })
        if(!follows){
            return res.status(400).json({ success: false, message: 'User is already unfollowed' })
        } else {
            next()
        }
    }

    // check if follow request exists
    async alreadyRequestedToFollow(req: Request, res: Response, next: NextFunction){
        const id = req.body.id;
        const user = await User.findById(id).exec()
        const requested = user.followerRequests.some((follower) => {
            return `${follower}` == (req.user['_id'])
        })
        if(!requested){
            next()
        } else {
            return res.status(400).json({ success: false, message: 'Already requested to follow'})
        }
    }
    async didntRequestToFollow(req: Request, res: Response, next: NextFunction){
        const id = req.body.id;
        const user = await User.findById(id).exec()
        const requested = user.followerRequests.some((follower) => {
            return `${follower}` == (req.user['_id'])
        })
        if(!requested){
            return res.status(400).json({ success: false, message: 'Follow request does not exist.'})
            
        } else {
            next()
            
        }
    }

    async followRequestExists(req: Request, res: Response, next: NextFunction){
        const id = req.body.id;
        const user = await User.findById(id).exec()
        const requested = req.user['followerRequests'].some((follower) => {
            return `${follower}` == (user.id)
        })
        if(!requested){
            return res.status(400).json({ success: false, message: 'Follow request does not exist.'})
            
        } else {
            next()
            
        }

    }

    async notThemself(req: Request, res: Response, next: NextFunction){
        const id = req.body.id;
        if(req.user['_id'] == id) return res.status(400).json({ success: false, message: 'Cannot attempt user actions on yourself'})
        next()
    }
}
    
