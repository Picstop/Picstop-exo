import express, { Request, Response } from 'express';

import { getSignedUrlPfp } from '../services/imageUpload';

const router = express.Router();

router.post('/geturl/pfp', async (req: Request, res: Response) => getSignedUrlPfp(req, res));

export default router;
