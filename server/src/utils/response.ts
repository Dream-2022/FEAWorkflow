import { ApiResponse } from '../types';

export class ResponseUtil {
  static success<T>(data?: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
    };
  }

  static error(error: string, data?: any): ApiResponse {
    return {
      success: false,
      error,
      data,
    };
  }
}
