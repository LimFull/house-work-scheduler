import { useEffect, useState, useCallback } from 'react';

interface Props {
  year: number;
  month: number;
}

function useSchedule({ year, month }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/scheduler/monthly/${year}/${month}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  return { loading, error };
}

export default useSchedule;
