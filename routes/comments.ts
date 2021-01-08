import express from 'express';
import CommentController from '../controllers/comments';
import CommentMiddleware from '../middleware/comments';
import { NewRequest as Request } from '../types/types';

const router = express.Router();
const Comments = new CommentController();

router.post('/', async (req: Request, res, next) => Comments.createComment(req, res, next));

router.get('/:id', async (req: Request, res, next) => Comments.getComment(req, res, next));

router.delete('/:id', CommentMiddleware.verifyAuthor, async (req: Request, res, next) => Comments.deleteComment(req, res, next));

router.post('/:id/like', async (req: Request, res, next) => Comments.likeComment(req, res, next));

router.patch('/:id', CommentMiddleware.verifyAuthor, async (req: Request, res, next) => Comments.editComment(req, res, next));

export default router;
