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
const comment_1 = __importDefault(require("../models/comment"));
class CommentController {
    createComment(req, res, next) {
        const { postId, comment } = req.body;
        const newComment = new comment_1.default({
            postId,
            comment,
        });
        return newComment
            .save()
            .then((result) => res.status(201).json({ success: true, message: result }))
            .catch((err) => res.status(500).json({ success: false, message: err.message }));
    }
    getComment(req, res, next) {
        const { id } = req.query;
        comment_1.default.findById(id)
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => res.status(500).json({ success: false, message: err }));
    }
    editComment(req, res, next) {
        const { id } = req.query;
        const { comment } = req.body;
        comment_1.default.findByIdAndUpdate(id, { comment })
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => res.status(500).json({ success: false, message: err }));
    }
    deleteComment(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.query;
            const commentAuthor = yield comment_1.default.findById(id).exec();
            if (commentAuthor !== req.user._id) {
                return res
                    .status(401)
                    .json({ success: false, message: 'User is not author of post.' });
            }
            yield comment_1.default.findByIdAndRemove(id)
                .exec()
                .then((result) => res.status(200).json({ success: true, message: result }))
                .catch((err) => res.status(500).json({ success: false, message: err }));
        });
    }
    likeComment(req, res, next) {
        const { commentId } = req.query;
        comment_1.default.findByIdAndUpdate(commentId, { $push: { likes: req.user.id } })
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => res.status(500).json({ success: false, message: err }));
    }
}
exports.default = CommentController;
//# sourceMappingURL=comments.js.map