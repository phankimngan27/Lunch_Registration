import { useState, useEffect } from 'react';
import api from '../api/axios';

interface RegistrationConfig {
  monthly_cutoff_day: number;
  daily_deadline_hour: number;
}

const DEFAULT_CONFIG: RegistrationConfig = {
  monthly_cutoff_day: 25,
  daily_deadline_hour: 20,
};

export function useRegistrationConfig() {
  const [config, setConfig] = useState<RegistrationConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await api.get('/config');
        setConfig(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load config');
        // Keep default config on error
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { config, loading, error };
}
