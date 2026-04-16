import { Router, Request, Response } from 'express';
import { ResponseUtil } from '../utils/response';
import { HealthCheckResponse } from '../types';

const router = Router();

const startTime = Date.now();

router.get('/', (req: Request, res: Response) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  const healthData: HealthCheckResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime,
  };

  res.json(ResponseUtil.success(healthData));
});

export default router;
