import { ApiResponse } from '../types';
import { Response } from 'express';

export class ResponseUtil {
  static success<T>(res: Response, data?: T, message?: string): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
    };
    res.json(response);
  }

  static error(res: Response, error: string, statusCode = 500): void {
    const response: ApiResponse = {
      success: false,
      error,
    };
    res.status(statusCode).json(response);
  }
}
