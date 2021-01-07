import express from 'express';
import PostController from '../controllers/posts';

const router = express.Router();
const Posts = new PostController();

router.post('/createPost/', async (req, res) => Posts.createPost(req, res));

router.get('/getPost/:id', async (req, res) => Posts.getPost(req, res));

router.delete('/deletePost/:id', async (req, res) => Posts.deletePost(req, res));

router.get('/getUserPosts/', async (req, res) => Posts.getUserPosts(req, res));

router.patch('/updatePostCaption/:id', async (req, res) => Posts.updatePostCaption(req, res));

export default router;
