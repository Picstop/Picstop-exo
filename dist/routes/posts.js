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
const express_1 = __importDefault(require("express"));
const posts_1 = __importDefault(require("../controllers/posts"));
const router = express_1.default.Router();
const Posts = new posts_1.default();
router.post('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () { return Posts.createPost(req, res, next); }));
router.get('/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () { return Posts.getPost(req, res, next); }));
router.delete('/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () { return Posts.deletePost(req, res, next); }));
router.get('/user', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () { return Posts.getUserPosts(req, res, next); }));
router.patch('/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () { return Posts.updatePostCaption(req, res, next); }));
exports.default = router;
//# sourceMappingURL=posts.js.map