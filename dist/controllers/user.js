"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.postLogin = exports.postSignup = void 0;
const passport_1 = __importDefault(require("passport"));
const user_1 = __importDefault(require("../models/user"));
const postSignup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = new user_1.default({
        email: req.body.email,
        password: req.body.password,
        username: req.body.username,
        name: req.body.name,
    });
    user_1.default.findOne({ email: req.body.email }, (err, existingUser) => {
        if (err) {
            return res.status(401).json({ success: false, message: err });
        }
        if (existingUser) {
            return res.status(403).json({ success: false, message: err });
        }
        user.save((e) => {
            if (e) {
                return res.status(403).json({ success: false, message: e });
            }
            req.logIn(user, (error) => {
                if (error) {
                    return res.status(401).json({ success: false, message: error });
                }
                passport_1.default.authenticate('local');
                return res.status(200).json({ success: true, message: 'user created' });
            });
        });
        passport_1.default.authenticate('local');
    });
});
exports.postSignup = postSignup;
const postLogin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    passport_1.default.authenticate('local', (err, user) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res
                .status(401)
                .json({ success: false, message: 'user doesn\'t exist' });
        }
        req.logIn(user, (e) => {
            if (e) {
                return res
                    .status(403)
                    .json({ success: false, message: 'login error' });
            }
            return res.status(200).json({ success: true, message: 'logged in' });
        });
    })(req, res, next);
});
exports.postLogin = postLogin;
const logout = (req, res) => {
    req.logout();
    return res.status(200).json({ success: true, message: 'logged out' });
};
exports.logout = logout;
//# sourceMappingURL=user.js.map