import express from "express";
import { isAuthenticated } from "../config/passport";

const router = express.Router();
import ReporterController from '../controllers/reports'
import ReporterMiddleware from '../middleware/reports'
const reporter = new ReporterController();
const reporterMiddleware = new ReporterMiddleware();

router.post('/comment',  isAuthenticated, reporterMiddleware.checkIfCommentAuthor, reporterMiddleware.checkIfUserReportedComment, (req, res) => {
    return reporter.createCommentReport(req, res)
})

router.post('/location', isAuthenticated, reporterMiddleware.checkIfUserReportedLocation, (req, res) => {
    return reporter.createLocationReport(req, res)
} )

router.post('/user', isAuthenticated, reporterMiddleware.notThemself, reporterMiddleware.checkIfUserReportedUser,(req, res) => {
    return reporter.createUserReport(req, res)
})

router.post('/post', isAuthenticated, reporterMiddleware.checkIfPostAuthor, reporterMiddleware.checkIfUserReportedPost,(req, res) => {
    return reporter.createPostReport(req, res)
})
export default router;