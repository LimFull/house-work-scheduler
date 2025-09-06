import { useState, useCallback } from 'react';

interface NotionApiResponse {
  success: boolean;
  data: unknown;
  timestamp: string;
}

export function useNotionApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 환경 변수에서 API URL 가져오기
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchDatabase =
    useCallback(async (): Promise<NotionApiResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}/notion/database`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch database');
        }

        const data: NotionApiResponse = await response.json();
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    }, [apiUrl]);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${apiUrl}/notion/health`);
      return response.ok;
    } catch {
      return false;
    }
  }, [apiUrl]);

  return {
    fetchDatabase,
    checkHealth,
    loading,
    error,
  };
}
