import express from 'express';
import UserController from '../controllers/user';
import { isAuthenticated } from '../config/passport';
import UserMiddleware from '../middleware/users';
import { NewRequest as Request } from '../types/types';

const router = express.Router();
const userController = new UserController();

const userMiddleware = new UserMiddleware();

router.post('/signup',
    userMiddleware.checkFields,
    userMiddleware.checkPasswordMatch,
    (req: Request, res) => userController.postSignup(req, res));

router.post('/login',
    (req: Request, res) => userController.postLogin(req, res));

router.post('/logout',
    isAuthenticated,
    (req: Request, res) => userController.logout(req, res));

router.get('/get/:username',
    isAuthenticated,
    userMiddleware.allowedToViewProfile, (req: Request, res) => userController.getUser(req, res));

router.get('/getById/:id', isAuthenticated, userMiddleware.allowedToViewById, async (req: Request, res) => userController.getUserById(req, res));

router.get('/getByArray', isAuthenticated, (req: Request, res) => userController.getUsersByArray(req, res));

router.get('/', isAuthenticated, (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Cannot get user, please login' });
    }
    return res.status(200).json({ success: true, message: req.user });
});

router.post('/follow',
    isAuthenticated,
    userMiddleware.notThemself,
    userMiddleware.isBlocked,
    userMiddleware.alreadyFollowedOrRequested,
    (req: Request, res) => userController.followUser(req, res));

router.post('/block',
    isAuthenticated,
    userMiddleware.notThemself,
    userMiddleware.alreadyBlocked,
    (req: Request, res) => userController.blockUser(req, res));

router.post('/unblock',
    isAuthenticated,
    userMiddleware.notThemself,
    userMiddleware.alreadyUnblocked,
    (req: Request, res) => userController.unblockUser(req, res));

router.post('/unfollow',
    isAuthenticated,
    userMiddleware.notThemself,
    userMiddleware.alreadyUnfollowed,
    (req: Request, res) => userController.unfollowUser(req, res));

router.post('/request/remove',
    isAuthenticated,
    userMiddleware.notThemself,
    userMiddleware.didntRequestToFollow,
    (req: Request, res) => userController.removeFollowRequest(req, res));

router.post('/request/accept',
    isAuthenticated, userMiddleware.notThemself,
    userMiddleware.followRequestExists,
    (req: Request, res) => userController.acceptFollowRequest(req, res));

router.post('/profilePicture',
    isAuthenticated,
    (req: Request, res) => userController.updatePfp(req, res));

router.patch('/username',
    isAuthenticated,
    (req: Request, res) => userController.updateUsername(req, res));

router.patch('/privacy',
    isAuthenticated,
    (req: Request, res) => userController.updatePrivacy(req, res));

router.patch('/',
    isAuthenticated,
    (req: Request, res) => userController.updateProfile(req, res));

router.post('/forgot', (req: Request, res) => userController.postResetPassword(req, res));

router.get('/reset/:token', (req: Request, res) => userController.checkToken(req, res));

router.post('/reset/:token', userMiddleware.checkPasswordMatch, (req: Request, res) => userController.postPasswordReset(req, res));

router.get('/search', isAuthenticated, (req: Request, res) => userController.search(req, res));

export default router;
