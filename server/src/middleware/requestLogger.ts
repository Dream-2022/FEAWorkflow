import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  logger.info(`Incoming request: ${method} ${originalUrl} from ${ip}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    logger.info(`Request completed: ${method} ${originalUrl} - ${statusCode} (${duration}ms)`);
  });

  next();
};
