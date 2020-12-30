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
const location_1 = __importDefault(require("../models/location"));
const quadrant_1 = __importDefault(require("../models/quadrant"));
const lodash_1 = __importDefault(require("lodash"));
/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */
class QuadrantController {
    findBounds(quadrantId) {
        let dims = {
            minLat: -90,
            minLong: -180,
            maxLat: 90,
            maxLong: 180,
        };
        const quadArray = quadrantId.split('');
        quadArray.forEach((e) => {
            e = Number(e);
            switch (e) {
                case 0:
                    dims = {
                        minLat: (dims.maxLat - dims.minLat) / 2 + dims.minLat,
                        minLong: (dims.maxLong - dims.minLong) / 2 + dims.minLong,
                        maxLat: dims.maxLat,
                        maxLong: dims.maxLong,
                    };
                    break;
                case 1:
                    dims = {
                        minLat: (dims.maxLat - dims.minLat) / 2 + dims.minLat,
                        minLong: dims.minLong,
                        maxLat: dims.maxLat,
                        maxLong: (dims.maxLong - dims.minLong) / 2 + dims.minLong,
                    };
                    break;
                case 2:
                    dims = {
                        minLat: dims.minLat,
                        minLong: dims.minLong,
                        maxLat: (dims.maxLat - dims.minLat) / 2 + dims.minLat,
                        maxLong: (dims.maxLong = dims.minLong) / 2 + dims.minLong,
                    };
                    break;
                case 3:
                    dims = {
                        minLat: dims.minLat,
                        minLong: (dims.maxLong - dims.minLong) / 2 + dims.minLong,
                        maxLat: (dims.maxLat - dims.minLat) / 2 + dims.minLat,
                        maxLong: dims.maxLong,
                    };
                    break;
                default:
                    return dims;
            }
        });
        return dims;
    }
    addLocation(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { lat, long, name, author, } = req.body;
                const isOffical = author === 'Picstop';
                // check params
                if (!lat || !long || !name || !author) {
                    return res.status(400).json({ success: false, message: 'Missing parameters' });
                }
                // check proximity for locations that are too close
                const nearbyLocs = yield location_1.default.find({
                    geoLocation: {
                        $near: {
                            $maxDistance: 10,
                            $geometry: { type: 'Point', coordinates: [lat, long] },
                        },
                    },
                }).exec();
                if (nearbyLocs.length !== 0) {
                    return res.status(500).json({
                        success: false,
                        message: 'There is a pre-established nearby location within 10 meters.',
                    });
                }
                // instantiating new location to access location id
                const addLoc = new location_1.default({
                    geoLocation: { type: 'Point', coordinates: [lat, long] },
                    name,
                    author,
                    isOffical,
                });
                // Finding quadrant for location, if leaf has less than 10 locs, add location, else grow tree
                const leafQuad = yield this.findLeaf(lat, long, this.findNextBounds('', lat, long));
                const leafQuadInfo = yield quadrant_1.default.findById(leafQuad);
                // console.log(leafQuadInfo!.locations);
                if (leafQuadInfo.locations.length < 10) {
                    leafQuadInfo.locations.push(addLoc._id);
                    leafQuadInfo.save()
                        .then(() => addLoc.save())
                        .then(() => res.status(200).json({ success: true, message: addLoc }))
                        .catch((err) => res.status(500).json({ success: false, message: err }));
                }
                else {
                    addLoc.save().then(() => {
                        this.growTree(leafQuad, addLoc)
                            .then(() => res.status(200).json({ success: true, message: addLoc, grew: true }))
                            .catch((err) => res.status(500).json({ success: false, message: err }));
                    });
                }
            }
            catch (error) {
                return res.status(500).json({ success: false, message: error });
            }
            return res.status(400).json({ success: false, message: 'Unknown error adding location' });
        });
    }
    growTree(quadrantId, location) {
        return __awaiter(this, void 0, void 0, function* () {
            let newQuad = `${quadrantId}0`;
            const quadrant = yield quadrant_1.default.findById(quadrantId);
            // console.log(`quadrant: ${quadrant}`);
            // console.log(location);
            // finding locations in quadrant, then pushing new location
            let locs = yield location_1.default.find({ _id: { $in: quadrant === null || quadrant === void 0 ? void 0 : quadrant.locations } });
            if (location) {
                locs.push(location);
            }
            locs = lodash_1.default.uniq(locs);
            let newDims = {
                minLat: -90,
                minLong: -180,
                maxLat: 90,
                maxLong: 180,
            };
            quadrant_1.default.updateOne({ _id: quadrantId }, { isLeaf: false })
                .exec()
                // Quadrant.updateOne({ _id: quadrantId }, { isLeaf: false, $unset: { locations: 1 } }).exec()
                .then((result) => {
                return location;
            })
                // console.log('parent quad updated');
                .catch((error) => {
                throw new Error(error);
            });
            for (let i = 0; i < 4; i++) {
                newDims = this.findBounds(newQuad);
                const addLocs = [];
                for (let j = 0; j < locs.length; j++) {
                    if (this.checkBounds(locs[j].geoLocation.coordinates[0], locs[j].geoLocation.coordinates[1], newDims)) {
                        addLocs.push(locs[j]);
                    }
                }
                const createQuad = new quadrant_1.default({
                    _id: newQuad,
                    locations: [],
                    minLat: newDims.minLat,
                    minLong: newDims.minLong,
                    maxLat: newDims.maxLat,
                    maxLong: newDims.maxLong,
                    isLeaf: true,
                });
                addLocs.forEach((e) => {
                    createQuad.locations.push(e._id);
                });
                console.log('quadId', newQuad);
                console.log('locations in quad', createQuad.locations);
                const copy = newQuad.toString();
                createQuad
                    .save()
                    .then(() => {
                    if (createQuad.locations.length >= 10) {
                        this.growTree(copy, location);
                    }
                })
                    .catch((err) => {
                    throw new Error(err);
                });
                // increments index
                newQuad = `${newQuad.slice(0, -1)}${i + 1}`;
            }
        });
    }
    checkBounds(lat, long, dims) {
        return (lat > dims.minLat
            && lat <= dims.maxLat
            && long > dims.minLong
            && long <= dims.maxLong);
    }
    findNextBounds(quadrantId, lat, long) {
        for (let i = 0; i < 3; i++) {
            const bounds = this.findBounds(quadrantId + i);
            // console.log(i, ' ', bounds);
            // console.log(lat, long);
            if (this.checkBounds(lat, long, bounds)) {
                return i.toString();
            }
        }
        return '3';
    }
    findLeaf(lat, long, quadrantId) {
        return __awaiter(this, void 0, void 0, function* () {
            const quad = yield quadrant_1.default.findById(quadrantId);
            if (!quad) {
                return '';
            }
            if (quad && quad.isLeaf) {
                return quadrantId;
            }
            const next = yield this.findLeaf(lat, long, this.findNextBounds(quadrantId, lat, long));
            // console.log('nextbounds ', next);
            const out = next !== '' ? next : quadrantId;
            return out;
        });
    }
}
exports.default = QuadrantController;
//# sourceMappingURL=quadrants.js.map