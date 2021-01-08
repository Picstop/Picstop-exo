import express from 'express';
import { isAuthenticated } from '../config/passport';
import ReporterController from '../controllers/reports';
import ReporterMiddleware from '../middleware/reports';
import { NewRequest as Request } from '../types/types';

const router = express.Router();

const reporter = new ReporterController();
const reporterMiddleware = new ReporterMiddleware();

router.post('/comment', isAuthenticated, reporterMiddleware.checkIfCommentAuthor, reporterMiddleware.checkIfUserReportedComment, (req: Request, res) => reporter.createCommentReport(req, res));

router.post('/location', isAuthenticated, reporterMiddleware.checkIfUserReportedLocation, (req: Request, res) => reporter.createLocationReport(req, res));

router.post('/user', isAuthenticated, reporterMiddleware.notThemself, reporterMiddleware.checkIfUserReportedUser, (req: Request, res) => reporter.createUserReport(req, res));

router.post('/post', isAuthenticated, reporterMiddleware.checkIfPostAuthor, reporterMiddleware.checkIfUserReportedPost, (req: Request, res) => reporter.createPostReport(req, res));
export default router;
