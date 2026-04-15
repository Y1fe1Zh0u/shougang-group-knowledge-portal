import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parsePageParam } from '../utils/listControls';

export function useListControls() {
  const [params, setParams] = useSearchParams();
  const page = parsePageParam(params.get('page'));
  const resultsTopRef = useRef<HTMLDivElement | null>(null);
  const previousPageRef = useRef(page);

  useEffect(() => {
    if (page !== previousPageRef.current) {
      resultsTopRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
      previousPageRef.current = page;
    }
  }, [page]);

  const setFilter = (key: string, value: string, resetPage = true) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (resetPage) next.set('page', '1');
    setParams(next);
  };

  return {
    params,
    page,
    resultsTopRef,
    setFilter,
    setParams,
  };
}
