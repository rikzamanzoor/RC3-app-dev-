import { useState, useCallback } from 'react';

/**
 * Hook to manage async actions (mutations/submits) with loading states and normalized errors.
 * Ensures `run()` is a no-op while an action is already in flight.
 */
export function useAsyncAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (asyncFn) => {
      if (loading) return null;
      setLoading(true);
      setError(null);
      try {
        const result = await asyncFn();
        setLoading(false);
        return { success: true, data: result };
      } catch (err) {
        setLoading(false);
        const normalized = {
          code: err?.code || 'ERROR',
          message: err?.message || 'Action failed. Please try again.',
          field: err?.field,
        };
        setError(normalized);
        return { success: false, error: normalized };
      }
    },
    [loading]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    run,
    clearError,
    setError,
  };
}

