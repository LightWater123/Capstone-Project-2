import { useQuery } from '@tanstack/react-query';
import api from '@/api/api';
import { queryClient } from '@/App';

// Fetch audit logs API function
const fetchAuditLogs = async (page = 1, perPage = 10) => {
  try {
    const params = {
      page,
      per_page: perPage,
      sort_by: 'timestamp',
      sort_order: 'desc' // Sort from latest to oldest
    };
    
    const response = await api.get('/api/audit/logs', { params });
    
    if (response.data.success) {
      return {
        data: response.data.data.data,
        currentPage: response.data.data.current_page,
        lastPage: response.data.data.last_page,
        total: response.data.data.total,
        perPage: perPage
      };
    }
    throw new Error('Failed to fetch audit logs');
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};

// Fetch recent audit logs count for notification badge
const fetchRecentAuditLogsCount = async () => {
  try {
    const params = {
      per_page: 1,
      sort_by: 'timestamp',
      sort_order: 'desc'
    };
    
    const response = await api.get('/api/audit/logs', { params });
    
    if (response.data.success) {
      return response.data.data.total;
    }
    return 0;
  } catch (error) {
    console.error('Error fetching recent audit logs count:', error);
    return 0;
  }
};

// Constants for localStorage keys
const STORAGE_KEYS = {
  TOTAL_LOG_COUNT: 'audit_logs_total_count',
  FIRST_LOG_ID: 'audit_logs_first_log_id'
};

// Get stored total count from localStorage
const getStoredTotalCount = () => {
  try {
    const count = localStorage.getItem(STORAGE_KEYS.TOTAL_LOG_COUNT);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('Error getting stored total count:', error);
    return 0;
  }
};

// Set total count in localStorage
const setStoredTotalCount = (count) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TOTAL_LOG_COUNT, count.toString());
    queryClient.invalidateQueries({queryKey: ['audit-logs-count']})
  } catch (error) {
    console.error('Error storing total count:', error);
  }
};

// Get stored first log ID from localStorage
const getStoredFirstLogId = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.FIRST_LOG_ID);
  } catch (error) {
    console.error('Error getting stored first log ID:', error);
    return null;
  }
};

// Set first log ID in localStorage
const setStoredFirstLogId = (logId) => {
  try {
    localStorage.setItem(STORAGE_KEYS.FIRST_LOG_ID, logId);
    queryClient.invalidateQueries({queryKey: ['audit-logs-count']})

  } catch (error) {
    console.error('Error storing first log ID:', error);
  }
};

// Reset localStorage values
const resetLocalStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.TOTAL_LOG_COUNT);
    localStorage.removeItem(STORAGE_KEYS.FIRST_LOG_ID);
    queryClient.invalidateQueries({queryKey: ['audit-logs-count']})
  } catch (error) {
    console.error('Error resetting localStorage:', error);
  }
};

// Custom hook for fetching audit logs
export const useAuditLogs = (page = 1, perPage = 10) => {
  return useQuery({
    queryKey: ['audit-logs', page, perPage],
    queryFn: () => fetchAuditLogs(page, perPage),
    keepPreviousData: true,
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onSuccess: (data) => {
      // Update localStorage with current data when fetch is successful
      if (data && data.total > 0) {
        setStoredTotalCount(data.total);
        if (data.data && data.data.length > 0) {
          const firstLog = data.data[0]; // Since logs are sorted by timestamp desc
          if (firstLog.id) {
            setStoredFirstLogId(firstLog.id);
          }
        }
      }
    }
  });
};

// Custom hook for fetching recent audit logs count (read-only, doesn't update storage)
export const useRecentAuditLogsCount = () => {
  return useQuery({
    queryKey: ['audit-logs-count'],
    queryFn: async () => {
      try {
        const params = {
          per_page: 1,
          sort_by: 'timestamp',
          sort_order: 'desc'
        };
        
        const response = await api.get('/api/audit/logs', { params });
        
        if (response.data.success) {
          const totalCount = response.data.data.total;
          const storedTotalCount = getStoredTotalCount();
          
          // If stored count is greater than API count, reset localStorage
          if (storedTotalCount > totalCount) {
            resetLocalStorage();
            return 0;
          }
          
          // Calculate new logs count as difference between current and stored
          const newLogsCount = totalCount - storedTotalCount;
          return newLogsCount > 0 ? newLogsCount : 0;
        }
        return 0;
      } catch (error) {
        console.error('Error fetching recent audit logs count:', error);
        return 0;
      }
    },
    refetchInterval: 5 * 1000, // Refetch every 30 seconds
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true
  });
};

// Simple function to reset the counter (no hooks, no infinite loops)
// export const resetAuditLogsCounter = () => {
//   try {
//     resetLocalStorage();
//   } catch (error) {
//     console.error('Error resetting counter:', error);
//   }
// };

// Function to manually update storage (called from modal)
export const updateAuditLogsStorage = () => {
  try {
    const params = {
      per_page: 1,
      sort_by: 'timestamp',
      sort_order: 'desc'
    };
    
    api.get('/api/audit/logs', { params }).then((response) => {
      if (response.data.success) {
        const totalCount = response.data.data.total;
        const firstLog = response.data.data.data[0];
        const firstLogId = firstLog ? firstLog.id : null;
        
        // Update localStorage with new values
        setStoredTotalCount(totalCount);
        if (firstLogId) {
          setStoredFirstLogId(firstLogId);
        }
      }
    });
  } catch (error) {
    console.error('Error updating audit logs storage:', error);
  }
};