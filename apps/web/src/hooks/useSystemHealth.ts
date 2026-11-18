import type { EchoCheckInput } from '@nexora/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchHealthStatus, fetchSystemMeta, submitEchoCheck } from '../services/systemService';

export function useHealthQuery() {
  return useQuery({
    queryKey: ['system', 'health'],
    queryFn: fetchHealthStatus,
    retry: 1,
  });
}

export function useSystemMetaQuery() {
  return useQuery({
    queryKey: ['system', 'meta'],
    queryFn: fetchSystemMeta,
    retry: 1,
  });
}

export function useEchoCheckMutation() {
  return useMutation({
    mutationFn: (payload: EchoCheckInput) => submitEchoCheck(payload),
  });
}
