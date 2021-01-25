import express from 'express';
import CommentController from '../controllers/comments';
import CommentMiddleware from '../middleware/comments';
import { NewRequest as Request } from '../types/types';
import { isAuthenticated } from '../config/passport';

const router = express.Router();
const Comments = new CommentController();

router.post('/', isAuthenticated, async (req: Request, res) => Comments.createComment(req, res));

router.get('/get/:id', isAuthenticated, async (req: Request, res) => Comments.getComment(req, res));

router.delete('/delete/:id', isAuthenticated, CommentMiddleware.verifyAuthor, async (req: Request, res) => Comments.deleteComment(req, res));

router.post('/like/:id', isAuthenticated, CommentMiddleware.checkIfAlreadyLiked, async (req: Request, res) => Comments.likeComment(req, res));

router.patch('/update/:id', isAuthenticated, CommentMiddleware.verifyAuthor, async (req: Request, res) => Comments.editComment(req, res));

router.post('/unlike/:id', isAuthenticated, CommentMiddleware.checkIfAlreadyUnliked, async (req: Request, res) => Comments.unlikeComment(req, res));

export default router;
