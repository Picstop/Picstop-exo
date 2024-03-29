import express, { Response } from 'express';
import { NewRequest as Request } from '../types/types';
import LocationController from '../controllers/locations';
import LocationMiddleware from '../middleware/locations';
import { isAuthenticated } from '../config/passport';

const locMiddleware = new LocationMiddleware();
const { checkProximity, validateLocation } = locMiddleware;
const validateLocInput = locMiddleware.validateQueryInput;
const { isLocation, alreadySaved } = locMiddleware;

const locations = new LocationController();
const router = express.Router();

router.post('/location', isAuthenticated, validateLocation, checkProximity, async (req: Request, res: Response) => locations.addLocation(req, res));

router.post('/near', isAuthenticated, validateLocInput, async (req: Request, res: Response) => {
    const newLocs = [];
    return locations.findNearby(req, res, newLocs);
});

router.get('/posts/:id', isAuthenticated, async (req: Request, res: Response) => locations.getExamplePics(req, res));

router.post('/save', isAuthenticated, isLocation, alreadySaved, async (req: Request, res) => locations.saveLocation(req, res));

router.get('/:id', isAuthenticated, async (req: Request, res) => locations.getLocationById(req, res));
export default router;
