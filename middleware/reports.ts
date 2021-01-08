// check if author and check if already reported

import { NextFunction, Request, Response } from 'express'

import commentReport from '../models/commentReport';
import userReport from '../models/userReport';
import postReport from '../models/postReport';
import locationReport from '../models/locationReport';
import Comment from '../models/comment'
import Post from '../models/post'
import Location from '../models/location'
import initLogger from '../core/logger';

const logger = initLogger('MiddlewareReport');


export default class ReportMiddleware {

    async checkIfCommentAuthor(req: Request, res: Response, next: NextFunction){
        const { comment } = req.body;
        const reportedBy = req.user['_id']
        Comment.findById(comment).exec()
        .then((comment) => {
            if (`${comment.authorId}` ==  reportedBy){
                return res.status(400).json({ success: false, message: 'Cannot report your own comment' })
            } else {
                next()
            }
        }).catch((err) => {
            logger.error(`Error getting comment ${comment} with error ${err}`)
            return res.status(500).json({ success: false, message: err })
        })
    }

    async checkIfUserReportedComment(req: Request, res: Response, next: NextFunction){
        const { comment } = req.body;
        const reportedBy = req.user['_id']
        const reports = await commentReport.find({ comment: comment, reportedBy: reportedBy }).exec()

        if(reports.length < 1) {
            next()
        } else {
            return res.status(400).json({ success: false, message: 'User already reported comment.'})
        }
        
    }

    async checkIfPostAuthor(req: Request, res: Response, next: NextFunction){
        const { post } = req.body;
        const reportedBy = req.user['_id']
        Post.findById(post).exec()
        .then((post) => {
            if (`${post.authorId}` ==  reportedBy){
                return res.status(400).json({ success: false, message: 'Cannot report your own post' })
            } else {
                next()
            }
        }).catch((err) => {
            logger.error(`Error getting post ${post} with error ${err}`)
            return res.status(500).json({ success: false, message: err })
        })
    }

    async checkIfUserReportedPost(req: Request, res: Response, next: NextFunction){
        const { post } = req.body;
        const reportedBy = req.user['_id']
        const reports = await postReport.find({ post: post, reportedBy: reportedBy }).exec()

        if(reports.length < 1) {
            next()
        } else {
            return res.status(400).json({ success: false, message: 'User already reported Post.'})
        }
        
    }

    async notThemself(req: Request, res: Response, next: NextFunction){
        const { user } = req.body;
        if(req.user['_id'] == user) return res.status(400).json({ success: false, message: 'Cannot report yourself' })
        next()
    }

    async checkIfUserReportedUser(req: Request, res: Response, next: NextFunction){
        const { user } = req.body;
        const reportedBy = req.user['_id'];
        const reports = await userReport.find({ user: user, reportedBy: reportedBy }).exec()

        if(reports.length < 1) {
            next()
        } else {
            return res.status(400).json({ success: false, message: 'User already reported user.'})
        }
        
    }

    async checkIfUserReportedLocation(req: Request, res: Response, next: NextFunction){
        const { location } = req.body;
        const reportedBy = req.user['_id'];
        const reports = await locationReport.find({ location: location, reportedBy: reportedBy }).exec()

        if(reports.length < 1) {
            next()
        } else {
            return res.status(400).json({ success: false, message: 'User already reported location.'})
        }
    }




}
