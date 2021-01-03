import express from "express";
import UserController from "../controllers/user";
const router = express.Router();
const userController = new UserController()
import { isAuthenticated } from "../config/passport"
import { body } from 'express-validator'

router.post("/signup", 
    (req, res, next) => {
    userController.postSignup(req, res);
})

router.post("/login", (req, res, next) => {
    userController.postLogin(req, res);
})

router.post("/logout", (req, res, next) => {
    userController.logout(req, res);
})

router.put("/update-user", isAuthenticated, (req, res, next) => {
    userController.update(req, res, next);
})

router.get("/user/:id", isAuthenticated, (req, res, next) => {
    userController.getUser(req, res, next);
})

export default router;