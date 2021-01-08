import express from "express";
import UserController from "../controllers/user";
const router = express.Router();
const userController = new UserController()
import { isAuthenticated } from "../config/passport"
import UserMiddleware from "../middleware/users"

const userMiddleware = new UserMiddleware()

router.post("/signup", userMiddleware.checkFields, userMiddleware.checkPasswordMatch, (req, res, next) => {
    return userController.postSignup(req, res);
})

router.post("/login", (req, res, next) => {
    return userController.postLogin(req, res, next);
})

router.post("/logout", isAuthenticated, (req, res, next) => {
    return userController.logout(req, res);
})
router.get("/:id", isAuthenticated, userMiddleware.allowedToViewProfile, (req, res) => {
    return userController.getUser(req, res);
})
 
router.get('/', isAuthenticated, (req, res) => {
    if(!req.user){
        return res.status(401).json({success: false, message: 'Cannot get user, please login' })
    }
    return res.status(200).json({ success: true, message: req.user })
})

router.post('/follow', isAuthenticated, userMiddleware.notThemself, userMiddleware.isBlocked, userMiddleware.alreadyFollowedOrRequested, (req, res) => {
    return userController.followUser(req, res);
})

router.post('/block', isAuthenticated, userMiddleware.notThemself,userMiddleware.alreadyBlocked, (req, res) => {
    return userController.blockUser(req, res);
})

router.post('/unblock', isAuthenticated, userMiddleware.notThemself,userMiddleware.alreadyUnblocked, (req, res) => {
    return userController.unblockUser(req, res);
})

router.post('/unfollow', isAuthenticated, userMiddleware.notThemself,userMiddleware.alreadyUnfollowed, (req, res) => {
    return userController.unfollowUser(req, res);
})

router.post('/request/remove', isAuthenticated, userMiddleware.notThemself,userMiddleware.didntRequestToFollow, (req, res) => {
    return userController.removeFollowRequest(req, res);
})

router.post('/request/accept', isAuthenticated, userMiddleware.notThemself,userMiddleware.followRequestExists, (req, res) => {
    return userController.acceptFollowRequest(req, res);
})

router.patch('/username', isAuthenticated, (req, res) => {
    return userController.updateUsername(req, res);
})

router.patch('/privacy', isAuthenticated, (req, res) => {
    return userController.updatePrivacy(req, res);
})

router.patch('/', isAuthenticated, (req, res) => {
   return userController.updateProfile(req, res);
})

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