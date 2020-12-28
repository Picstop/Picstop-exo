import express, { Request, Response } from 'express';

import QuadrantController from '../controllers/quadrants';

const locations = new QuadrantController();
const router = express.Router();

router.post('/location', async (req: Request, res: Response) => locations.addLocation(req, res));

export default router;
