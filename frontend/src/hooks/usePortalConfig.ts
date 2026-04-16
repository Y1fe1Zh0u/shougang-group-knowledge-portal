import { useEffect, useState } from 'react';
import { fetchPortalContentConfig } from '../api/content';
import type { PortalConfig } from '../api/adminConfig';

export function usePortalConfig() {
  const [config, setConfig] = useState<PortalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    void (async () => {
      try {
        const next = await fetchPortalContentConfig();
        if (!active) return;
        setConfig(next);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : '配置加载失败');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return {
    config,
    loading,
    error,
  };
}
