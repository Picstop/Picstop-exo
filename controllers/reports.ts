/* eslint-disable class-methods-use-this */
import { NextFunction, Response } from 'express';
import { NewRequest as Request } from '../types/types';
import commentReport from '../models/commentReport';
import userReport from '../models/userReport';
import postReport from '../models/postReport';
import locationReport from '../models/locationReport';
import initLogger from '../core/logger';

const logger = initLogger('ControllerReport');

export default class ReportController {
    // create comment report (check author, check if already reported)
    async createCommentReport(req: Request, res: Response) {
        const { reason, comment } = req.body;
        const reportedBy = req.user._id;
        const newReport = new commentReport({
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

        const newReport = new postReport({
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

        const newReport = new userReport({
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

        const newReport = new locationReport({
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
