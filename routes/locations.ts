import { body, validationResult } from 'express-validator';
import express, { Request, Response } from 'express';

import LocationController from '../controllers/locations';
import LocationMiddleware from '../middleware/locations';

const locMiddleware = new LocationMiddleware();
const checkProximity = locMiddleware.checkProximity;
const validateLocation = locMiddleware.validateLocation;
const validateLocInput = locMiddleware.validateQueryInput;

const locations = new LocationController();
const router = express.Router();

router.post('/location', validateLocation, checkProximity, async (req: Request, res: Response) => locations.addLocation(req, res));

router.get('/location', validateLocInput, async (req: Request, res: Response) => locations.findNearby(req, res));

export default router;
