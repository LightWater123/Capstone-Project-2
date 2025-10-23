import { useQuery } from '@tanstack/react-query';
import api from '../api/api';

export function usePredictiveMaintenance() {
  const { data: maintenanceDates = [], isLoading, error } = useQuery({
    queryKey: ['predictive-maintenance'],
    queryFn: async () => {
      const { data } = await api.get('/api/maintenance/predictive');
      return data; // ← should be an array of { asset_id, next_maintenance_checkup, … }
    },
    staleTime: 60_000, // 1 min cache
    refetchInterval: 10000, // 10 seconds refetch interval
    refetchOnMount: "always",
    refetchIntervalInBackground: false,
  });

  return { maintenanceDates, loading: isLoading, error };
}