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
const post_1 = __importDefault(require("../models/post"));
class PostController {
    createPost(req, res, next) {
        const { authorId, caption, location } = req.body;
        let post;
        if (!caption) {
            post = new post_1.default({
                authorId,
                location,
            });
        }
        else {
            post = new post_1.default({
                authorId,
                location,
                caption,
            });
        }
        return post.save()
            .then((result) => res.status(201).json({ success: true, message: result }))
            .catch((err) => res.status(500).json({ success: false, message: err.message }));
    }
    getPost(req, res, next) {
        const { id } = req.query;
        post_1.default.findById(id).exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => res.status(500).json({ success: false, message: err }));
    }
    getUserPosts(req, res, next) {
        const { userId } = req.body;
        post_1.default.find({ authorId: userId }).exec()
            .then((result) => res.status(200).json({
            success: true,
            message: {
                posts: result,
                count: result.length,
            },
        }))
            .catch((err) => res.status(500).json({ success: false, message: err }));
    }
    deletePost(req, res, next) {
        const { postId } = req.query;
        post_1.default.findByIdAndDelete(postId).exec()
            .then((result) => res.status(200).json({ success: true, message: `Successfully deleted post with result: ${result}` }))
            .catch((err) => res.status(500).json({ success: false, message: err }));
    }
    updatePostCaption(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const authorId = post_1.default.find({ authorId: req.user.id });
            const { caption, postId } = req.body;
            if (authorId !== req.user.id) {
                return res.status(401).json({ success: false, message: 'User is not author of post.' });
            }
            post_1.default.findByIdAndUpdate({ _id: postId }, { caption }).exec()
                .then((result) => res.status(200).json({ success: true, message: result }))
                .catch((err) => res.status(500).json({ success: false, message: err }));
        });
    }
}
exports.default = PostController;
//# sourceMappingURL=posts.js.map