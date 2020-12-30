"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const dotenv = __importStar(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const userController = __importStar(require("./controllers/user"));
const database_1 = __importDefault(require("./database/database"));
const locations_1 = __importDefault(require("./routes/locations"));
dotenv.config();
const app = express_1.default();
const port = process.env.PORT || 3000;
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.post('/signup', userController.postSignup);
app.post('/login', userController.postLogin);
app.post('/logout', userController.logout);
app.use('/locations', locations_1.default);
database_1.default.then(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Successfully Connected to MongoDB');
    /* const location = await Location.find({}).exec();
    const quadrant = await Quadrant.findById('1').exec();
    location.forEach((e) => {
        quadrant!.locations.push(e._id);
    });
    await quadrant!.save();
    console.log('Saved'); */
}))
    .catch((err) => console.log(err));
app.listen(port, () => {
    console.log(`Ready on port ${port}`);
});
//# sourceMappingURL=index.js.map