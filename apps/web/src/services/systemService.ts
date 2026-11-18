import type {
  ApiSuccessEnvelope,
  EchoCheckInput,
  EchoCheckResult,
  HealthStatus,
  SystemMeta,
} from '@nexora/shared';
import { apiClient } from '../lib/apiClient';

export async function fetchHealthStatus(): Promise<HealthStatus> {
  const response = await apiClient.get<ApiSuccessEnvelope<HealthStatus>>('/health');
  return response.data.data;
}

export async function fetchSystemMeta(): Promise<SystemMeta> {
  const response = await apiClient.get<ApiSuccessEnvelope<SystemMeta>>('/system/meta');
  return response.data.data;
}

export async function submitEchoCheck(payload: EchoCheckInput): Promise<EchoCheckResult> {
  const response = await apiClient.post<ApiSuccessEnvelope<EchoCheckResult>>(
    '/system/echo-check',
    payload,
  );
  return response.data.data;
}
