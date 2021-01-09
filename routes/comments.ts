import express from 'express';
import CommentController from '../controllers/comments';
import CommentMiddleware from '../middleware/comments';
import { NewRequest as Request } from '../types/types';

const router = express.Router();
const Comments = new CommentController();

router.post('/', async (req: Request, res) => Comments.createComment(req, res));

router.get('/:id', async (req: Request, res) => Comments.getComment(req, res));

router.delete('/:id', CommentMiddleware.verifyAuthor, async (req: Request, res) => Comments.deleteComment(req, res));

router.post('/:id/like', async (req: Request, res) => Comments.likeComment(req, res));

router.patch('/:id', CommentMiddleware.verifyAuthor, async (req: Request, res) => Comments.editComment(req, res));

export default router;
