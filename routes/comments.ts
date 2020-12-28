import express from 'express';
import CommentController from '../controllers/comments';

const router = express.Router();
const Comments = new CommentController();

router.post('/', async (req, res, next) => Comments.createComment(req, res, next));

router.get('/:id', async (req, res, next) => Comments.getComment(req, res, next));

router.delete('/:id', async (req, res, next) => Comments.deleteComment(req, res, next));

router.post('/:id/like', async (req, res, next) => Comments.likeComment(req, res, next));

router.patch('/:id', async (req, res, next) => Comments.editComment(req, res, next));

export default router;
