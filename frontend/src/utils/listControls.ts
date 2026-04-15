export function parsePageParam(value: string | null | undefined) {
  const parsed = Number(value || '1');
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function getVisibleRange(total: number, page: number, pageSize: number, currentCount: number) {
  if (total === 0 || currentCount === 0) {
    return { start: 0, end: 0 };
  }

  const start = (page - 1) * pageSize + 1;
  return { start, end: start + currentCount - 1 };
}
