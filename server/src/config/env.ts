import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  LOG_LEVEL: process.env.LOG_LEVEL || 'INFO',
  
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  DATABASE_URL: process.env.DATABASE_URL,
};
