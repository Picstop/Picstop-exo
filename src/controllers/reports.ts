/* eslint-disable class-methods-use-this */
import { Response } from 'express';
import { NewRequest as Request } from '../types/types';
import CommentReport from '../models/commentReport';
import UserReport from '../models/userReport';
import PostReport from '../models/postReport';
import LocationReport from '../models/locationReport';
import initLogger from '../core/logger';

const logger = initLogger('ControllerReport');

export default class ReportController {
    // create comment report (check author, check if already reported)
    async createCommentReport(req: Request, res: Response) {
        const { reason, comment } = req.body;
        const reportedBy = req.user._id;
        const newReport = new CommentReport({
            reportedBy,
            reason,
            comment,
        });
        newReport.save()
            .then(() => res.status(201).json({ success: true, message: 'Successfully submitted report' })).catch((err) => {
                if (err.message.toLowerCase().includes('validation')) return res.status(400).json({ success: false, message: err.message });
                logger.error(`Error saving comment report for comment ${comment} by user ${reportedBy} with error: ${err}`);
                return res.status(500).json({ success: false, message: err });
            });
    }
    // create post report (check author, check if already reported)

    async createPostReport(req: Request, res: Response) {
        const { reason, post } = req.body;
        const reportedBy = req.user._id;

        const newReport = new PostReport({
            reportedBy,
            reason,
            post,
        });
        newReport.save()
            .then(() => res.status(201).json({ success: true, message: 'Successfully submitted report' })).catch((err) => {
                if (err.message.toLowerCase().includes('validation')) return res.status(400).json({ success: false, message: err.message });
                logger.error(`Error saving post report for post ${post} by user ${reportedBy} with error: ${err}`);
                return res.status(500).json({ success: false, message: err });
            });
    }

    // create user report (check author, check if already reported)
    async createUserReport(req: Request, res: Response) {
        const { reason, user } = req.body;
        const reportedBy = req.user._id;

        const newReport = new UserReport({
            reportedBy,
            reason,
            user,
        });
        newReport.save()
            .then(() => res.status(201).json({ success: true, message: 'Successfully submitted report' })).catch((err) => {
                if (err.message.toLowerCase().includes('validation')) return res.status(400).json({ success: false, message: err.message });
                logger.error(`Error saving user report for user ${user} by user ${reportedBy} with error: ${err}`);
                return res.status(500).json({ success: false, message: err });
            });
    }

    async createLocationReport(req: Request, res: Response) {
        const { reason, location } = req.body;
        const reportedBy = req.user._id;

        const newReport = new LocationReport({
            reportedBy,
            reason,
            location,
        });
        newReport.save()
            .then(() => res.status(201).json({ success: true, message: 'Successfully submitted report' })).catch((err) => {
                if (err.message.toLowerCase().includes('validation')) return res.status(400).json({ success: false, message: err.message });
                logger.error(`Error saving user report for location ${location} by user ${reportedBy} with error: ${err}`);
                return res.status(500).json({ success: false, message: err });
            });
    }
}
