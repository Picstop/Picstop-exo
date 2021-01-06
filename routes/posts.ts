import express from 'express';
import PostController from '../controllers/posts';

const router = express.Router();
const Posts = new PostController();

router.post('/', async (req, res) => Posts.createPost(req, res));

router.get('/:id', async (req, res) => Posts.getPost(req, res));

router.delete('/:id', async (req, res) => Posts.deletePost(req, res));

router.get('/user', async (req, res) => Posts.getUserPosts(req, res));

router.patch('/:id', async (req, res) => Posts.updatePostCaption(req, res));

export default router;
