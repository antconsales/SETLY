import { useEffect, useState } from 'react';
import { initDatabase } from '@/db/client';
import { useExerciseStore } from '@/stores';

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchExercises } = useExerciseStore();

  useEffect(() => {
    async function init() {
      try {
        // Initialize database and seed default exercises
        await initDatabase();
        // Load exercises into store
        await fetchExercises();
        setIsReady(true);
      } catch (err) {
        console.error('Database initialization error:', err);
        setError('Failed to initialize database');
      }
    }

    init();
  }, [fetchExercises]);

  return { isReady, error };
}
