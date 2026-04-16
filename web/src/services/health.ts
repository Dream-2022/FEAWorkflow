import { apiClient } from './api';
import type { HealthCheckResponse } from '../types';

export const healthApi = {
  check: () => apiClient.get<HealthCheckResponse>('/health'),
};
