import express from "express";
import UserController from "../controllers/user";
const router = express.Router();
const userController = new UserController()
import { isAuthenticated } from "../config/passport"
import UserMiddleware from "../middleware/users"

const userMiddleware = new UserMiddleware()

router.post("/signup",
    userMiddleware.checkFields,
    userMiddleware.checkPasswordMatch,
    (req, res) => userController.postSignup(req, res));

router.post("/login",
    (req, res, next) => userController.postLogin(req, res, next));

router.post("/logout",
    isAuthenticated,
    (req, res) => userController.logout(req, res));

router.get("/:id",
    isAuthenticated,
    userMiddleware.allowedToViewProfile,
    (req, res) => userController.getUser(req, res));

router.get('/', isAuthenticated, (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Cannot get user, please login' })
    }
    return res.status(200).json({ success: true, message: req.user })
})

router.post('/follow',
    isAuthenticated,
    userMiddleware.notThemself,
    userMiddleware.isBlocked,
    userMiddleware.alreadyFollowedOrRequested,
    (req, res) => userController.followUser(req, res));

router.post('/block',
    isAuthenticated,
    userMiddleware.notThemself,
    userMiddleware.alreadyBlocked,
    (req, res) => userController.blockUser(req, res));

router.post('/unblock',
    isAuthenticated,
    userMiddleware.notThemself,
    userMiddleware.alreadyUnblocked,
    (req, res) => userController.unblockUser(req, res));

router.post('/unfollow',
    isAuthenticated,
    userMiddleware.notThemself,
    userMiddleware.alreadyUnfollowed,
    (req, res) => userController.unfollowUser(req, res));

router.post('/request/remove',
    isAuthenticated,
    userMiddleware.notThemself,
    userMiddleware.didntRequestToFollow,
    (req, res) => userController.removeFollowRequest(req, res));

router.post('/request/accept',
    isAuthenticated, userMiddleware.notThemself,
    userMiddleware.followRequestExists,
    (req, res) => userController.acceptFollowRequest(req, res));

router.patch('/username',
    isAuthenticated,
    (req, res) => userController.updateUsername(req, res));

router.patch('/privacy',
    isAuthenticated,
    (req, res) => userController.updatePrivacy(req, res));

router.patch('/',
    isAuthenticated,
    (req, res) => userController.updateProfile(req, res));

router.post('/forgot', (req, res) => {
    return userController.postResetPassword(req, res);
})

router.get('/reset/:token', (req, res) => {
    return userController.checkToken(req, res);
})

router.post('/reset/:token', userMiddleware.checkPasswordMatch, (req, res) => {
    return userController.postPasswordReset(req, res);
})

export default router;
